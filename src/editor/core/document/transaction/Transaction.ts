import type { DocumentOperation } from "../operations/DocumentOperation.ts";

export interface Transaction {
  id: string;
  operations: DocumentOperation[];
  metadata?: Record<string, unknown>;
}
