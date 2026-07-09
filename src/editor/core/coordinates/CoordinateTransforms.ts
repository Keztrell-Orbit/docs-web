import type { TextLayout, LineLayout } from "../../interaction/types.ts";
import { lineStartIndex, lineEndIndex, lineContainsChar } from "../../interaction/types.ts";

export interface CharPositionResult {
  lineIndex: number;
  x: number;
  y: number;
}

export interface LineAtYResult {
  line: LineLayout;
  lineIndex: number;
}

export function getCharPosition(layout: TextLayout, charIndex: number): CharPositionResult | null {
  for (let li = 0; li < layout.lines.length; li++) {
    const line = layout.lines[li];
    if (lineContainsChar(line, charIndex)) {
      const local = charIndex - lineStartIndex(line);
      const ip = line.insertionPoints[local];
      if (ip) return { lineIndex: li, x: ip.x, y: ip.y };
    }
  }
  return null;
}

export function findLineAtY(layout: TextLayout, y: number): LineAtYResult | null {
  for (let li = 0; li < layout.lines.length; li++) {
    const line = layout.lines[li];
    if (y >= line.top && y < line.top + line.height) {
      return { line, lineIndex: li };
    }
  }

  if (layout.lines.length > 0) {
    if (y < layout.lines[0].top) {
      return { line: layout.lines[0], lineIndex: 0 };
    }
    const last = layout.lines[layout.lines.length - 1];
    return { line: last, lineIndex: layout.lines.length - 1 };
  }

  return null;
}

export function findCharAtX(line: LineLayout, x: number): number {
  const ips = line.insertionPoints;
  if (ips.length === 0) return lineStartIndex(line);

  let best = 0;
  for (let i = 1; i < ips.length; i++) {
    if (Math.abs(x - ips[i].x) < Math.abs(x - ips[best].x)) best = i;
  }
  return ips[best].charIndex;
}
