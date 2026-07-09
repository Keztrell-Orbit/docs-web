import type { Document, Block } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";
import type { DocumentOperation } from "./DocumentOperation.ts";
import { validateBlockExists } from "../validation/OperationValidator.ts";

let opCounter = 0;

export class SetBlockStyleOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "set-block-style";
  readonly timestamp: number;

  readonly blockId: string;
  readonly styles: Record<string, unknown>;

  constructor(
    blockId: string,
    styles: Record<string, unknown>,
  ) {
    this.id = `set-style-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.blockId = blockId;
    this.styles = styles;
  }

  apply(document: Document): Document {
    return {
      ...document,
      blocks: document.blocks.map((b: Block) => {
        if (b.id !== this.blockId) return b;
        return { ...b, style: { ...(b as any).style, ...this.styles } } as any;
      }),
    };
  }

  invert(originalDocument: Document): DocumentOperation {
    const block = originalDocument.blocks.find((b: Block) => b.id === this.blockId);
    const oldStyles: Record<string, unknown> = {};
    for (const key of Object.keys(this.styles)) {
      oldStyles[key] = (block as any)?.style?.[key];
    }
    return new SetBlockStyleOperation(this.blockId, oldStyles);
  }

  validate(document: Document): ValidationError | null {
    return validateBlockExists(document, this.blockId);
  }

  getInvalidationScope(): InvalidationScope {
    return "block";
  }

  describe(): string {
    return `SetBlockStyle(id="${this.blockId}", styles=${JSON.stringify(this.styles)})`;
  }
}
