import type { CharacterAddress } from "../coordinates/CoordinateTypes.ts";
import type { CoordinateMapper } from "../coordinates/CoordinateMapper.ts";
import type { LayoutState } from "../coordinates/LayoutState.ts";
import type { CaretRect } from "./GeometryTypes.ts";
import { lineStartIndex, lineEndIndex, lineContainsChar } from "../../interaction/types.ts";

class InvalidCaretError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCaretError";
  }
}

const CARET_WIDTH = 1;

export class CaretGeometry {
  constructor(
    private readonly mapper: CoordinateMapper,
    private readonly layout: LayoutState,
  ) {}

  getRect(addr: CharacterAddress): CaretRect {
    if (!addr.blockId) {
      throw new InvalidCaretError("Cannot compute caret rect: no blockId in address");
    }

    const textLayout = this.layout.getTextLayout(addr.blockId);

    if (textLayout.lines.length === 0) {
      throw new InvalidCaretError(
        `TextLayout for block '${addr.blockId}' has no lines`,
      );
    }

    const line = textLayout.lines.find((l) => lineContainsChar(l, addr.charIndex));
    if (!line) {
      throw new InvalidCaretError(
        `charIndex ${addr.charIndex} out of range in block '${addr.blockId}'`,
      );
    }

    const local = addr.charIndex - lineStartIndex(line);
    const ip = line.insertionPoints[local];
    if (!ip) {
      throw new InvalidCaretError(
        `No insertion point for charIndex ${addr.charIndex} in block '${addr.blockId}'`,
      );
    }

    const vp = this.mapper.documentToViewport(addr);

    return { x: vp.x, y: vp.y, width: CARET_WIDTH, height: ip.height, blockId: addr.blockId, pageId: addr.pageId };
  }
}
