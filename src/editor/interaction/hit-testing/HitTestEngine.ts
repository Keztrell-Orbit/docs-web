import type { LayoutTree, LayoutPage, LayoutBlock } from "../../../layout/types.ts";
import type { HitTestResult, TextLayout } from "../types.ts";
import { TextLayoutService } from "../services/TextLayoutService.ts";
import type { TextLayoutRegistry } from "../../core/layout/TextLayoutRegistry.ts";

export class HitTestEngine {
  #layoutTree: LayoutTree;
  #textLayoutService: TextLayoutService;
  #textLayoutRegistry: TextLayoutRegistry;
  #pageRegistry: Map<string, HTMLDivElement>;

  constructor(
    layoutTree: LayoutTree,
    textLayoutService: TextLayoutService,
    textLayoutRegistry: TextLayoutRegistry,
    pageRegistry: Map<string, HTMLDivElement>,
  ) {
    this.#layoutTree = layoutTree;
    this.#textLayoutService = textLayoutService;
    this.#textLayoutRegistry = textLayoutRegistry;
    this.#pageRegistry = pageRegistry;
  }

  setLayoutTree(tree: LayoutTree): void {
    this.#layoutTree = tree;
  }

  setPageRegistry(registry: Map<string, HTMLDivElement>): void {
    this.#pageRegistry = registry;
  }

  hitTestFromViewport(clientX: number, clientY: number): HitTestResult {
    for (const page of this.#layoutTree.pages) {
      const el = this.#pageRegistry.get(page.id);
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        const pageLocalX = clientX - rect.left;
        const pageLocalY = clientY - rect.top;
        return this.pageHitTest(page, pageLocalX, pageLocalY);
      }
    }
    if (this.#layoutTree.pages.length > 0) {
      const page = this.#layoutTree.pages[0];
      return {
        pageId: page.id,
        block: null,
        lineIndex: null,
        charIndex: null,
        position: { pageId: page.id, blockId: "", charIndex: 0 },
        pageLocalX: 0,
        pageLocalY: 0,
      };
    }
    return {
      pageId: "",
      block: null,
      lineIndex: null,
      charIndex: null,
      position: { pageId: "", blockId: "", charIndex: 0 },
      pageLocalX: 0,
      pageLocalY: 0,
    };
  }

  pageHitTest(page: LayoutPage, pageX: number, pageY: number): HitTestResult {
    const marginLeft = page.margin.left;
    const marginTop = page.margin.top;
    const contentX = pageX - marginLeft;
    const contentY = pageY - marginTop;

    for (const block of page.blocks) {
      if (contentX >= block.x && contentX <= block.x + block.width && contentY >= block.y && contentY <= block.y + block.height) {
        return this.#blockHitTest(block, contentX - block.x, contentY - block.y);
      }
    }

    if (page.blocks.length > 0) {
      if (contentY < page.blocks[0].y) {
        const firstBlock = page.blocks[0];
        return {
          pageId: page.id,
          block: firstBlock,
          lineIndex: 0,
          charIndex: 0,
          position: { pageId: page.id, blockId: firstBlock.blockId, charIndex: 0 },
          pageLocalX: 0,
          pageLocalY: 0,
        };
      }
      const lastBlock = page.blocks[page.blocks.length - 1];
      const textLayout = this.#textLayoutRegistry.has(lastBlock.blockId)
        ? this.#textLayoutRegistry.get(lastBlock.blockId)
        : null;
      const text = lastBlock.snapshot.text ?? "";
      return {
        pageId: page.id,
        block: lastBlock,
        lineIndex: textLayout ? textLayout.lines.length - 1 : 0,
        charIndex: text.length,
        position: { pageId: page.id, blockId: lastBlock.blockId, charIndex: text.length },
        pageLocalX: lastBlock.width,
        pageLocalY: lastBlock.y + lastBlock.height,
      };
    }

    return {
      pageId: page.id,
      block: null,
      lineIndex: null,
      charIndex: null,
      position: { pageId: page.id, blockId: "", charIndex: 0 },
      pageLocalX: contentX,
      pageLocalY: contentY,
    };
  }

  #blockHitTest(block: LayoutBlock, blockX: number, blockY: number): HitTestResult {
    const textLayout = this.#textLayoutRegistry.has(block.blockId)
      ? this.#textLayoutRegistry.get(block.blockId)
      : null;
    if (!textLayout || textLayout.lines.length === 0) {
      return {
        pageId: block.pageId,
        block,
        lineIndex: 0,
        charIndex: 0,
        position: { pageId: block.pageId, blockId: block.blockId, charIndex: 0 },
        pageLocalX: blockX + block.x,
        pageLocalY: blockY + block.y,
      };
    }

    const line = this.#textLayoutService.getLineAt(textLayout, blockY);
    if (!line) {
      return {
        pageId: block.pageId,
        block,
        lineIndex: 0,
        charIndex: 0,
        position: { pageId: block.pageId, blockId: block.blockId, charIndex: 0 },
        pageLocalX: blockX + block.x,
        pageLocalY: blockY + block.y,
      };
    }

    const lineIndex = textLayout.lines.indexOf(line);
    const charIndex = this.#textLayoutService.getCharAt(textLayout, lineIndex, blockX);

    return {
      pageId: block.pageId,
      block,
      lineIndex,
      charIndex,
      position: { pageId: block.pageId, blockId: block.blockId, charIndex },
      pageLocalX: blockX + block.x,
      pageLocalY: blockY + block.y,
    };
  }

  getBlockById(blockId: string): LayoutBlock | null {
    for (const page of this.#layoutTree.pages) {
      for (const block of page.blocks) {
        if (block.blockId === blockId) return block;
      }
    }
    return null;
  }

  getBlocksOnPage(pageId: string): LayoutBlock[] {
    const page = this.#layoutTree.pages.find((p) => p.id === pageId);
    return page?.blocks ?? [];
  }

  findPageForBlock(blockId: string): LayoutPage | null {
    return this.#layoutTree.pages.find((p) => p.blocks.some((b) => b.blockId === blockId)) ?? null;
  }

  getTextLayout(blockId: string): TextLayout | null {
    return this.#textLayoutRegistry.has(blockId) ? this.#textLayoutRegistry.get(blockId) : null;
  }

  getTextLayoutRegistry(): TextLayoutRegistry {
    return this.#textLayoutRegistry;
  }
}
