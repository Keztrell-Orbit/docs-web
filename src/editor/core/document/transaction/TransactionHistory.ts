import type { CommittedTransaction } from "../../types.ts";
import { TransactionEventBus } from "./TransactionEventBus.ts";

export class TransactionHistory {
  #undoStack: CommittedTransaction[] = [];
  #redoStack: CommittedTransaction[] = [];
  #maxDepth: number;
  #eventBus: TransactionEventBus;

  constructor(maxDepth = 100, eventBus?: TransactionEventBus) {
    this.#maxDepth = maxDepth;
    this.#eventBus = eventBus ?? new TransactionEventBus();
  }

  get eventBus(): TransactionEventBus {
    return this.#eventBus;
  }

  push(committed: CommittedTransaction): void {
    this.#undoStack.push(committed);
    this.#redoStack = [];
    if (this.#undoStack.length > this.#maxDepth) {
      this.#undoStack.shift();
    }
    this.#emitChange();
  }

  canUndo(): boolean {
    return this.#undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.#redoStack.length > 0;
  }

  undo(): CommittedTransaction | null {
    const tx = this.#undoStack.pop();
    if (tx) {
      this.#redoStack.push(tx);
      this.#emitChange();
    }
    return tx ?? null;
  }

  redo(): CommittedTransaction | null {
    const tx = this.#redoStack.pop();
    if (tx) {
      this.#undoStack.push(tx);
      this.#emitChange();
    }
    return tx ?? null;
  }

  peekUndo(): CommittedTransaction | null {
    return this.#undoStack[this.#undoStack.length - 1] ?? null;
  }

  peekRedo(): CommittedTransaction | null {
    return this.#redoStack[this.#redoStack.length - 1] ?? null;
  }

  get undoStack(): readonly CommittedTransaction[] {
    return this.#undoStack;
  }

  get redoStack(): readonly CommittedTransaction[] {
    return this.#redoStack;
  }

  get undoDepth(): number {
    return this.#undoStack.length;
  }

  get redoDepth(): number {
    return this.#redoStack.length;
  }

  clear(): void {
    this.#undoStack = [];
    this.#redoStack = [];
    this.#emitChange();
  }

  #emitChange(): void {
    this.#eventBus.emit("HistoryChanged", {
      undoDepth: this.undoDepth,
      redoDepth: this.redoDepth,
    });
  }
}
