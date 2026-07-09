import type { Document } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";

export interface DocumentOperation {
  readonly id: string;
  readonly type: string;
  readonly timestamp: number;

  apply(document: Document): Document;

  invert(originalDocument: Document): DocumentOperation;

  validate(document: Document): ValidationError | null;

  getInvalidationScope(): InvalidationScope;

  describe(): string;
}
