import type { Document, Block } from "../../../../editor/types.ts";
import type { ValidationError } from "../../types.ts";

export function validateDocument(doc: Document): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!doc.id) {
    errors.push({ code: "MISSING_DOCUMENT_ID", message: "Document ID is empty" });
  }

  if (!doc.blocks || !Array.isArray(doc.blocks)) {
    errors.push({ code: "INVALID_BLOCKS", message: "Document blocks is not an array" });
    return errors;
  }

  if (doc.blocks.length === 0) {
    errors.push({ code: "EMPTY_DOCUMENT", message: "Document has no blocks" });
    return errors;
  }

  const ids = new Map<string, number>();
  for (let i = 0; i < doc.blocks.length; i++) {
    const block = doc.blocks[i];
    const idx = ids.get(block.id);
    if (idx !== undefined) {
      errors.push({
        code: "DUPLICATE_BLOCK_ID",
        message: `Block ID "${block.id}" appears at indices ${idx} and ${i}`,
      });
    } else {
      ids.set(block.id, i);
    }

    if (!block.id) {
      errors.push({ code: "EMPTY_BLOCK_ID", message: `Block at index ${i} has empty ID` });
    }

    if (!block.type) {
      errors.push({ code: "MISSING_BLOCK_TYPE", message: `Block at index ${i} missing type` });
    }

    validateBlockContent(block, errors);
  }

  return errors;
}

function validateBlockContent(block: Block, errors: ValidationError[]): void {
  switch (block.type) {
    case "heading": {
      if (block.level === undefined) {
        errors.push({ code: "MISSING_HEADING_LEVEL", message: `Heading "${block.id}" missing level` });
      }
      if (block.text === undefined) {
        errors.push({ code: "MISSING_HEADING_TEXT", message: `Heading "${block.id}" missing text` });
      }
      break;
    }
    case "paragraph": {
      if (block.text === undefined) {
        errors.push({ code: "MISSING_PARAGRAPH_TEXT", message: `Paragraph "${block.id}" missing text` });
      }
      break;
    }
    case "image": {
      if (block.src === undefined) {
        errors.push({ code: "MISSING_IMAGE_SRC", message: `Image "${block.id}" missing src` });
      }
      if (block.width === undefined || block.height === undefined) {
        errors.push({ code: "MISSING_IMAGE_DIMENSIONS", message: `Image "${block.id}" missing width or height` });
      }
      break;
    }
    case "table": {
      if (!Array.isArray(block.cells)) {
        errors.push({ code: "MISSING_TABLE_CELLS", message: `Table "${block.id}" missing cells` });
      } else if (block.cells.length !== block.rows) {
        errors.push({
          code: "TABLE_ROW_MISMATCH",
          message: `Table "${block.id}" has ${block.cells.length} cell rows but declares ${block.rows} rows`,
        });
      }
      break;
    }
  }
}
