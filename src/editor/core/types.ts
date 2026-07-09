import type { Document, Block } from "../types.ts";
import type { DocumentOperation } from "./document/operations/DocumentOperation.ts";
export type { Document, Block }; // re-export for downstream consumers

export interface OperationResult {
  document: Document;
  inverse: DocumentOperation;
}

export type InvalidationScope = "document" | "page" | "block";

export interface ValidationError {
  code: string;
  message: string;
  operationId?: string;
  operationType?: string;
}

export interface CommittedTransaction {
  id: string;
  operations: DocumentOperation[];
  inverseOperations: DocumentOperation[];
  documentBefore: Document;
  documentAfter: Document;
  timestamp: number;
  duration: number;
  valid: boolean;
  errors: ValidationError[];
}

export type TransactionEvent =
  | "TransactionStarted"
  | "OperationApplied"
  | "OperationFailed"
  | "TransactionCommitted"
  | "TransactionRolledBack"
  | "HistoryChanged"
  | "LayoutInvalidated";

export interface ExecutionResult {
  success: boolean;
  errors: ValidationError[];
  document: Document;
  committed: CommittedTransaction | null;
}
