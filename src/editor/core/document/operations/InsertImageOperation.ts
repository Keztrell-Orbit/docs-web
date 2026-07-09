import type { Document, ImageBlock } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";
import type { DocumentOperation } from "./DocumentOperation.ts";
import { validateBlockIndex } from "../validation/OperationValidator.ts";
import { generateBlockId } from "../../generateBlockId.ts";
import { DeleteBlockOperation } from "./DeleteBlockOperation.ts";

let opCounter = 0;

export class InsertImageOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "insert-image";
  readonly timestamp: number;
  readonly blockId: string;

  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly index: number;

  constructor(
    src: string,
    alt: string,
    width: number,
    height: number,
    index: number,
    blockId?: string,
  ) {
    this.id = `insert-image-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.src = src;
    this.alt = alt;
    this.width = width;
    this.height = height;
    this.index = index;
    this.blockId = blockId ?? generateBlockId();
  }

  apply(document: Document): Document {
    const block: ImageBlock = {
      type: "image",
      id: this.blockId,
      src: this.src,
      alt: this.alt,
      width: this.width,
      height: this.height,
    };
    const newBlocks = [...document.blocks];
    newBlocks.splice(this.index, 0, block);
    return { ...document, blocks: newBlocks };
  }

  invert(_originalDocument: Document): DocumentOperation {
    return new DeleteBlockOperation(this.blockId);
  }

  validate(document: Document): ValidationError | null {
    return validateBlockIndex(document, this.index);
  }

  getInvalidationScope(): InvalidationScope {
    return "document";
  }

  describe(): string {
    return `InsertImage(src="${this.src}", index=${this.index})`;
  }
}
