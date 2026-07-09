import type { Document } from "../../../types.ts";
import type { CommittedTransaction } from "../../types.ts";
import { TransactionHistory } from "../transaction/TransactionHistory.ts";
import { TransactionExecutor } from "../transaction/TransactionExecutor.ts";

export class UndoManager {
  readonly #history: TransactionHistory;
  readonly #executor: TransactionExecutor;

  constructor(
    history: TransactionHistory,
    executor: TransactionExecutor,
  ) {
    this.#history = history;
    this.#executor = executor;
  }

  canUndo(): boolean {
    return this.#history.canUndo();
  }

  undo(currentDocument: Document): { document: Document; transaction: CommittedTransaction } | null {
    const tx = this.#history.undo();
    if (!tx) return null;

    const result = this.#executor.applyInverse(tx.inverseOperations, currentDocument);
    return { document: result.document, transaction: tx };
  }
}
