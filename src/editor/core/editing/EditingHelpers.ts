import type { Document, Block, HeadingBlock, ParagraphBlock } from "../../types.ts";
import type { CharacterPosition } from "../../interaction/types.ts";

export function getTextBlockAtPosition(
  doc: Document,
  pos: CharacterPosition,
): HeadingBlock | ParagraphBlock | null {
  const block = doc.blocks.find((b: Block) => b.id === pos.blockId);
  if (!block || (block.type !== "heading" && block.type !== "paragraph")) return null;
  return block as HeadingBlock | ParagraphBlock;
}

export function getTextBeforeCaret(doc: Document, pos: CharacterPosition): string {
  const block = getTextBlockAtPosition(doc, pos);
  if (!block) return "";
  return block.text.slice(0, pos.charIndex);
}

export function getTextAfterCaret(doc: Document, pos: CharacterPosition): string {
  const block = getTextBlockAtPosition(doc, pos);
  if (!block) return "";
  return block.text.slice(pos.charIndex);
}

export function isAtBlockStart(pos: CharacterPosition): boolean {
  return pos.charIndex === 0;
}

export function isAtBlockEnd(doc: Document, pos: CharacterPosition): boolean {
  const block = getTextBlockAtPosition(doc, pos);
  if (!block) return true;
  return pos.charIndex >= block.text.length;
}

export function findPreviousBlock(doc: Document, blockId: string): Block | null {
  const idx = doc.blocks.findIndex((b: Block) => b.id === blockId);
  if (idx <= 0) return null;
  return doc.blocks[idx - 1];
}

export function findNextBlock(doc: Document, blockId: string): Block | null {
  const idx = doc.blocks.findIndex((b: Block) => b.id === blockId);
  if (idx < 0 || idx >= doc.blocks.length - 1) return null;
  return doc.blocks[idx + 1];
}

export function isTextBlock(block: Block): block is HeadingBlock | ParagraphBlock {
  return block.type === "heading" || block.type === "paragraph";
}

export function getBlockText(block: Block): string {
  if (block.type === "heading" || block.type === "paragraph") return block.text;
  return "";
}

export function findBlockIndex(doc: Document, blockId: string): number {
  return doc.blocks.findIndex((b: Block) => b.id === blockId);
}
