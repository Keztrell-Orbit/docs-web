import type { CoordinateMapper } from "../coordinates/CoordinateMapper.ts";
import type { LayoutState } from "../coordinates/LayoutState.ts";
import type { CharacterAddress, Rect } from "../coordinates/CoordinateTypes.ts";
import { characterAddress } from "../coordinates/CoordinateTypes.ts";
import { lineStartIndex, lineEndIndex, lineContainsChar } from "../../interaction/types.ts";

export interface RangeRect extends Rect {
  pageId: string;
}

export class RangeGeometry {
  constructor(
    private readonly mapper: CoordinateMapper,
    private readonly layout: LayoutState,
  ) {}

  getRects(start: CharacterAddress, end: CharacterAddress): ReadonlyArray<RangeRect> {
    if (start.blockId === end.blockId) {
      return this.getRectsWithinBlock(start, end);
    }

    const result: RangeRect[] = [];

    result.push(...this.getRectsWithinBlock(start, this.makeAddr(start.pageId, start.blockId, 999999)));

    result.push(...this.getRectsWithinBlock(this.makeAddr(end.pageId, end.blockId, 0), end));

    result.push(...this.getRectsBetweenBlocks(start, end));

    return result;
  }

  private getRectsWithinBlock(start: CharacterAddress, end: CharacterAddress): RangeRect[] {
    const result: RangeRect[] = [];
    const textLayout = this.layout.getTextLayout(start.blockId);

    const effectiveStart = start.charIndex;
    const effectiveEnd = end.blockId === start.blockId ? end.charIndex : 999999;

    for (let li = 0; li < textLayout.lines.length; li++) {
      const line = textLayout.lines[li];
      const lineStart = Math.max(effectiveStart, lineStartIndex(line));
      const lineEnd = Math.min(effectiveEnd, lineEndIndex(line));
      if (lineStart >= lineEnd) continue;

      let rectLeft = 0;
      const startLocal = lineStart - lineStartIndex(line);
      if (startLocal >= 0 && startLocal < line.insertionPoints.length) {
        rectLeft = line.insertionPoints[startLocal].x;
      }

      let rectRight = 0;
      const endLocal = lineEnd - lineStartIndex(line);
      if (endLocal > 0 && endLocal < line.insertionPoints.length) {
        rectRight = line.insertionPoints[endLocal].x;
      }

      const pageW = rectRight - rectLeft;
      const pageH = line.height;

      try {
        const topLeft = this.mapper.blockLocalToViewport(start.blockId, rectLeft, line.top);
        const bottomRight = this.mapper.blockLocalToViewport(start.blockId, rectLeft + pageW, line.top + pageH);

        result.push({
          x: topLeft.x,
          y: topLeft.y,
          width: bottomRight.x - topLeft.x,
          height: bottomRight.y - topLeft.y,
          pageId: start.pageId,
        });
      } catch {
        continue;
      }
    }

    return result;
  }

  private getRectsBetweenBlocks(start: CharacterAddress, end: CharacterAddress): RangeRect[] {
    const result: RangeRect[] = [];

    const startPageBlocks = this.getBlocksOnPage(start.pageId);
    const endPageBlocks = start.pageId === end.pageId ? startPageBlocks : this.getBlocksOnPage(end.pageId);

    let collecting = false;
    const allBlocks = [...startPageBlocks, ...endPageBlocks];

    for (const block of allBlocks) {
      if (block.blockId === start.blockId) {
        collecting = true;
        continue;
      }
      if (block.blockId === end.blockId) break;
      if (!collecting) continue;

      if (!this.layout.getBlock(block.blockId)) continue;

      const wholeBlockStart = this.makeAddr(start.pageId, block.blockId, 0);
      const wholeBlockEnd = this.makeAddr(start.pageId, block.blockId, 999999);
      result.push(...this.getRectsWithinBlock(wholeBlockStart, wholeBlockEnd));
    }

    return result;
  }

  private getBlocksOnPage(pageId: string): Array<{ blockId: string }> {
    const page = this.layout.getPage(pageId);
    return page?.blocks.map((b) => ({ blockId: b.blockId })) ?? [];
  }

  private makeAddr(pageId: string, blockId: string, charIndex: number): CharacterAddress {
    return characterAddress(pageId, blockId, charIndex);
  }
}
