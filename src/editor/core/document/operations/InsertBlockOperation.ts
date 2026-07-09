import type { Document, Block } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";
import type { DocumentOperation } from "./DocumentOperation.ts";
import { validateBlockIndex, validateUniqueBlockId } from "../validation/OperationValidator.ts";
import { DeleteBlockOperation } from "./DeleteBlockOperation.ts";

let opCounter = 0;

export class InsertBlockOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "insert-block";
  readonly timestamp: number;

  readonly block: Block;
  readonly index: number;

  constructor(
    block: Block,
    index: number,
  ) {
    this.id = `insert-block-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.block = block;
    this.index = index;
  }

  apply(document: Document): Document {
    const newBlocks = [...document.blocks];
    newBlocks.splice(this.index, 0, this.block);
    return { ...document, blocks: newBlocks };
  }

  invert(_originalDocument: Document): DocumentOperation {
    return new DeleteBlockOperation(this.block.id);
  }

  validate(document: Document): ValidationError | null {
    const idxErr = validateBlockIndex(document, this.index);
    if (idxErr) return idxErr;

    const dupErr = validateUniqueBlockId(document, this.block.id);
    if (dupErr) return dupErr;

    if (!this.block.id) {
      return {
        code: "EMPTY_BLOCK_ID",
        message: "Cannot insert block with empty ID",
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
    return `InsertBlock(type="${this.block.type}", id="${this.block.id}", index=${this.index})`;
  }
}
