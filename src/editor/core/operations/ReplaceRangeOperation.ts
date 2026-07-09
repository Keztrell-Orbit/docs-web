import type { Document } from "../../types.ts";
import type { InvalidationScope, ValidationError } from "../types.ts";
import type { DocumentOperation } from "../document/operations/DocumentOperation.ts";
import { CompositeOperation } from "../document/operations/CompositeOperation.ts";
import { DeleteRangeOperation } from "./DeleteRangeOperation.ts";
import { InsertTextOperation } from "../document/operations/InsertTextOperation.ts";

let opCounter = 0;

export class ReplaceRangeOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "replace-range";
  readonly timestamp: number;

  readonly startBlockId: string;
  readonly startOffset: number;
  readonly endBlockId: string;
  readonly endOffset: number;
  readonly middleBlockIds: string[];
  readonly newText: string;

  constructor(
    startBlockId: string,
    startOffset: number,
    endBlockId: string,
    endOffset: number,
    middleBlockIds: string[],
    newText: string,
  ) {
    this.id = `replace-range-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.startBlockId = startBlockId;
    this.startOffset = startOffset;
    this.endBlockId = endBlockId;
    this.endOffset = endOffset;
    this.middleBlockIds = middleBlockIds;
    this.newText = newText;
  }

  apply(document: Document): Document {
    const deleteOp = new DeleteRangeOperation(
      this.startBlockId, this.startOffset,
      this.endBlockId, this.endOffset,
      this.middleBlockIds,
    );
    let doc = deleteOp.apply(document);

    if (this.newText) {
      const insertOp = new InsertTextOperation(this.startBlockId, this.startOffset, this.newText);
      doc = insertOp.apply(doc);
    }

    return doc;
  }

  invert(originalDocument: Document): DocumentOperation {
    const deleteOp = new DeleteRangeOperation(
      this.startBlockId, this.startOffset,
      this.endBlockId, this.endOffset,
      this.middleBlockIds,
    );
    let doc = originalDocument;
    if (this.newText) {
      const insertOp = new InsertTextOperation(this.startBlockId, this.startOffset, this.newText);
      doc = insertOp.apply(doc);
    }
    const inverseDelete = deleteOp.invert(originalDocument);
    return inverseDelete;
  }

  validate(document: Document): ValidationError | null {
    return null;
  }

  getInvalidationScope(): InvalidationScope {
    return "document";
  }

  describe(): string {
    return `ReplaceRange(start="${this.startBlockId}"@${this.startOffset}, end="${this.endBlockId}"@${this.endOffset}, text="${this.newText}")`;
  }
}
