import type { Document, Block, HeadingBlock, ParagraphBlock } from "../../types.ts";
import type { SelectionState, CharacterPosition } from "../../interaction/types.ts";
import type { DocumentOperation } from "../document/operations/DocumentOperation.ts";
import { DeleteTextOperation } from "../document/operations/DeleteTextOperation.ts";
import { DeleteBlockOperation } from "../document/operations/DeleteBlockOperation.ts";
import { InsertTextOperation } from "../document/operations/InsertTextOperation.ts";
import { findBlockIndex, getBlockText } from "./EditingHelpers.ts";

export interface NormalizedRange {
  startBlockId: string;
  startOffset: number;
  endBlockId: string;
  endOffset: number;
  middleBlockIds: string[];
  isSingleBlock: boolean;
  isCollapsed: boolean;
}

export function getSelectionRange(doc: Document, sel: SelectionState): NormalizedRange | null {
  if (!sel.anchor || !sel.focus) return null;

  const anchorIdx = findBlockIndex(doc, sel.anchor.blockId);
  const focusIdx = findBlockIndex(doc, sel.focus.blockId);
  if (anchorIdx === -1 || focusIdx === -1) return null;

  const isReversed =
    anchorIdx > focusIdx ||
    (anchorIdx === focusIdx && sel.anchor.charIndex > sel.focus.charIndex);

  const start = isReversed ? sel.focus : sel.anchor;
  const end = isReversed ? sel.anchor : sel.focus;
  const startIdx = Math.min(anchorIdx, focusIdx);
  const endIdx = Math.max(anchorIdx, focusIdx);

  const isCollapsed = start.blockId === end.blockId && start.charIndex === end.charIndex;
  const isSingleBlock = start.blockId === end.blockId;

  const middleBlockIds: string[] = [];
  if (!isSingleBlock) {
    for (let i = startIdx + 1; i < endIdx; i++) {
      middleBlockIds.push(doc.blocks[i].id);
    }
  }

  return {
    startBlockId: start.blockId,
    startOffset: start.charIndex,
    endBlockId: end.blockId,
    endOffset: end.charIndex,
    middleBlockIds,
    isSingleBlock,
    isCollapsed,
  };
}

export function getSelectedText(doc: Document, sel: SelectionState): string {
  const range = getSelectionRange(doc, sel);
  if (!range || range.isCollapsed) return "";

  if (range.isSingleBlock) {
    const block = doc.blocks.find((b) => b.id === range.startBlockId);
    if (!block) return "";
    return getBlockText(block).slice(range.startOffset, range.endOffset);
  }

  const parts: string[] = [];
  const startBlock = doc.blocks.find((b) => b.id === range.startBlockId);
  if (startBlock) parts.push(getBlockText(startBlock).slice(range.startOffset));

  for (const midId of range.middleBlockIds) {
    const block = doc.blocks.find((b) => b.id === midId);
    if (block) parts.push(getBlockText(block));
  }

  const endBlock = doc.blocks.find((b) => b.id === range.endBlockId);
  if (endBlock) parts.push(getBlockText(endBlock).slice(0, range.endOffset));

  return parts.join("\n");
}

export function isCollapsed(sel: SelectionState): boolean {
  if (!sel.anchor || !sel.focus) return true;
  return sel.anchor.blockId === sel.focus.blockId && sel.anchor.charIndex === sel.focus.charIndex;
}

export function collapseToStart(sel: SelectionState): CharacterPosition | null {
  if (!sel.anchor || !sel.focus) return null;
  const doc = { id: "", title: "", blocks: [] };
  const range = getSelectionRange(doc as Document, sel);
  if (!range) return null;
  return { pageId: sel.anchor.pageId, blockId: range.startBlockId, charIndex: range.startOffset };
}

export function collapseToEnd(sel: SelectionState): CharacterPosition | null {
  if (!sel.anchor || !sel.focus) return null;
  const doc = { id: "", title: "", blocks: [] };
  const range = getSelectionRange(doc as Document, sel);
  if (!range) return null;
  return { pageId: sel.focus.pageId, blockId: range.endBlockId, charIndex: range.endOffset };
}

export function generateDeleteRangeOps(doc: Document, sel: SelectionState): DocumentOperation[] {
  const range = getSelectionRange(doc, sel);
  if (!range || range.isCollapsed) return [];

  const ops: DocumentOperation[] = [];

  if (range.isSingleBlock) {
    const block = doc.blocks.find((b) => b.id === range.startBlockId);
    if (!block) return [];
    const text = getBlockText(block);
    const len = range.endOffset - range.startOffset;
    if (len > 0) {
      ops.push(new DeleteTextOperation(range.startBlockId, range.startOffset, len, text.slice(range.startOffset, range.endOffset)));
    }
    return ops;
  }

  const startBlock = doc.blocks.find((b) => b.id === range.startBlockId);
  if (startBlock) {
    const text = getBlockText(startBlock);
    const len = text.length - range.startOffset;
    if (len > 0) {
      ops.push(new DeleteTextOperation(range.startBlockId, range.startOffset, len, text.slice(range.startOffset)));
    }
  }

  for (const midId of range.middleBlockIds) {
    const block = doc.blocks.find((b) => b.id === midId);
    if (block) {
      ops.push(new DeleteBlockOperation(midId, block));
    }
  }

  const endBlock = doc.blocks.find((b) => b.id === range.endBlockId);
  if (endBlock && range.endOffset > 0) {
    const text = getBlockText(endBlock);
    ops.push(new DeleteTextOperation(range.endBlockId, 0, range.endOffset, text.slice(0, range.endOffset)));
  }

  return ops;
}

export function generateReplaceRangeOps(
  doc: Document,
  sel: SelectionState,
  text: string,
): DocumentOperation[] {
  const ops: DocumentOperation[] = [];

  const deleteOps = generateDeleteRangeOps(doc, sel);
  ops.push(...deleteOps);

  if (text && sel.anchor) {
    const range = getSelectionRange(doc, sel);
    if (range) {
      ops.push(new InsertTextOperation(range.startBlockId, range.startOffset, text));
    }
  }

  return ops;
}
