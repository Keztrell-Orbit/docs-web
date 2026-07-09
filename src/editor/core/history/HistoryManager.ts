import type { DocumentOperation } from "../document/operations/DocumentOperation.ts";
import type { CommittedTransaction } from "../types.ts";
import { UndoStack } from "./UndoStack.ts";
import { RedoStack } from "./RedoStack.ts";
import { createSnapshotFromCommitted, type ExecutionSnapshot } from "./ExecutionSnapshot.ts";

export class HistoryManager {
  readonly undoStack: UndoStack;
  readonly redoStack: RedoStack;

  constructor(maxDepth = 100) {
    this.undoStack = new UndoStack(maxDepth);
    this.redoStack = new RedoStack(maxDepth);
  }

  pushTransaction(committed: CommittedTransaction): void {
    const snapshot = createSnapshotFromCommitted(committed);
    this.undoStack.push(snapshot);
    this.redoStack.clear();
  }

  get canUndo(): boolean {
    return !this.undoStack.isEmpty;
  }

  get canRedo(): boolean {
    return !this.redoStack.isEmpty;
  }

  get undoDepth(): number {
    return this.undoStack.depth;
  }

  get redoDepth(): number {
    return this.redoStack.depth;
  }

  peekUndo(): ExecutionSnapshot | null {
    return this.undoStack.peek();
  }

  peekRedo(): ExecutionSnapshot | null {
    return this.redoStack.peek();
  }
}
