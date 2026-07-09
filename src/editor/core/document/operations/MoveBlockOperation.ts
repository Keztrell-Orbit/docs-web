import type { Document, Block } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";
import type { DocumentOperation } from "./DocumentOperation.ts";
import { validateBlockExists } from "../validation/OperationValidator.ts";

let opCounter = 0;

export class MoveBlockOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "move-block";
  readonly timestamp: number;

  readonly blockId: string;
  readonly newIndex: number;

  constructor(
    blockId: string,
    newIndex: number,
  ) {
    this.id = `move-block-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.blockId = blockId;
    this.newIndex = newIndex;
  }

  apply(document: Document): Document {
    const idx = document.blocks.findIndex((b: Block) => b.id === this.blockId);
    if (idx === -1) return document;

    const block = document.blocks[idx];
    const newBlocks = document.blocks.filter((b: Block) => b.id !== this.blockId);
    const targetIndex = this.newIndex > idx ? this.newIndex - 1 : this.newIndex;
    newBlocks.splice(targetIndex, 0, block);
    return { ...document, blocks: newBlocks };
  }

  invert(originalDocument: Document): DocumentOperation {
    const currentIdx = originalDocument.blocks.findIndex((b: Block) => b.id === this.blockId);
    return new MoveBlockOperation(this.blockId, currentIdx);
  }

  validate(document: Document): ValidationError | null {
    const exists = validateBlockExists(document, this.blockId);
    if (exists) return exists;

    const currentIdx = document.blocks.findIndex((b: Block) => b.id === this.blockId);
    if (this.newIndex < 0 || this.newIndex >= document.blocks.length) {
      return {
        code: "INVALID_INDEX",
        message: `New index ${this.newIndex} out of bounds [0, ${document.blocks.length - 1}]`,
        operationId: this.id,
        operationType: this.type,
      };
    }
    if (this.newIndex === currentIdx) {
      return {
        code: "SAME_POSITION",
        message: `Block "${this.blockId}" is already at index ${currentIdx}`,
        operationId: this.id,
        operationType: this.type,
      };
    }
    return null;
  }

  getInvalidationScope(): InvalidationScope {
    return "document";
  }

  describe(): string {
    return `MoveBlock(id="${this.blockId}", index=${this.newIndex})`;
  }
}
