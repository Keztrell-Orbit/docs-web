import type { DocumentOperation } from "../operations/DocumentOperation.ts";
import type { Transaction } from "./Transaction.ts";

let txCounter = 0;

export class TransactionBuilder {
  #operations: DocumentOperation[] = [];

  add(op: DocumentOperation): this {
    this.#operations.push(op);
    return this;
  }

  addAll(ops: DocumentOperation[]): this {
    this.#operations.push(...ops);
    return this;
  }

  build(metadata?: Record<string, unknown>): Transaction {
    return {
      id: `tx-${Date.now()}-${txCounter++}`,
      operations: [...this.#operations],
      metadata,
    };
  }

  clear(): void {
    this.#operations = [];
  }

  get operations(): readonly DocumentOperation[] {
    return this.#operations;
  }

  get size(): number {
    return this.#operations.length;
  }
}
