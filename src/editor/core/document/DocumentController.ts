import type { Document, Block } from "../types.ts";
import type { ExecutionResult } from "../types.ts";
import type { Transaction } from "./transaction/Transaction.ts";
import { TransactionBuilder } from "./transaction/TransactionBuilder.ts";
import { TransactionExecutor } from "./transaction/TransactionExecutor.ts";
import { TransactionHistory } from "./transaction/TransactionHistory.ts";
import { TransactionEventBus } from "./transaction/TransactionEventBus.ts";
import { InsertBlockOperation } from "./operations/InsertBlockOperation.ts";
import { DeleteBlockOperation } from "./operations/DeleteBlockOperation.ts";
import { MoveBlockOperation } from "./operations/MoveBlockOperation.ts";
import { SplitParagraphOperation } from "./operations/SplitParagraphOperation.ts";
import { MergeParagraphOperation } from "./operations/MergeParagraphOperation.ts";
import { InsertTextOperation } from "./operations/InsertTextOperation.ts";
import { DeleteTextOperation } from "./operations/DeleteTextOperation.ts";
import { InsertImageOperation } from "./operations/InsertImageOperation.ts";
import { InsertTableOperation } from "./operations/InsertTableOperation.ts";
import { ChangeBlockTypeOperation } from "./operations/ChangeBlockTypeOperation.ts";
import { CompositeOperation } from "./operations/CompositeOperation.ts";
import type { DocumentOperation } from "./operations/DocumentOperation.ts";
import type { DocumentAction } from "./DocumentContext.tsx";

export class DocumentController {
  #executor: TransactionExecutor;
  #history: TransactionHistory;
  #eventBus: TransactionEventBus;
  #dispatchDocument: React.Dispatch<DocumentAction>;
  #getDocument: () => Document;

  constructor(
    dispatchDocument: React.Dispatch<DocumentAction>,
    getDocument: () => Document,
    eventBus?: TransactionEventBus,
  ) {
    this.#eventBus = eventBus ?? new TransactionEventBus();
    this.#executor = new TransactionExecutor(this.#eventBus);
    this.#history = new TransactionHistory(100, this.#eventBus);
    this.#dispatchDocument = dispatchDocument;
    this.#getDocument = getDocument;
  }

  get executor(): TransactionExecutor {
    return this.#executor;
  }

  get history(): TransactionHistory {
    return this.#history;
  }

  get eventBus(): TransactionEventBus {
    return this.#eventBus;
  }

  execute(transaction: Transaction): ExecutionResult {
    const doc = this.#getDocument();
    const result = this.#executor.execute(transaction, doc);

    if (result.success && result.committed) {
      this.#history.push(result.committed);
      this.#dispatchDocument({ type: "TRANSACTION_COMMITTED", committed: result.committed });
    }

    return result;
  }

  undo(): ExecutionResult | null {
    if (!this.#history.canUndo()) return null;

    const doc = this.#getDocument();
    const tx = this.#history.undo();
    if (!tx) return null;

    const result = this.#executor.applyInverse(tx.inverseOperations, doc);
    if (result.success) {
      this.#dispatchDocument({ type: "DOCUMENT_REPLACED", document: result.document });
    }
    return result;
  }

  redo(): ExecutionResult | null {
    if (!this.#history.canRedo()) return null;

    const doc = this.#getDocument();
    const tx = this.#history.redo();
    if (!tx) return null;

    const result = this.#executor.applyInverse(tx.operations, doc);
    if (result.success) {
      this.#dispatchDocument({ type: "DOCUMENT_REPLACED", document: result.document });
    }
    return result;
  }

  insertBlock(block: Block, index: number): ExecutionResult {
    const op = new InsertBlockOperation(block, index);
    const tx = new TransactionBuilder().add(op).build();
    return this.execute(tx);
  }

  deleteBlock(blockId: string): ExecutionResult {
    const doc = this.#getDocument();
    const block = doc.blocks.find((b: Block) => b.id === blockId);
    if (!block) {
      return { success: false, errors: [{ code: "BLOCK_NOT_FOUND", message: `Block "${blockId}" not found` }], document: doc, committed: null };
    }
    const op = new DeleteBlockOperation(blockId, block);
    const tx = new TransactionBuilder().add(op).build();
    return this.execute(tx);
  }

  moveBlock(blockId: string, newIndex: number): ExecutionResult {
    const op = new MoveBlockOperation(blockId, newIndex);
    const tx = new TransactionBuilder().add(op).build();
    return this.execute(tx);
  }

  splitParagraph(blockId: string, offset: number): ExecutionResult {
    const op = new SplitParagraphOperation(blockId, offset);
    const tx = new TransactionBuilder().add(op).build();
    return this.execute(tx);
  }

  mergeParagraph(firstBlockId: string, secondBlockId: string): ExecutionResult {
    const op = new MergeParagraphOperation(firstBlockId, secondBlockId);
    const tx = new TransactionBuilder().add(op).build();
    return this.execute(tx);
  }

  insertText(blockId: string, offset: number, text: string): ExecutionResult {
    const op = new InsertTextOperation(blockId, offset, text);
    const tx = new TransactionBuilder().add(op).build();
    return this.execute(tx);
  }

  deleteText(blockId: string, offset: number, length: number): ExecutionResult {
    const doc = this.#getDocument();
    const block = doc.blocks.find((b: Block) => b.id === blockId);
    const blockText = block && (block.type === "heading" || block.type === "paragraph") ? (block as any).text : "";
    const deletedText = blockText.slice(offset, offset + length);
    const op = new DeleteTextOperation(blockId, offset, length, deletedText);
    const tx = new TransactionBuilder().add(op).build();
    return this.execute(tx);
  }

  insertImage(src: string, alt: string, width: number, height: number, index: number): ExecutionResult {
    const op = new InsertImageOperation(src, alt, width, height, index);
    const tx = new TransactionBuilder().add(op).build();
    return this.execute(tx);
  }

  insertTable(rows: number, columns: number, cells: string[][], index: number): ExecutionResult {
    const op = new InsertTableOperation(rows, columns, cells, index);
    const tx = new TransactionBuilder().add(op).build();
    return this.execute(tx);
  }

  changeBlockType(blockId: string, newType: Block["type"]): ExecutionResult {
    const op = new ChangeBlockTypeOperation(blockId, newType);
    const tx = new TransactionBuilder().add(op).build();
    return this.execute(tx);
  }

  executeComposite(operations: DocumentOperation[]): ExecutionResult {
    const composite = new CompositeOperation(operations);
    const tx = new TransactionBuilder().add(composite).build();
    return this.execute(tx);
  }
}
