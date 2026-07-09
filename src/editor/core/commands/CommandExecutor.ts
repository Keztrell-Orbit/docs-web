import type { Document, Block, HeadingBlock, ParagraphBlock } from "../../types.ts";
import type { CharacterPosition, InteractionState, SelectionState } from "../../interaction/types.ts";
import type { DocumentOperation } from "../document/operations/DocumentOperation.ts";
import type { DocumentController } from "../document/DocumentController.ts";
import type { EditorCommand } from "./CommandTypes.ts";
import { TransactionBuilder } from "../document/transaction/TransactionBuilder.ts";
import { InsertTextOperation } from "../document/operations/InsertTextOperation.ts";
import { DeleteTextOperation } from "../document/operations/DeleteTextOperation.ts";
import { SplitParagraphOperation } from "../document/operations/SplitParagraphOperation.ts";
import { MergeParagraphOperation } from "../document/operations/MergeParagraphOperation.ts";
import { CompositeOperation } from "../document/operations/CompositeOperation.ts";
import { findPreviousBlock, findNextBlock, isTextBlock, getBlockText } from "../editing/EditingHelpers.ts";
import { getSelectionRange, generateDeleteRangeOps } from "../editing/SelectionEditing.ts";

export interface ExecutionContext {
  document: Document;
  interactionState: InteractionState;
}

export interface CommandResult {
  success: boolean;
  newCaretPosition: CharacterPosition | null;
  clearSelection: boolean;
  committedTransactionId: string | null;
  lastCommand: string;
  affectedBlocks: string[];
}

export class CommandExecutor {
  execute(
    command: EditorCommand,
    ctx: ExecutionContext,
    controller: DocumentController,
  ): CommandResult {
    switch (command.type) {
      case "INSERT_TEXT":
        return this.executeInsertText(command.text, ctx, controller);
      case "DELETE_BACKWARD":
        return this.executeDeleteBackward(command.unit, ctx, controller);
      case "DELETE_FORWARD":
        return this.executeDeleteForward(command.unit, ctx, controller);
      case "SPLIT_PARAGRAPH":
        return this.executeSplitParagraph(ctx, controller);
      case "MERGE_PARAGRAPH":
        return this.executeMergeParagraph(command.direction, ctx, controller);
      case "REPLACE_SELECTION":
        return this.executeReplaceSelection(command.text, ctx, controller);
      case "DELETE_SELECTION":
        return this.executeDeleteSelection(ctx, controller);
      case "UNDO":
        return this.executeUndo(ctx, controller);
      case "REDO":
        return this.executeRedo(ctx, controller);
      default:
        return noResult("UNKNOWN");
    }
  }

  private executeInsertText(
    text: string,
    ctx: ExecutionContext,
    controller: DocumentController,
  ): CommandResult {
    const { interactionState, document } = ctx;
    const caret = interactionState.caret.position;
    const sel = interactionState.selection;

    if (sel.anchor && sel.focus && !isCollapsedSelection(sel)) {
      const range = getSelectionRange(document, sel);
      if (!range) return noResult("INSERT_TEXT");

      const ops: DocumentOperation[] = [];
      const deleteOps = generateDeleteRangeOps(document, sel);
      ops.push(...deleteOps);
      ops.push(new InsertTextOperation(range.startBlockId, range.startOffset, text));

      const composite = new CompositeOperation(ops);
      const tx = new TransactionBuilder().add(composite).build({ cause: "insert-text-replace" });
      const result = controller.execute(tx);

      if (!result.success || !result.committed) return noResult("INSERT_TEXT");

      return {
        success: true,
        newCaretPosition: {
          pageId: caret.pageId,
          blockId: range.startBlockId,
          charIndex: range.startOffset + text.length,
        },
        clearSelection: true,
        committedTransactionId: result.committed.id,
        lastCommand: "INSERT_TEXT",
        affectedBlocks: [range.startBlockId, ...range.middleBlockIds, range.endBlockId],
      };
    }

    const op = new InsertTextOperation(caret.blockId, caret.charIndex, text);
    const tx = new TransactionBuilder().add(op).build({ cause: "insert-text" });
    const result = controller.execute(tx);

    if (!result.success || !result.committed) return noResult("INSERT_TEXT");

    return {
      success: true,
      newCaretPosition: {
        pageId: caret.pageId,
        blockId: caret.blockId,
        charIndex: caret.charIndex + text.length,
      },
      clearSelection: true,
      committedTransactionId: result.committed.id,
      lastCommand: "INSERT_TEXT",
      affectedBlocks: [caret.blockId],
    };
  }

  private executeDeleteBackward(
    unit: "character" | "word",
    ctx: ExecutionContext,
    controller: DocumentController,
  ): CommandResult {
    const { interactionState, document } = ctx;
    const caret = interactionState.caret.position;
    const sel = interactionState.selection;

    if (sel.anchor && sel.focus && !isCollapsedSelection(sel)) {
      return this.executeDeleteSelection(ctx, controller);
    }

    if (caret.charIndex === 0) {
      const prevBlock = findPreviousBlock(document, caret.blockId);
      if (!prevBlock) {
        return { ...noResult("DELETE_BACKWARD"), success: true };
      }

      const prevText = getBlockText(prevBlock);
      const op = new MergeParagraphOperation(prevBlock.id, caret.blockId);
      const tx = new TransactionBuilder().add(op).build({ cause: "merge-backward" });
      const result = controller.execute(tx);

      if (!result.success || !result.committed) return noResult("DELETE_BACKWARD");

      return {
        success: true,
        newCaretPosition: {
          pageId: caret.pageId,
          blockId: prevBlock.id,
          charIndex: prevText.length,
        },
        clearSelection: true,
        committedTransactionId: result.committed.id,
        lastCommand: "DELETE_BACKWARD",
        affectedBlocks: [prevBlock.id, caret.blockId],
      };
    }

    const block = document.blocks.find((b: Block) => b.id === caret.blockId);
    const text = block && isTextBlock(block) ? (block as HeadingBlock | ParagraphBlock).text : "";

    if (unit === "word") {
      const wordStart = findWordStart(text, caret.charIndex);
      const len = caret.charIndex - wordStart;
      if (len <= 0) return { ...noResult("DELETE_BACKWARD"), success: true };

      const deletedText = text.slice(wordStart, caret.charIndex);
      const op = new DeleteTextOperation(caret.blockId, wordStart, len, deletedText);
      const tx = new TransactionBuilder().add(op).build({ cause: "delete-word-backward" });
      const result = controller.execute(tx);

      if (!result.success || !result.committed) return noResult("DELETE_BACKWARD");

      return {
        success: true,
        newCaretPosition: { pageId: caret.pageId, blockId: caret.blockId, charIndex: wordStart },
        clearSelection: true,
        committedTransactionId: result.committed.id,
        lastCommand: "DELETE_BACKWARD",
        affectedBlocks: [caret.blockId],
      };
    }

    const deletedChar = text[caret.charIndex - 1] ?? "";
    const op = new DeleteTextOperation(caret.blockId, caret.charIndex - 1, 1, deletedChar);
    const tx = new TransactionBuilder().add(op).build({ cause: "delete-backward" });
    const result = controller.execute(tx);

    if (!result.success || !result.committed) return noResult("DELETE_BACKWARD");

    return {
      success: true,
      newCaretPosition: { pageId: caret.pageId, blockId: caret.blockId, charIndex: caret.charIndex - 1 },
      clearSelection: true,
      committedTransactionId: result.committed.id,
      lastCommand: "DELETE_BACKWARD",
      affectedBlocks: [caret.blockId],
    };
  }

  private executeDeleteForward(
    unit: "character" | "word",
    ctx: ExecutionContext,
    controller: DocumentController,
  ): CommandResult {
    const { interactionState, document } = ctx;
    const caret = interactionState.caret.position;
    const sel = interactionState.selection;

    if (sel.anchor && sel.focus && !isCollapsedSelection(sel)) {
      return this.executeDeleteSelection(ctx, controller);
    }

    const block = document.blocks.find((b: Block) => b.id === caret.blockId);
    const text = block && isTextBlock(block) ? (block as HeadingBlock | ParagraphBlock).text : "";

    if (caret.charIndex >= text.length) {
      const nextBlock = findNextBlock(document, caret.blockId);
      if (!nextBlock) {
        return { ...noResult("DELETE_FORWARD"), success: true };
      }

      const op = new MergeParagraphOperation(caret.blockId, nextBlock.id);
      const tx = new TransactionBuilder().add(op).build({ cause: "merge-forward" });
      const result = controller.execute(tx);

      if (!result.success || !result.committed) return noResult("DELETE_FORWARD");

      return {
        success: true,
        newCaretPosition: { pageId: caret.pageId, blockId: caret.blockId, charIndex: caret.charIndex },
        clearSelection: true,
        committedTransactionId: result.committed.id,
        lastCommand: "DELETE_FORWARD",
        affectedBlocks: [caret.blockId, nextBlock.id],
      };
    }

    if (unit === "word") {
      const wordEnd = findWordEnd(text, caret.charIndex);
      const len = wordEnd - caret.charIndex;
      if (len <= 0) return { ...noResult("DELETE_FORWARD"), success: true };

      const deletedText = text.slice(caret.charIndex, wordEnd);
      const op = new DeleteTextOperation(caret.blockId, caret.charIndex, len, deletedText);
      const tx = new TransactionBuilder().add(op).build({ cause: "delete-word-forward" });
      const result = controller.execute(tx);

      if (!result.success || !result.committed) return noResult("DELETE_FORWARD");

      return {
        success: true,
        newCaretPosition: { pageId: caret.pageId, blockId: caret.blockId, charIndex: caret.charIndex },
        clearSelection: true,
        committedTransactionId: result.committed.id,
        lastCommand: "DELETE_FORWARD",
        affectedBlocks: [caret.blockId],
      };
    }

    const deletedChar = text[caret.charIndex] ?? "";
    const op = new DeleteTextOperation(caret.blockId, caret.charIndex, 1, deletedChar);
    const tx = new TransactionBuilder().add(op).build({ cause: "delete-forward" });
    const result = controller.execute(tx);

    if (!result.success || !result.committed) return noResult("DELETE_FORWARD");

    return {
      success: true,
      newCaretPosition: { pageId: caret.pageId, blockId: caret.blockId, charIndex: caret.charIndex },
      clearSelection: true,
      committedTransactionId: result.committed.id,
      lastCommand: "DELETE_FORWARD",
      affectedBlocks: [caret.blockId],
    };
  }

  private executeSplitParagraph(
    ctx: ExecutionContext,
    controller: DocumentController,
  ): CommandResult {
    const { interactionState } = ctx;
    const caret = interactionState.caret.position;

    const op = new SplitParagraphOperation(caret.blockId, caret.charIndex);
    const newBlockId = op.newBlockId;

    const tx = new TransactionBuilder().add(op).build({ cause: "split-paragraph" });
    const result = controller.execute(tx);

    if (!result.success || !result.committed) return noResult("SPLIT_PARAGRAPH");

    return {
      success: true,
      newCaretPosition: { pageId: caret.pageId, blockId: newBlockId, charIndex: 0 },
      clearSelection: true,
      committedTransactionId: result.committed.id,
      lastCommand: "SPLIT_PARAGRAPH",
      affectedBlocks: [caret.blockId, newBlockId],
    };
  }

  private executeMergeParagraph(
    direction: "backward" | "forward",
    ctx: ExecutionContext,
    controller: DocumentController,
  ): CommandResult {
    const { interactionState, document } = ctx;
    const caret = interactionState.caret.position;

    if (direction === "backward") {
      const prevBlock = findPreviousBlock(document, caret.blockId);
      if (!prevBlock) return { ...noResult("MERGE_PARAGRAPH"), success: true };

      const prevText = getBlockText(prevBlock);
      const op = new MergeParagraphOperation(prevBlock.id, caret.blockId);
      const tx = new TransactionBuilder().add(op).build({ cause: "merge-paragraph-backward" });
      const result = controller.execute(tx);

      if (!result.success || !result.committed) return noResult("MERGE_PARAGRAPH");

      return {
        success: true,
        newCaretPosition: { pageId: caret.pageId, blockId: prevBlock.id, charIndex: prevText.length },
        clearSelection: true,
        committedTransactionId: result.committed.id,
        lastCommand: "MERGE_PARAGRAPH",
        affectedBlocks: [prevBlock.id, caret.blockId],
      };
    }

    const nextBlock = findNextBlock(document, caret.blockId);
    if (!nextBlock) return { ...noResult("MERGE_PARAGRAPH"), success: true };

    const op = new MergeParagraphOperation(caret.blockId, nextBlock.id);
    const tx = new TransactionBuilder().add(op).build({ cause: "merge-paragraph-forward" });
    const result = controller.execute(tx);

    if (!result.success || !result.committed) return noResult("MERGE_PARAGRAPH");

    return {
      success: true,
      newCaretPosition: { pageId: caret.pageId, blockId: caret.blockId, charIndex: caret.charIndex },
      clearSelection: true,
      committedTransactionId: result.committed.id,
      lastCommand: "MERGE_PARAGRAPH",
      affectedBlocks: [caret.blockId, nextBlock.id],
    };
  }

  private executeReplaceSelection(
    text: string,
    ctx: ExecutionContext,
    controller: DocumentController,
  ): CommandResult {
    const { interactionState, document } = ctx;
    const sel = interactionState.selection;

    if (!sel.anchor || !sel.focus) return noResult("REPLACE_SELECTION");

    const range = getSelectionRange(document, sel);
    if (!range) return noResult("REPLACE_SELECTION");

    const ops: DocumentOperation[] = [];
    const deleteOps = generateDeleteRangeOps(document, sel);
    ops.push(...deleteOps);

    if (text) {
      ops.push(new InsertTextOperation(range.startBlockId, range.startOffset, text));
    }

    const composite = new CompositeOperation(ops);
    const tx = new TransactionBuilder().add(composite).build({ cause: "replace-selection" });
    const result = controller.execute(tx);

    if (!result.success || !result.committed) return noResult("REPLACE_SELECTION");

    return {
      success: true,
      newCaretPosition: {
        pageId: sel.anchor.pageId,
        blockId: range.startBlockId,
        charIndex: range.startOffset + text.length,
      },
      clearSelection: true,
      committedTransactionId: result.committed.id,
      lastCommand: "REPLACE_SELECTION",
      affectedBlocks: [range.startBlockId, ...range.middleBlockIds, range.endBlockId],
    };
  }

  private executeDeleteSelection(
    ctx: ExecutionContext,
    controller: DocumentController,
  ): CommandResult {
    const { interactionState, document } = ctx;
    const sel = interactionState.selection;

    if (!sel.anchor || !sel.focus || isCollapsedSelection(sel)) {
      return { ...noResult("DELETE_SELECTION"), success: true };
    }

    const range = getSelectionRange(document, sel);
    if (!range) return noResult("DELETE_SELECTION");

    const ops = generateDeleteRangeOps(document, sel);
    if (ops.length === 0) {
      return { ...noResult("DELETE_SELECTION"), success: true };
    }

    let tx;
    if (ops.length === 1) {
      tx = new TransactionBuilder().add(ops[0]).build({ cause: "delete-selection" });
    } else {
      const composite = new CompositeOperation(ops);
      tx = new TransactionBuilder().add(composite).build({ cause: "delete-selection" });
    }

    const result = controller.execute(tx);

    if (!result.success || !result.committed) return noResult("DELETE_SELECTION");

    const affectedBlocks = [range.startBlockId, ...range.middleBlockIds, range.endBlockId].filter(
      (id, i, arr) => arr.indexOf(id) === i,
    );

    return {
      success: true,
      newCaretPosition: { pageId: sel.anchor.pageId, blockId: range.startBlockId, charIndex: range.startOffset },
      clearSelection: true,
      committedTransactionId: result.committed.id,
      lastCommand: "DELETE_SELECTION",
      affectedBlocks,
    };
  }

  private executeUndo(
    _ctx: ExecutionContext,
    controller: DocumentController,
  ): CommandResult {
    if (!controller.history.canUndo()) {
      return { ...noResult("UNDO"), success: false };
    }

    const result = controller.undo();
    if (!result || !result.success) return noResult("UNDO");

    return {
      success: true,
      newCaretPosition: null,
      clearSelection: true,
      committedTransactionId: null,
      lastCommand: "UNDO",
      affectedBlocks: [],
    };
  }

  private executeRedo(
    _ctx: ExecutionContext,
    controller: DocumentController,
  ): CommandResult {
    if (!controller.history.canRedo()) {
      return { ...noResult("REDO"), success: false };
    }

    const result = controller.redo();
    if (!result || !result.success) return noResult("REDO");

    return {
      success: true,
      newCaretPosition: null,
      clearSelection: true,
      committedTransactionId: null,
      lastCommand: "REDO",
      affectedBlocks: [],
    };
  }
}

function findWordStart(text: string, fromIndex: number): number {
  let i = fromIndex - 1;
  while (i > 0 && text[i - 1] !== " " && text[i - 1] !== "\t") i--;
  return i;
}

function findWordEnd(text: string, fromIndex: number): number {
  let i = fromIndex + 1;
  while (i < text.length && text[i] !== " " && text[i] !== "\t") i++;
  return i;
}

function isCollapsedSelection(sel: SelectionState): boolean {
  if (!sel.anchor || !sel.focus) return true;
  return sel.anchor.blockId === sel.focus.blockId && sel.anchor.charIndex === sel.focus.charIndex;
}

function noResult(cmd: string): CommandResult {
  return {
    success: false,
    newCaretPosition: null,
    clearSelection: false,
    committedTransactionId: null,
    lastCommand: cmd,
    affectedBlocks: [],
  };
}
