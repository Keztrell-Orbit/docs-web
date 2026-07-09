import type { LayoutState } from "./LayoutState.ts";
import { PageRegistry } from "./PageRegistry.ts";
import type {
  CharacterAddress,
  CharacterPoint,
  LinePoint,
  BlockPoint,
  PagePoint,
  ViewportPoint,
} from "./CoordinateTypes.ts";
import {
  characterPoint,
  linePoint,
  blockPoint,
  pagePoint,
  viewportPoint,
  characterAddress,
  CoordinateError,
} from "./CoordinateTypes.ts";
import { getCharPosition, findLineAtY, findCharAtX } from "./CoordinateTransforms.ts";

export class CoordinateMapper {
  constructor(
    private readonly layout: LayoutState,
    private readonly pages: PageRegistry,
  ) {}

  // ===== One-level upstream (address → pixels) =====

  documentToCharacter(addr: CharacterAddress): CharacterPoint {
    const textLayout = this.layout.getTextLayout(addr.blockId);

    const pos = getCharPosition(textLayout, addr.charIndex);
    if (!pos) {
      throw new CoordinateError(
        `Char index ${addr.charIndex} out of range in block '${addr.blockId}'`,
      );
    }

    return characterPoint(addr.pageId, addr.blockId, pos.lineIndex, addr.charIndex, pos.x, pos.y);
  }

  characterToLine(pos: CharacterPoint): LinePoint {
    return linePoint(pos.pageId, pos.blockId, pos.lineIndex, pos.x, pos.y);
  }

  lineToPage(pos: LinePoint): PagePoint {
    const block = this.layout.getBlock(pos.blockId);
    if (!block) {
      throw new CoordinateError(`Block '${pos.blockId}' not found in layout`);
    }
    return pagePoint(block.x + pos.x, block.y + pos.y);
  }

  pageToViewport(pageId: string, pos: PagePoint): ViewportPoint {
    const page = this.layout.getPage(pageId);
    if (!page) {
      throw new CoordinateError(`Page '${pageId}' not found in layout`);
    }

    const metrics = this.pages.get(pageId);
    if (!metrics) {
      throw new CoordinateError(`Page '${pageId}' not registered in PageRegistry`);
    }

    return viewportPoint(
      metrics.viewportX + page.margin.left + pos.x,
      metrics.viewportY + page.margin.top + pos.y,
    );
  }

  // ===== One-level downstream (pixels → address) =====

  viewportToPage(vp: ViewportPoint): { pageId: string; point: PagePoint } {
    for (const metrics of this.pages.getAllPages()) {
      const page = this.layout.getPage(metrics.id);
      if (!page) continue;

      const px = vp.x - metrics.viewportX - page.margin.left;
      const py = vp.y - metrics.viewportY - page.margin.top;
      const contentW = page.width - page.margin.left - page.margin.right;
      const contentH = page.height - page.margin.top - page.margin.bottom;

      if (px >= 0 && px <= contentW && py >= 0 && py <= contentH) {
        return { pageId: metrics.id, point: pagePoint(px, py) };
      }
    }

    const all = this.pages.getAllPages();
    if (all.length > 0) {
      const fallback = all[0];
      const page = this.layout.getPage(fallback.id);
      if (page) {
        return {
          pageId: fallback.id,
          point: pagePoint(
            vp.x - fallback.viewportX - page.margin.left,
            vp.y - fallback.viewportY - page.margin.top,
          ),
        };
      }
    }

    throw new CoordinateError(`No page found for viewport position (${vp.x}, ${vp.y})`);
  }

  pageToBlock(pageId: string, pos: PagePoint): { block: BlockPoint; local: { x: number; y: number } } {
    const page = this.layout.getPage(pageId);
    if (!page) {
      throw new CoordinateError(`Page '${pageId}' not found in layout`);
    }

    for (const block of page.blocks) {
      if (
        pos.x >= block.x &&
        pos.x <= block.x + block.width &&
        pos.y >= block.y &&
        pos.y <= block.y + block.height
      ) {
        return {
          block: blockPoint(pageId, block.blockId, block.x, block.y),
          local: { x: pos.x - block.x, y: pos.y - block.y },
        };
      }
    }

    throw new CoordinateError(
      `No block at page position (${pos.x}, ${pos.y}) on page '${pageId}'`,
    );
  }

  blockToLine(blockId: string, localX: number, localY: number): LinePoint {
    const block = this.layout.getBlock(blockId);
    if (!block) {
      throw new CoordinateError(`Block '${blockId}' not found in layout`);
    }

    const textLayout = this.layout.getTextLayout(blockId);

    const result = findLineAtY(textLayout, localY);
    if (!result) {
      throw new CoordinateError(
        `No line at y=${localY} in block '${blockId}'`,
      );
    }

    return linePoint(block.pageId, blockId, result.lineIndex, localX, result.line.top);
  }

  lineToCharacter(pos: LinePoint): CharacterPoint {
    const textLayout = this.layout.getTextLayout(pos.blockId);

    const line = textLayout.lines[pos.lineIndex];
    if (!line) {
      throw new CoordinateError(`Line ${pos.lineIndex} not found in block '${pos.blockId}'`);
    }

    const charIndex = findCharAtX(line, pos.x);
    return characterPoint(pos.pageId, pos.blockId, pos.lineIndex, charIndex, pos.x, pos.y);
  }

  characterToDocument(pos: CharacterPoint): CharacterAddress {
    return characterAddress(pos.pageId, pos.blockId, pos.charIndex);
  }

  // ===== Composites (composed of one-level calls) =====

  documentToPage(addr: CharacterAddress): PagePoint {
    const char = this.documentToCharacter(addr);
    const line = this.characterToLine(char);
    return this.lineToPage(line);
  }

  documentToViewport(addr: CharacterAddress): ViewportPoint {
    const page = this.documentToPage(addr);
    return this.pageToViewport(addr.pageId, page);
  }

  viewportToDocument(vp: ViewportPoint): CharacterAddress {
    try {
      const { pageId, point } = this.viewportToPage(vp);
      const block = this.pageToBlock(pageId, point);
      const line = this.blockToLine(block.block.blockId, block.local.x, block.local.y);
      const char = this.lineToCharacter(line);
      return this.characterToDocument(char);
    } catch (e) {
      return characterAddress("", "", 0);
    }
  }

  // ===== Block-local convenience conversions =====

  blockLocalToPage(blockId: string, localX: number, localY: number): PagePoint {
    const block = this.layout.getBlock(blockId);
    if (!block) {
      throw new CoordinateError(`Block '${blockId}' not found in layout`);
    }
    return pagePoint(block.x + localX, block.y + localY);
  }

  blockLocalToViewport(blockId: string, localX: number, localY: number): ViewportPoint {
    const block = this.layout.getBlock(blockId);
    if (!block) {
      throw new CoordinateError(`Block '${blockId}' not found in layout`);
    }
    const page = pagePoint(block.x + localX, block.y + localY);
    return this.pageToViewport(block.pageId, page);
  }

  // ===== Helpers (data access, not transformations) =====

  getBlockOrigin(blockId: string): BlockPoint {
    const block = this.layout.getBlock(blockId);
    if (!block) {
      throw new CoordinateError(`Block '${blockId}' not found in layout`);
    }
    return blockPoint(block.pageId, block.blockId, block.x, block.y);
  }

  getBlockSize(blockId: string): { width: number; height: number } {
    const block = this.layout.getBlock(blockId);
    if (!block) {
      throw new CoordinateError(`Block '${blockId}' not found in layout`);
    }
    return { width: block.width, height: block.height };
  }
}
