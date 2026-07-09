import type { Document, Block, HeadingBlock, ParagraphBlock } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";
import type { DocumentOperation } from "./DocumentOperation.ts";
import { validateBlockExists, validateTextRange } from "../validation/OperationValidator.ts";

let opCounter = 0;

export class ReplaceTextOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "replace-text";
  readonly timestamp: number;

  readonly blockId: string;
  readonly offset: number;
  readonly length: number;
  readonly newText: string;
  readonly replacedText: string;

  constructor(
    blockId: string,
    offset: number,
    length: number,
    newText: string,
    replacedText: string,
  ) {
    this.id = `replace-text-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.blockId = blockId;
    this.offset = offset;
    this.length = length;
    this.newText = newText;
    this.replacedText = replacedText;
  }

  apply(document: Document): Document {
    return {
      ...document,
      blocks: document.blocks.map((b: Block) => {
        if (b.id !== this.blockId) return b;
        if (b.type === "heading") {
          const text = (b as HeadingBlock).text;
          return { ...b, text: text.slice(0, this.offset) + this.newText + text.slice(this.offset + this.length) } as HeadingBlock;
        }
        if (b.type === "paragraph") {
          const text = (b as ParagraphBlock).text;
          return { ...b, text: text.slice(0, this.offset) + this.newText + text.slice(this.offset + this.length) } as ParagraphBlock;
        }
        return b;
      }),
    };
  }

  invert(_originalDocument: Document): DocumentOperation {
    return new ReplaceTextOperation(this.blockId, this.offset, this.newText.length, this.replacedText, this.newText);
  }

  validate(document: Document): ValidationError | null {
    const exists = validateBlockExists(document, this.blockId);
    if (exists) return exists;

    const block = document.blocks.find((b: Block) => b.id === this.blockId)!;
    if (block.type !== "heading" && block.type !== "paragraph") {
      return {
        code: "NOT_A_TEXT_BLOCK",
        message: `Block "${this.blockId}" is type "${block.type}", cannot replace text`,
        operationId: this.id,
        operationType: this.type,
      };
    }
    const text = (block as HeadingBlock | ParagraphBlock).text;
    return validateTextRange(text, this.offset, this.length);
  }

  getInvalidationScope(): InvalidationScope {
    return "block";
  }

  describe(): string {
    return `ReplaceText(block="${this.blockId}", offset=${this.offset}, length=${this.length}, newText="${this.newText}")`;
  }
}
