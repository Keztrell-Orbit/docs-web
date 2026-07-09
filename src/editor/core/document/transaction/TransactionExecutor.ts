import type { Document } from "../../../types.ts";
import type { ExecutionResult, CommittedTransaction } from "../../types.ts";
import type { Transaction } from "./Transaction.ts";
import type { DocumentOperation } from "../operations/DocumentOperation.ts";
import { TransactionEventBus } from "./TransactionEventBus.ts";
import { validateTransaction } from "./TransactionValidator.ts";

export class TransactionExecutor {
  #eventBus: TransactionEventBus;

  constructor(eventBus?: TransactionEventBus) {
    this.#eventBus = eventBus ?? new TransactionEventBus();
  }

  get eventBus(): TransactionEventBus {
    return this.#eventBus;
  }

  execute(
    transaction: Transaction,
    document: Document,
  ): ExecutionResult {
    this.#eventBus.emit("TransactionStarted", transaction);

    const startTime = performance.now();

    const validationErrors = validateTransaction(transaction, document);
    if (validationErrors.length > 0) {
      for (const err of validationErrors) {
        this.#eventBus.emit("OperationFailed", { transaction, error: err });
      }
      this.#eventBus.emit("TransactionRolledBack", { transaction, errors: validationErrors });
      return {
        success: false,
        errors: validationErrors,
        document,
        committed: null,
      };
    }

    const appliedOps: DocumentOperation[] = [];
    const inverseOps: DocumentOperation[] = [];
    let currentDoc = document;

    for (const op of transaction.operations) {
      this.#eventBus.emit("OperationApplied", { operation: op, document: currentDoc });

      const originalDoc = currentDoc;
      currentDoc = op.apply(originalDoc);

      const inverse = op.invert(originalDoc);
      appliedOps.push(op);
      inverseOps.unshift(inverse);
    }

    const endTime = performance.now();

    currentDoc = { ...currentDoc, version: (currentDoc.version || 0) + 1 };

    const committed: CommittedTransaction = {
      id: transaction.id,
      operations: appliedOps,
      inverseOperations: inverseOps,
      documentBefore: document,
      documentAfter: currentDoc,
      timestamp: Date.now(),
      duration: endTime - startTime,
      valid: true,
      errors: [],
    };

    this.#eventBus.emit("TransactionCommitted", committed);

    return {
      success: true,
      errors: [],
      document: currentDoc,
      committed,
    };
  }

  applyInverse(
    inverseOperations: DocumentOperation[],
    document: Document,
  ): ExecutionResult {
    let currentDoc = document;

    for (const op of inverseOperations) {
      currentDoc = op.apply(currentDoc);
    }

    currentDoc = { ...currentDoc, version: (currentDoc.version || 0) + 1 };

    return {
      success: true,
      errors: [],
      document: currentDoc,
      committed: null,
    };
  }
}
