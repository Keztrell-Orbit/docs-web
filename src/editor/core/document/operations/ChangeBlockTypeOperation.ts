import type { Document, Block } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";
import type { DocumentOperation } from "./DocumentOperation.ts";
import { validateBlockExists } from "../validation/OperationValidator.ts";

type BlockType = Block["type"];

let opCounter = 0;

export class ChangeBlockTypeOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "change-block-type";
  readonly timestamp: number;

  readonly blockId: string;
  readonly newType: BlockType;
  readonly oldType?: BlockType;

  constructor(
    blockId: string,
    newType: BlockType,
    oldType?: BlockType,
  ) {
    this.id = `change-type-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.blockId = blockId;
    this.newType = newType;
    this.oldType = oldType;
  }

  apply(document: Document): Document {
    return {
      ...document,
      blocks: document.blocks.map((b: Block) => {
        if (b.id !== this.blockId) return b;
        if (this.newType === "heading") {
          return {
            type: "heading",
            id: b.id,
            level: 2,
            text: (b as any).text ?? "",
          } as Block;
        }
        if (this.newType === "paragraph") {
          return {
            type: "paragraph",
            id: b.id,
            text: (b as any).text ?? "",
          } as Block;
        }
        return b;
      }),
    };
  }

  invert(originalDocument: Document): DocumentOperation {
    const block = originalDocument.blocks.find((b: Block) => b.id === this.blockId);
    return new ChangeBlockTypeOperation(this.blockId, block?.type ?? "paragraph");
  }

  validate(document: Document): ValidationError | null {
    const exists = validateBlockExists(document, this.blockId);
    if (exists) return exists;

    const block = document.blocks.find((b: Block) => b.id === this.blockId)!;
    if (block.type === this.newType) {
      return {
        code: "SAME_TYPE",
        message: `Block "${this.blockId}" is already type "${this.newType}"`,
        operationId: this.id,
        operationType: this.type,
      };
    }
    if (block.type === "image" || block.type === "table") {
      return {
        code: "CANNOT_CHANGE_TYPE",
        message: `Cannot change block "${this.blockId}" from "${block.type}" to "${this.newType}"`,
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
    return `ChangeBlockType(id="${this.blockId}", type="${this.newType}")`;
  }
}
