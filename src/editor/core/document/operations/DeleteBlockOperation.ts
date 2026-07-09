import type { Document, Block } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";
import type { DocumentOperation } from "./DocumentOperation.ts";
import { validateBlockExists } from "../validation/OperationValidator.ts";
import { InsertBlockOperation } from "./InsertBlockOperation.ts";

let opCounter = 0;

export class DeleteBlockOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "delete-block";
  readonly timestamp: number;
  readonly block: Block | null;

  readonly blockId: string;

  constructor(
    blockId: string,
    block?: Block,
  ) {
    this.id = `delete-block-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.blockId = blockId;
    this.block = block ?? null;
  }

  apply(document: Document): Document {
    return {
      ...document,
      blocks: document.blocks.filter((b: Block) => b.id !== this.blockId),
    };
  }

  invert(originalDocument: Document): DocumentOperation {
    if (!this.block) {
      throw new Error(`Cannot invert DeleteBlockOperation for "${this.blockId}": no block data captured`);
    }
    const idx = originalDocument.blocks.findIndex((b: Block) => b.id === this.blockId);
    return new InsertBlockOperation(this.block, idx);
  }

  validate(document: Document): ValidationError | null {
    return validateBlockExists(document, this.blockId);
  }

  getInvalidationScope(): InvalidationScope {
    return "document";
  }

  describe(): string {
    return `DeleteBlock(id="${this.blockId}")`;
  }
}
