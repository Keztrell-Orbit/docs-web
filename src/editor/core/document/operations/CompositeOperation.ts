import type { Document } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";
import type { DocumentOperation } from "./DocumentOperation.ts";

let opCounter = 0;

export class CompositeOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "composite";
  readonly timestamp: number;

  readonly operations: DocumentOperation[];

  constructor(
    operations: DocumentOperation[],
  ) {
    this.id = `composite-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.operations = operations;
  }

  apply(document: Document): Document {
    let doc = document;
    for (const op of this.operations) {
      doc = op.apply(doc);
    }
    return doc;
  }

  invert(originalDocument: Document): DocumentOperation {
    const inverses: DocumentOperation[] = [];
    let doc = originalDocument;
    for (const op of this.operations) {
      inverses.unshift(op.invert(doc));
      doc = op.apply(doc);
    }
    return new CompositeOperation(inverses);
  }

  validate(document: Document): ValidationError | null {
    let doc = document;
    for (const op of this.operations) {
      const error = op.validate(doc);
      if (error) return error;
      doc = op.apply(doc);
    }
    return null;
  }

  getInvalidationScope(): InvalidationScope {
    for (const op of this.operations) {
      if (op.getInvalidationScope() === "document") return "document";
    }
    for (const op of this.operations) {
      if (op.getInvalidationScope() === "page") return "page";
    }
    return "block";
  }

  describe(): string {
    return `Composite(${this.operations.map((o) => o.describe()).join("; ")})`;
  }
}
