import type { CoordinateMapper } from "../coordinates/CoordinateMapper.ts";
import type { LayoutState } from "../coordinates/LayoutState.ts";
import type { CharacterAddress, Rect } from "../coordinates/CoordinateTypes.ts";
import { RangeGeometry } from "./RangeGeometry.ts";

const HIGHLIGHT_COLOR = "rgba(166, 200, 255, 0.4)";

export interface SelectionRect extends Rect {
  pageId: string;
}

export class SelectionGeometry {
  private rangeGeometry: RangeGeometry;

  constructor(
    private readonly mapper: CoordinateMapper,
    private readonly layout: LayoutState,
  ) {
    this.rangeGeometry = new RangeGeometry(mapper, layout);
  }

  getRects(anchor: CharacterAddress | null, focus: CharacterAddress | null): ReadonlyArray<SelectionRect> {
    if (!anchor || !focus) return [];

    const range = this.getRange(anchor, focus);
    if (!range) return [];

    const rawRects = this.rangeGeometry.getRects(range.start, range.end);

    return rawRects.map((r) => ({
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      pageId: r.pageId,
    }));
  }

  private getRange(
    anchor: CharacterAddress,
    focus: CharacterAddress,
  ): { start: CharacterAddress; end: CharacterAddress } | null {
    const cmp = this.comparePositions(anchor, focus);
    if (cmp <= 0) return { start: anchor, end: focus };
    return { start: focus, end: anchor };
  }

  private comparePositions(a: CharacterAddress, b: CharacterAddress): number {
    if (a.pageId !== b.pageId) return a.pageId.localeCompare(b.pageId);
    if (a.blockId !== b.blockId) return a.blockId.localeCompare(b.blockId);
    return a.charIndex - b.charIndex;
  }
}
