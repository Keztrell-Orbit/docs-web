import type { Document, Block, HeadingBlock, ParagraphBlock } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";
import type { DocumentOperation } from "./DocumentOperation.ts";
import { validateBlockExists, validateTextOffset } from "../validation/OperationValidator.ts";
import { DeleteTextOperation } from "./DeleteTextOperation.ts";

let opCounter = 0;

export class InsertTextOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "insert-text";
  readonly timestamp: number;

  readonly blockId: string;
  readonly offset: number;
  readonly text: string;

  constructor(
    blockId: string,
    offset: number,
    text: string,
  ) {
    this.id = `insert-text-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.blockId = blockId;
    this.offset = offset;
    this.text = text;
  }

  apply(document: Document): Document {
    return {
      ...document,
      blocks: document.blocks.map((b: Block) => {
        if (b.id !== this.blockId) return b;
        if (b.type === "heading") {
          const before = (b as HeadingBlock).text.slice(0, this.offset);
          const after = (b as HeadingBlock).text.slice(this.offset);
          return { ...b, text: before + this.text + after } as HeadingBlock;
        }
        if (b.type === "paragraph") {
          const before = (b as ParagraphBlock).text.slice(0, this.offset);
          const after = (b as ParagraphBlock).text.slice(this.offset);
          return { ...b, text: before + this.text + after } as ParagraphBlock;
        }
        return b;
      }),
    };
  }

  invert(originalDocument: Document): DocumentOperation {
    const block = originalDocument.blocks.find((b: Block) => b.id === this.blockId);
    const text = block && (block.type === "heading" || block.type === "paragraph") ? (block as HeadingBlock | ParagraphBlock).text : "";
    const deletedText = text.slice(this.offset, this.offset + this.text.length);
    return new DeleteTextOperation(this.blockId, this.offset, deletedText.length, deletedText);
  }

  validate(document: Document): ValidationError | null {
    const exists = validateBlockExists(document, this.blockId);
    if (exists) return exists;

    const block = document.blocks.find((b: Block) => b.id === this.blockId)!;
    if (block.type !== "heading" && block.type !== "paragraph") {
      return {
        code: "NOT_A_TEXT_BLOCK",
        message: `Block "${this.blockId}" is type "${block.type}", cannot insert text`,
        operationId: this.id,
        operationType: this.type,
      };
    }
    const text = (block as HeadingBlock | ParagraphBlock).text;
    return validateTextOffset(text, this.offset);
  }

  getInvalidationScope(): InvalidationScope {
    return "block";
  }

  describe(): string {
    return `InsertText("${this.text}", block="${this.blockId}", offset=${this.offset})`;
  }
}
