import type { DocumentOperation } from "../document/operations/DocumentOperation.ts";
import type { CommittedTransaction } from "../types.ts";

export interface ExecutionSnapshot {
  id: string;
  operations: DocumentOperation[];
  inverseOperations: DocumentOperation[];
  timestamp: number;
}

export function createSnapshotFromCommitted(tx: CommittedTransaction): ExecutionSnapshot {
  return {
    id: tx.id,
    operations: [...tx.operations],
    inverseOperations: [...tx.inverseOperations],
    timestamp: tx.timestamp,
  };
}
