import type { Document, Block, ParagraphBlock } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";
import type { DocumentOperation } from "./DocumentOperation.ts";
import { validateBlockExists, validateAdjacentBlocks } from "../validation/OperationValidator.ts";
import { SplitParagraphOperation } from "./SplitParagraphOperation.ts";

let opCounter = 0;

export class MergeParagraphOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "merge-paragraph";
  readonly timestamp: number;

  readonly firstBlockId: string;
  readonly secondBlockId: string;

  constructor(
    firstBlockId: string,
    secondBlockId: string,
  ) {
    this.id = `merge-para-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.firstBlockId = firstBlockId;
    this.secondBlockId = secondBlockId;
  }

  apply(document: Document): Document {
    const first = document.blocks.find((b: Block) => b.id === this.firstBlockId);
    const second = document.blocks.find((b: Block) => b.id === this.secondBlockId);
    if (!first || !second) return document;

    const firstText = (first as ParagraphBlock).text ?? "";
    const secondText = (second as ParagraphBlock).text ?? "";
    const mergedText = firstText + secondText;

    const newBlocks = document.blocks
      .filter((b: Block) => b.id !== this.secondBlockId)
      .map((b: Block) => {
        if (b.id === this.firstBlockId) {
          return { ...b, text: mergedText } as ParagraphBlock;
        }
        return b;
      });

    return { ...document, blocks: newBlocks };
  }

  invert(originalDocument: Document): DocumentOperation {
    const first = originalDocument.blocks.find((b: Block) => b.id === this.firstBlockId);
    const second = originalDocument.blocks.find((b: Block) => b.id === this.secondBlockId);
    if (!first || !second) {
      return new SplitParagraphOperation(this.firstBlockId, 0);
    }
    const firstText = (first as ParagraphBlock).text ?? "";
    const offset = firstText.length;
    return new SplitParagraphOperation(this.firstBlockId, offset, this.secondBlockId);
  }

  validate(document: Document): ValidationError | null {
    const firstExists = validateBlockExists(document, this.firstBlockId);
    if (firstExists) return firstExists;

    const secondExists = validateBlockExists(document, this.secondBlockId);
    if (secondExists) return secondExists;

    const adjacent = validateAdjacentBlocks(document, this.firstBlockId, this.secondBlockId);
    if (adjacent) return adjacent;

    const first = document.blocks.find((b: Block) => b.id === this.firstBlockId)!;
    const second = document.blocks.find((b: Block) => b.id === this.secondBlockId)!;
    if (first.type !== "paragraph" && first.type !== "heading") {
      return {
        code: "NOT_A_TEXT_BLOCK",
        message: `First block "${this.firstBlockId}" is type "${first.type}"`,
        operationId: this.id,
        operationType: this.type,
      };
    }
    if (second.type !== "paragraph") {
      return {
        code: "SECOND_NOT_PARAGRAPH",
        message: `Second block "${this.secondBlockId}" is type "${second.type}", must be paragraph`,
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
    return `MergeParagraph(first="${this.firstBlockId}", second="${this.secondBlockId}")`;
  }
}
