import type { Document, Block, HeadingBlock, ParagraphBlock } from "../../types.ts";
import type { InvalidationScope, ValidationError } from "../types.ts";
import type { DocumentOperation } from "../document/operations/DocumentOperation.ts";
import { DeleteTextOperation } from "../document/operations/DeleteTextOperation.ts";
import { DeleteBlockOperation } from "../document/operations/DeleteBlockOperation.ts";
import { CompositeOperation } from "../document/operations/CompositeOperation.ts";
import { InsertTextOperation } from "../document/operations/InsertTextOperation.ts";
import { InsertBlockOperation } from "../document/operations/InsertBlockOperation.ts";
import { isTextBlock, getBlockText } from "../editing/EditingHelpers.ts";

let opCounter = 0;

export class DeleteRangeOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "delete-range";
  readonly timestamp: number;

  readonly startBlockId: string;
  readonly startOffset: number;
  readonly endBlockId: string;
  readonly endOffset: number;
  readonly middleBlockIds: string[];

  #capturedData: {
    startText: string;
    startDeleted: string;
    endText: string;
    endDeleted: string;
    middleBlocks: Block[];
  } | null = null;

  constructor(
    startBlockId: string,
    startOffset: number,
    endBlockId: string,
    endOffset: number,
    middleBlockIds: string[],
  ) {
    this.id = `delete-range-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.startBlockId = startBlockId;
    this.startOffset = startOffset;
    this.endBlockId = endBlockId;
    this.endOffset = endOffset;
    this.middleBlockIds = middleBlockIds;
  }

  apply(document: Document): Document {
    const isSingleBlock = this.startBlockId === this.endBlockId;

    if (isSingleBlock) {
      const block = document.blocks.find((b: Block) => b.id === this.startBlockId);
      const text = block && isTextBlock(block) ? getBlockText(block) : "";
      const deletedText = text.slice(this.startOffset, this.endOffset);
      this.#capturedData = {
        startText: text,
        startDeleted: deletedText,
        endText: text,
        endDeleted: deletedText,
        middleBlocks: [],
      };
      const op = new DeleteTextOperation(
        this.startBlockId,
        this.startOffset,
        this.endOffset - this.startOffset,
        deletedText,
      );
      return op.apply(document);
    }

    const startBlock = document.blocks.find((b: Block) => b.id === this.startBlockId);
    const endBlock = document.blocks.find((b: Block) => b.id === this.endBlockId);

    const startText = startBlock && (startBlock.type === "heading" || startBlock.type === "paragraph")
      ? (startBlock as HeadingBlock | ParagraphBlock).text
      : "";
    const endText = endBlock && (endBlock.type === "heading" || endBlock.type === "paragraph")
      ? (endBlock as HeadingBlock | ParagraphBlock).text
      : "";

    const startDeleted = startText.slice(this.startOffset);
    const endDeleted = endText.slice(0, this.endOffset);

    const middleBlocks: Block[] = [];
    for (const midId of this.middleBlockIds) {
      const block = document.blocks.find((b: Block) => b.id === midId);
      if (block) middleBlocks.push(block);
    }

    this.#capturedData = { startText, startDeleted, endText, endDeleted, middleBlocks };

    const ops: DocumentOperation[] = [];
    if (startDeleted.length > 0) {
      ops.push(new DeleteTextOperation(this.startBlockId, this.startOffset, startDeleted.length, startDeleted));
    }
    for (const midId of this.middleBlockIds) {
      ops.push(new DeleteBlockOperation(midId));
    }
    if (endDeleted.length > 0) {
      ops.push(new DeleteTextOperation(this.endBlockId, 0, endDeleted.length, endDeleted));
    }

    const composite = new CompositeOperation(ops);
    return composite.apply(document);
  }

  invert(_originalDocument: Document): DocumentOperation {
    if (!this.#capturedData) {
      throw new Error("Cannot invert DeleteRangeOperation: no captured data (apply() was not called)");
    }
    const { startDeleted, endDeleted, middleBlocks } = this.#capturedData;

    const isSingleBlock = this.startBlockId === this.endBlockId;
    if (isSingleBlock) {
      return new InsertTextOperation(this.startBlockId, this.startOffset, startDeleted);
    }

    const ops: DocumentOperation[] = [];
    if (endDeleted.length > 0) {
      ops.push(new InsertTextOperation(this.endBlockId, 0, endDeleted));
    }
    for (let i = middleBlocks.length - 1; i >= 0; i--) {
      const block = middleBlocks[i];
      ops.push(new InsertBlockOperation(block, 0));
    }
    if (startDeleted.length > 0) {
      ops.push(new InsertTextOperation(this.startBlockId, this.startOffset, startDeleted));
    }

    return ops.length === 1 ? ops[0] : new CompositeOperation(ops);
  }

  validate(document: Document): ValidationError | null {
    const startBlock = document.blocks.find((b: Block) => b.id === this.startBlockId);
    if (!startBlock) {
      return { code: "BLOCK_NOT_FOUND", message: `Start block "${this.startBlockId}" not found`, operationId: this.id, operationType: this.type };
    }
    const endBlock = document.blocks.find((b: Block) => b.id === this.endBlockId);
    if (!endBlock) {
      return { code: "BLOCK_NOT_FOUND", message: `End block "${this.endBlockId}" not found`, operationId: this.id, operationType: this.type };
    }
    for (const midId of this.middleBlockIds) {
      if (!document.blocks.find((b: Block) => b.id === midId)) {
        return { code: "BLOCK_NOT_FOUND", message: `Middle block "${midId}" not found`, operationId: this.id, operationType: this.type };
      }
    }
    if (this.startBlockId === this.endBlockId) {
      if (this.startOffset > this.endOffset) {
        return { code: "INVALID_RANGE", message: "Start offset after end offset", operationId: this.id, operationType: this.type };
      }
    }
    return null;
  }

  getInvalidationScope(): InvalidationScope {
    return "document";
  }

  describe(): string {
    return `DeleteRange(start="${this.startBlockId}"@${this.startOffset}, end="${this.endBlockId}"@${this.endOffset}, middle=[${this.middleBlockIds.length} blocks])`;
  }
}
