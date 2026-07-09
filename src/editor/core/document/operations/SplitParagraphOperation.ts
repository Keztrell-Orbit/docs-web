import type { Document, Block, ParagraphBlock } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";
import type { DocumentOperation } from "./DocumentOperation.ts";
import { validateBlockExists } from "../validation/OperationValidator.ts";
import { MergeParagraphOperation } from "./MergeParagraphOperation.ts";

let opCounter = 0;

export class SplitParagraphOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "split-paragraph";
  readonly timestamp: number;
  readonly newBlockId: string;

  readonly blockId: string;
  readonly offset: number;

  constructor(
    blockId: string,
    offset: number,
    newBlockId?: string,
  ) {
    this.id = `split-para-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.blockId = blockId;
    this.offset = offset;
    this.newBlockId = newBlockId ?? `split-${Date.now()}-${opCounter++}`;
  }

  apply(document: Document): Document {
    const block = document.blocks.find((b: Block) => b.id === this.blockId);
    if (!block || (block.type !== "paragraph" && block.type !== "heading")) return document;

    const text = (block as ParagraphBlock).text;
    const before = text.slice(0, this.offset);
    const after = text.slice(this.offset);

    const idx = document.blocks.indexOf(block);
    const newBlock: ParagraphBlock = { type: "paragraph", id: this.newBlockId, text: after };

    const newBlocks = [...document.blocks];
    newBlocks.splice(idx, 1, { ...block, text: before } as ParagraphBlock);
    newBlocks.splice(idx + 1, 0, newBlock);

    return { ...document, blocks: newBlocks };
  }

  invert(_originalDocument: Document): DocumentOperation {
    return new MergeParagraphOperation(this.blockId, this.newBlockId);
  }

  validate(document: Document): ValidationError | null {
    const exists = validateBlockExists(document, this.blockId);
    if (exists) return exists;

    const block = document.blocks.find((b: Block) => b.id === this.blockId)!;
    if (block.type !== "paragraph" && block.type !== "heading") {
      return {
        code: "NOT_A_TEXT_BLOCK",
        message: `Block "${this.blockId}" is type "${block.type}", cannot split`,
        operationId: this.id,
        operationType: this.type,
      };
    }
    const text = (block as ParagraphBlock).text;
    if (this.offset < 0 || this.offset > text.length) {
      return {
        code: "INVALID_OFFSET",
        message: `Offset ${this.offset} out of bounds [0, ${text.length}]`,
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
    return `SplitParagraph(block="${this.blockId}", offset=${this.offset}) -> new="${this.newBlockId}"`;
  }
}
