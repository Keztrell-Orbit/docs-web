import type { Document } from "../../../types.ts";
import type { CommittedTransaction } from "../../types.ts";
import { TransactionHistory } from "../transaction/TransactionHistory.ts";
import { TransactionExecutor } from "../transaction/TransactionExecutor.ts";

export class RedoManager {
  readonly #history: TransactionHistory;
  readonly #executor: TransactionExecutor;

  constructor(
    history: TransactionHistory,
    executor: TransactionExecutor,
  ) {
    this.#history = history;
    this.#executor = executor;
  }

  canRedo(): boolean {
    return this.#history.canRedo();
  }

  redo(currentDocument: Document): { document: Document; transaction: CommittedTransaction } | null {
    const tx = this.#history.redo();
    if (!tx) return null;

    const result = this.#executor.applyInverse(tx.operations, currentDocument);
    return { document: result.document, transaction: tx };
  }
}
