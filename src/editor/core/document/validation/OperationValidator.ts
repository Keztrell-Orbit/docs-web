import type { Document, Block } from "../../../../editor/types.ts";
import type { ValidationError } from "../../types.ts";

export function validateBlockExists(doc: Document, blockId: string): ValidationError | null {
  if (!doc.blocks.some((b: Block) => b.id === blockId)) {
    return { code: "BLOCK_NOT_FOUND", message: `Block "${blockId}" not found in document` };
  }
  return null;
}

export function validateBlockIndex(doc: Document, index: number): ValidationError | null {
  if (index < 0 || index > doc.blocks.length) {
    return {
      code: "INVALID_INDEX",
      message: `Index ${index} out of bounds [0, ${doc.blocks.length}]`,
    };
  }
  return null;
}

export function validateUniqueBlockId(doc: Document, blockId: string): ValidationError | null {
  if (doc.blocks.some((b: Block) => b.id === blockId)) {
    return { code: "DUPLICATE_BLOCK_ID", message: `Block ID "${blockId}" already exists in document` };
  }
  return null;
}

export function validateTextBlock(block: Block): ValidationError | null {
  if (block.type !== "heading" && block.type !== "paragraph") {
    return {
      code: "NOT_A_TEXT_BLOCK",
      message: `Block "${block.id}" is type "${block.type}", expected text block`,
    };
  }
  return null;
}

export function validateTextOffset(text: string, offset: number): ValidationError | null {
  if (offset < 0 || offset > text.length) {
    return {
      code: "INVALID_TEXT_OFFSET",
      message: `Offset ${offset} out of bounds [0, ${text.length}]`,
    };
  }
  return null;
}

export function validateTextRange(text: string, offset: number, length: number): ValidationError | null {
  const e = validateTextOffset(text, offset);
  if (e) return e;
  if (length < 0) {
    return { code: "NEGATIVE_LENGTH", message: `Length ${length} is negative` };
  }
  if (offset + length > text.length) {
    return {
      code: "TEXT_RANGE_EXCEEDS_LENGTH",
      message: `Offset ${offset} + length ${length} exceeds text length ${text.length}`,
    };
  }
  return null;
}

export function validateAdjacentBlocks(doc: Document, firstId: string, secondId: string): ValidationError | null {
  const firstIdx = doc.blocks.findIndex((b: Block) => b.id === firstId);
  const secondIdx = doc.blocks.findIndex((b: Block) => b.id === secondId);
  if (firstIdx === -1) {
    return { code: "BLOCK_NOT_FOUND", message: `First block "${firstId}" not found` };
  }
  if (secondIdx === -1) {
    return { code: "BLOCK_NOT_FOUND", message: `Second block "${secondId}" not found` };
  }
  if (secondIdx !== firstIdx + 1) {
    return {
      code: "BLOCKS_NOT_ADJACENT",
      message: `Block "${firstId}" at ${firstIdx} and "${secondId}" at ${secondIdx} are not adjacent`,
    };
  }
  return null;
}

export function validateBlockType(block: Block, allowedTypes: string[]): ValidationError | null {
  if (!allowedTypes.includes(block.type)) {
    return {
      code: "INVALID_BLOCK_TYPE",
      message: `Block "${block.id}" is type "${block.type}", expected one of: ${allowedTypes.join(", ")}`,
    };
  }
  return null;
}
