import type { Document, Block } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";
import type { DocumentOperation } from "./DocumentOperation.ts";
import { validateBlockExists } from "../validation/OperationValidator.ts";
import { generateBlockId } from "../../generateBlockId.ts";
import { DeleteBlockOperation } from "./DeleteBlockOperation.ts";

let opCounter = 0;

export class DuplicateBlockOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "duplicate-block";
  readonly timestamp: number;
  readonly newBlockId: string;
  readonly newBlock: Block | null;

  readonly blockId: string;

  constructor(
    blockId: string,
    newBlockId?: string,
    newBlock?: Block,
  ) {
    this.id = `dup-block-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.blockId = blockId;
    this.newBlockId = newBlockId ?? generateBlockId();
    this.newBlock = newBlock ?? null;
  }

  apply(document: Document): Document {
    const block = document.blocks.find((b: Block) => b.id === this.blockId);
    if (!block) return document;

    const idx = document.blocks.indexOf(block);
    const duplicated = { ...block, id: this.newBlockId } as Block;

    const newBlocks = [...document.blocks];
    newBlocks.splice(idx + 1, 0, duplicated);
    return { ...document, blocks: newBlocks };
  }

  invert(_originalDocument: Document): DocumentOperation {
    return new DeleteBlockOperation(this.newBlockId);
  }

  validate(document: Document): ValidationError | null {
    return validateBlockExists(document, this.blockId);
  }

  getInvalidationScope(): InvalidationScope {
    return "document";
  }

  describe(): string {
    return `DuplicateBlock(id="${this.blockId}", newId="${this.newBlockId}")`;
  }
}
