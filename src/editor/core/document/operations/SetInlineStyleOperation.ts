import type { Document, Block } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";
import type { DocumentOperation } from "./DocumentOperation.ts";
import { validateBlockExists } from "../validation/OperationValidator.ts";

let opCounter = 0;

export class SetInlineStyleOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "set-inline-style";
  readonly timestamp: number;

  readonly blockId: string;
  readonly offset: number;
  readonly length: number;
  readonly styles: Record<string, unknown>;

  constructor(
    blockId: string,
    offset: number,
    length: number,
    styles: Record<string, unknown>,
  ) {
    this.id = `set-inline-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.blockId = blockId;
    this.offset = offset;
    this.length = length;
    this.styles = styles;
  }

  apply(document: Document): Document {
    return {
      ...document,
      blocks: document.blocks.map((b: Block) => {
        if (b.id !== this.blockId) return b;
        return {
          ...b,
          inlineStyles: {
            ...(b as any).inlineStyles,
            [`${this.offset}-${this.length}`]: this.styles,
          },
        } as any;
      }),
    };
  }

  invert(_originalDocument: Document): DocumentOperation {
    return new SetInlineStyleOperation(this.blockId, this.offset, this.length, {});
  }

  validate(document: Document): ValidationError | null {
    return validateBlockExists(document, this.blockId);
  }

  getInvalidationScope(): InvalidationScope {
    return "block";
  }

  describe(): string {
    return `SetInlineStyle(id="${this.blockId}", offset=${this.offset}, length=${this.length})`;
  }
}
