import type { Document, TableBlock } from "../../../../editor/types.ts";
import type { InvalidationScope, ValidationError } from "../../types.ts";
import type { DocumentOperation } from "./DocumentOperation.ts";
import { validateBlockIndex } from "../validation/OperationValidator.ts";
import { generateBlockId } from "../../generateBlockId.ts";
import { DeleteBlockOperation } from "./DeleteBlockOperation.ts";

let opCounter = 0;

export class InsertTableOperation implements DocumentOperation {
  readonly id: string;
  readonly type = "insert-table";
  readonly timestamp: number;
  readonly blockId: string;

  readonly rows: number;
  readonly columns: number;
  readonly cells: string[][];
  readonly index: number;

  constructor(
    rows: number,
    columns: number,
    cells: string[][],
    index: number,
    blockId?: string,
  ) {
    this.id = `insert-table-${Date.now()}-${opCounter++}`;
    this.timestamp = Date.now();
    this.rows = rows;
    this.columns = columns;
    this.cells = cells;
    this.index = index;
    this.blockId = blockId ?? generateBlockId();
  }

  apply(document: Document): Document {
    const block: TableBlock = {
      type: "table",
      id: this.blockId,
      rows: this.rows,
      columns: this.columns,
      cells: this.cells,
    };
    const newBlocks = [...document.blocks];
    newBlocks.splice(this.index, 0, block);
    return { ...document, blocks: newBlocks };
  }

  invert(_originalDocument: Document): DocumentOperation {
    return new DeleteBlockOperation(this.blockId);
  }

  validate(document: Document): ValidationError | null {
    const idxErr = validateBlockIndex(document, this.index);
    if (idxErr) return idxErr;

    if (this.rows < 1) {
      return {
        code: "INVALID_ROWS",
        message: `Rows must be >= 1, got ${this.rows}`,
        operationId: this.id,
        operationType: this.type,
      };
    }
    if (this.columns < 1) {
      return {
        code: "INVALID_COLUMNS",
        message: `Columns must be >= 1, got ${this.columns}`,
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
    return `InsertTable(rows=${this.rows}, columns=${this.columns}, index=${this.index})`;
  }
}
