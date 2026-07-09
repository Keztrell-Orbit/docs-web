import type { LayoutTree, LayoutPage, LayoutBlock } from "../../../layout/types.ts";
import type { CharacterPosition, TextLayout, WordBoundary } from "../types.ts";
import { TextLayoutService } from "../services/TextLayoutService.ts";
import type { TextLayoutRegistry } from "../../core/layout/TextLayoutRegistry.ts";
import { lineStartIndex, lineEndIndex } from "../types.ts";

export class NavigationEngine {
  #layoutTree: LayoutTree;
  #textLayoutService: TextLayoutService;
  #textLayoutRegistry: TextLayoutRegistry;

  constructor(
    layoutTree: LayoutTree,
    textLayoutService: TextLayoutService,
    textLayoutRegistry: TextLayoutRegistry,
  ) {
    this.#layoutTree = layoutTree;
    this.#textLayoutService = textLayoutService;
    this.#textLayoutRegistry = textLayoutRegistry;
  }

  setLayoutTree(tree: LayoutTree): void {
    this.#layoutTree = tree;
  }

  setTextLayoutRegistry(registry: TextLayoutRegistry): void {
    this.#textLayoutRegistry = registry;
  }

  #getLayout(blockId: string): TextLayout | null {
    return this.#textLayoutRegistry.has(blockId) ? this.#textLayoutRegistry.get(blockId) : null;
  }

  #getBlock(blockId: string): LayoutBlock | null {
    for (const page of this.#layoutTree.pages) {
      for (const block of page.blocks) {
        if (block.blockId === blockId) return block;
      }
    }
    return null;
  }

  #getPage(pageId: string): LayoutPage | null {
    return this.#layoutTree.pages.find((p) => p.id === pageId) ?? null;
  }

  #getPageIndex(pageId: string): number {
    return this.#layoutTree.pages.findIndex((p) => p.id === pageId);
  }

  #isTextBlock(block: LayoutBlock): boolean {
    return block.snapshot.type === "heading" || block.snapshot.type === "paragraph";
  }

  #getBlockText(block: LayoutBlock): string {
    return block.snapshot.text ?? "";
  }

  #getCharCount(block: LayoutBlock): number {
    return this.#getBlockText(block).length;
  }

  #findClosestTextBlockForward(pageId: string, afterBlockId?: string): { page: LayoutPage; block: LayoutBlock } | null {
    const page = this.#getPage(pageId);
    if (!page) return null;
    const start = afterBlockId ? page.blocks.findIndex((b) => b.blockId === afterBlockId) + 1 : 0;
    for (let i = start; i < page.blocks.length; i++) {
      if (this.#isTextBlock(page.blocks[i])) return { page, block: page.blocks[i] };
    }
    const nextPageIdx = this.#getPageIndex(pageId) + 1;
    if (nextPageIdx < this.#layoutTree.pages.length) {
      return this.#findClosestTextBlockForward(this.#layoutTree.pages[nextPageIdx].id);
    }
    return null;
  }

  #findClosestTextBlockBackward(pageId: string, beforeBlockId?: string): { page: LayoutPage; block: LayoutBlock } | null {
    const page = this.#getPage(pageId);
    if (!page) return null;
    const end = beforeBlockId ? page.blocks.findIndex((b) => b.blockId === beforeBlockId) : page.blocks.length;
    for (let i = end - 1; i >= 0; i--) {
      if (this.#isTextBlock(page.blocks[i])) return { page, block: page.blocks[i] };
    }
    const prevPageIdx = this.#getPageIndex(pageId) - 1;
    if (prevPageIdx >= 0) {
      const prevPage = this.#layoutTree.pages[prevPageIdx];
      const revBlocks = [...prevPage.blocks].reverse();
      for (const b of revBlocks) {
        if (this.#isTextBlock(b)) return { page: prevPage, block: b };
      }
    }
    return null;
  }

  #firstTextBlock(): CharacterPosition | null {
    for (const page of this.#layoutTree.pages) {
      for (const block of page.blocks) {
        if (this.#isTextBlock(block)) {
          return { pageId: page.id, blockId: block.blockId, charIndex: 0 };
        }
      }
    }
    return null;
  }

  #lastTextBlock(): CharacterPosition | null {
    const pages = [...this.#layoutTree.pages].reverse();
    for (const page of pages) {
      const blocks = [...page.blocks].reverse();
      for (const block of blocks) {
        if (this.#isTextBlock(block)) {
          return { pageId: page.id, blockId: block.blockId, charIndex: this.#getCharCount(block) };
        }
      }
    }
    return null;
  }

  moveRight(pos: CharacterPosition): CharacterPosition {
    const block = this.#getBlock(pos.blockId);
    if (!block) return pos;
    const text = this.#getBlockText(block);
    if (pos.charIndex < text.length) {
      return { ...pos, charIndex: pos.charIndex + 1 };
    }
    const next = this.#findClosestTextBlockForward(pos.pageId, pos.blockId);
    if (next) {
      return { pageId: next.page.id, blockId: next.block.blockId, charIndex: 0 };
    }
    return pos;
  }

  moveLeft(pos: CharacterPosition): CharacterPosition {
    const block = this.#getBlock(pos.blockId);
    if (!block) return pos;
    if (pos.charIndex > 0) {
      return { ...pos, charIndex: pos.charIndex - 1 };
    }
    const prev = this.#findClosestTextBlockBackward(pos.pageId, pos.blockId);
    if (prev) {
      const text = this.#getBlockText(prev.block);
      return { pageId: prev.page.id, blockId: prev.block.blockId, charIndex: text.length };
    }
    return pos;
  }

  moveUp(pos: CharacterPosition, visualX: number): CharacterPosition {
    const layout = this.#getLayout(pos.blockId);
    if (!layout || layout.lines.length === 0) return pos;

    const currentLineIdx = this.#textLayoutService.findLineAtChar(layout, pos.charIndex);
    if (currentLineIdx > 0) {
      const charIndex = this.#textLayoutService.getCharAt(layout, currentLineIdx - 1, visualX);
      return { ...pos, charIndex };
    }

    const prev = this.#findClosestTextBlockBackward(pos.pageId, pos.blockId);
    if (prev) {
      const prevLayout = this.#getLayout(prev.block.blockId);
      if (prevLayout && prevLayout.lines.length > 0) {
        const lastLineIdx = prevLayout.lines.length - 1;
        const charIndex = this.#textLayoutService.getCharAt(prevLayout, lastLineIdx, visualX);
        return { pageId: prev.page.id, blockId: prev.block.blockId, charIndex };
      }
      const text = this.#getBlockText(prev.block);
      return { pageId: prev.page.id, blockId: prev.block.blockId, charIndex: text.length };
    }

    return { ...pos, charIndex: 0 };
  }

  moveDown(pos: CharacterPosition, visualX: number): CharacterPosition {
    const layout = this.#getLayout(pos.blockId);
    if (!layout || layout.lines.length === 0) return pos;

    const currentLineIdx = this.#textLayoutService.findLineAtChar(layout, pos.charIndex);
    if (currentLineIdx < layout.lines.length - 1) {
      const charIndex = this.#textLayoutService.getCharAt(layout, currentLineIdx + 1, visualX);
      return { ...pos, charIndex };
    }

    const next = this.#findClosestTextBlockForward(pos.pageId, pos.blockId);
    if (next) {
      const nextLayout = this.#getLayout(next.block.blockId);
      if (nextLayout && nextLayout.lines.length > 0) {
        const charIndex = this.#textLayoutService.getCharAt(nextLayout, 0, visualX);
        return { pageId: next.page.id, blockId: next.block.blockId, charIndex };
      }
      return { pageId: next.page.id, blockId: next.block.blockId, charIndex: 0 };
    }

    const text = this.#getBlockText(this.#getBlock(pos.blockId)!);
    return { ...pos, charIndex: text.length };
  }

  moveToLineStart(pos: CharacterPosition): CharacterPosition {
    const layout = this.#getLayout(pos.blockId);
    if (!layout) return pos;
    const lineIdx = this.#textLayoutService.findLineAtChar(layout, pos.charIndex);
    const line = layout.lines[lineIdx];
    if (!line) return pos;
    return { ...pos, charIndex: lineStartIndex(line) };
  }

  moveToLineEnd(pos: CharacterPosition): CharacterPosition {
    const layout = this.#getLayout(pos.blockId);
    if (!layout) return pos;
    const lineIdx = this.#textLayoutService.findLineAtChar(layout, pos.charIndex);
    const line = layout.lines[lineIdx];
    if (!line) return pos;
    return { ...pos, charIndex: lineEndIndex(line) };
  }

  moveToNextWord(pos: CharacterPosition): CharacterPosition {
    const block = this.#getBlock(pos.blockId);
    if (!block) return pos;
    const text = this.#getBlockText(block);
    const nextIdx = this.#textLayoutService.findNextWord(text, pos.charIndex);
    if (nextIdx < text.length) {
      return { ...pos, charIndex: nextIdx };
    }
    const next = this.#findClosestTextBlockForward(pos.pageId, pos.blockId);
    if (next) {
      return { pageId: next.page.id, blockId: next.block.blockId, charIndex: 0 };
    }
    return { ...pos, charIndex: text.length };
  }

  moveToPrevWord(pos: CharacterPosition): CharacterPosition {
    const block = this.#getBlock(pos.blockId);
    if (!block) return pos;
    const text = this.#getBlockText(block);
    const prevIdx = this.#textLayoutService.findPrevWord(text, pos.charIndex);
    if (prevIdx > 0 || (prevIdx === 0 && text.length > 0)) {
      return { ...pos, charIndex: prevIdx };
    }
    const prev = this.#findClosestTextBlockBackward(pos.pageId, pos.blockId);
    if (prev) {
      const prevText = this.#getBlockText(prev.block);
      return { pageId: prev.page.id, blockId: prev.block.blockId, charIndex: prevText.length };
    }
    return { ...pos, charIndex: 0 };
  }

  moveToNextPage(pos: CharacterPosition): CharacterPosition {
    const pageIdx = this.#getPageIndex(pos.pageId);
    if (pageIdx < this.#layoutTree.pages.length - 1) {
      const nextPage = this.#layoutTree.pages[pageIdx + 1];
      for (const block of nextPage.blocks) {
        if (this.#isTextBlock(block)) {
          return { pageId: nextPage.id, blockId: block.blockId, charIndex: 0 };
        }
      }
      if (nextPage.blocks.length > 0) {
        return { pageId: nextPage.id, blockId: nextPage.blocks[0].blockId, charIndex: 0 };
      }
    }
    return pos;
  }

  moveToPrevPage(pos: CharacterPosition): CharacterPosition {
    const pageIdx = this.#getPageIndex(pos.pageId);
    if (pageIdx > 0) {
      const prevPage = this.#layoutTree.pages[pageIdx - 1];
      const revBlocks = [...prevPage.blocks].reverse();
      for (const block of revBlocks) {
        const text = this.#getBlockText(block);
        if (this.#isTextBlock(block)) {
          return { pageId: prevPage.id, blockId: block.blockId, charIndex: text.length };
        }
      }
      if (prevPage.blocks.length > 0) {
        const lastBlock = prevPage.blocks[prevPage.blocks.length - 1];
        return { pageId: prevPage.id, blockId: lastBlock.blockId, charIndex: this.#getCharCount(lastBlock) };
      }
    }
    return pos;
  }

  moveToDocumentStart(): CharacterPosition | null {
    return this.#firstTextBlock();
  }

  moveToDocumentEnd(): CharacterPosition | null {
    return this.#lastTextBlock();
  }

  moveToBlockStart(pos: CharacterPosition): CharacterPosition {
    return { ...pos, charIndex: 0 };
  }

  moveToBlockEnd(pos: CharacterPosition): CharacterPosition {
    const block = this.#getBlock(pos.blockId);
    if (!block) return pos;
    return { ...pos, charIndex: this.#getCharCount(block) };
  }

  findWordAround(pos: CharacterPosition): WordBoundary | null {
    const block = this.#getBlock(pos.blockId);
    if (!block) return null;
    const text = this.#getBlockText(block);
    return this.#textLayoutService.findWordBoundaries(text, pos.charIndex);
  }

  findLineRange(pos: CharacterPosition): { start: number; end: number } | null {
    const layout = this.#getLayout(pos.blockId);
    if (!layout) return null;
    const lineIdx = this.#textLayoutService.findLineAtChar(layout, pos.charIndex);
    const line = layout.lines[lineIdx];
    if (!line) return null;
    return { start: lineStartIndex(line), end: lineEndIndex(line) };
  }

  findParagraphRange(pos: CharacterPosition): { start: number; end: number } | null {
    const block = this.#getBlock(pos.blockId);
    if (!block) return null;
    const text = this.#getBlockText(block);
    return { start: 0, end: text.length };
  }
}
