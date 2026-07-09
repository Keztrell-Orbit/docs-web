import type { TextLayout, LineLayout, InsertionPoint, CharacterBox, WordBoundary } from "../types.ts";
import { lineStartIndex, lineEndIndex, lineContainsChar } from "../types.ts";

const WORD_SEPARATORS = /[\s\-_.,;:!?()\[\]{}"'/@#$%^&*+=<>~`|\\]+/;

export class TextLayoutService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private getContext(): CanvasRenderingContext2D {
    if (!this.ctx) {
      this.canvas = document.createElement("canvas");
      this.ctx = this.canvas.getContext("2d")!;
    }
    return this.ctx;
  }

  private measureWidth(text: string, font: string): number {
    const ctx = this.getContext();
    ctx.font = font;
    return ctx.measureText(text).width;
  }

  compute(
    blockId: string,
    text: string,
    fontSize: number,
    fontFamily: string,
    width: number,
    lineHeightMultiplier?: number,
    documentVersion?: number,
  ): TextLayout {
    const lh = lineHeightMultiplier ?? 1.625;
    const lineHeight = fontSize * lh;
    const font = `${fontSize}px ${fontFamily}`;
    const baselineOffset = fontSize * 0.65;

    const chars: Array<{ index: number; char: string; width: number }> = [];
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const w = c === "\n" ? 0 : this.measureWidth(c, font);
      chars.push({ index: i, char: c, width: w });
    }

    const lines: LineLayout[] = [];
    let currentLineChars: CharacterBox[] = [];
    let currentLineWidth = 0;
    let x = 0;
    let y = 0;

    const buildInsertionPoints = (
      fullText: string,
      lineStart: number,
      lineEnd: number,
      lineY: number,
      font: string,
    ): InsertionPoint[] => {
      const points: InsertionPoint[] = [];
      const lineText = fullText.slice(lineStart, lineEnd);
      for (let i = 0; i <= lineText.length; i++) {
        const prefix = lineText.slice(0, i);
        const advance = i === 0 ? 0 : this.measureWidth(prefix, font);
        points.push({ charIndex: lineStart + i, x: advance, y: lineY, height: lineHeight });
      }
      return points;
    };

    const flushLine = (force: boolean) => {
      if (currentLineChars.length === 0 && !force) return;
      if (currentLineChars.length === 0) return;
      const startIndex = currentLineChars[0].index;
      const endIndex = currentLineChars[currentLineChars.length - 1].index + 1;
      const lineIndex = lines.length;
      const ips = buildInsertionPoints(text, startIndex, endIndex, y, font);
      const lineWidth = ips.length > 0 ? ips[ips.length - 1].x : 0;
      lines.push({
        index: lineIndex,
        top: y,
        baseline: y + baselineOffset,
        height: lineHeight,
        width: lineWidth,
        insertionPoints: ips,
        characterBoxes: [...currentLineChars],
      });
      currentLineChars = [];
      currentLineWidth = 0;
      y += lineHeight;
    };

    let i = 0;
    while (i < chars.length) {
      const ch = chars[i];

      if (ch.char === "\n") {
        flushLine(true);
        i++;
        x = 0;
        continue;
      }

      if (currentLineWidth + ch.width <= width) {
        currentLineChars.push({ index: ch.index, char: ch.char, x, width: ch.width });
        currentLineWidth += ch.width;
        x += ch.width;
        i++;
        continue;
      }

      if (currentLineChars.length === 0) {
        currentLineChars.push({ index: ch.index, char: ch.char, x: 0, width: ch.width });
        currentLineWidth = ch.width;
        x = ch.width;
        i++;
        continue;
      }

      flushLine(true);
      x = 0;
    }

    flushLine(true);

    if (lines.length === 0) {
      const ips = buildInsertionPoints(text, 0, 0, 0, font);
      lines.push({
        index: 0,
        top: 0,
        baseline: baselineOffset,
        height: lineHeight,
        width: 0,
        insertionPoints: ips,
        characterBoxes: [],
      });
    }

    const totalHeight = lines.length > 0 ? lines[lines.length - 1].top + lineHeight : 0;

    return {
      blockId,
      documentVersion: documentVersion ?? 0,
      width,
      height: totalHeight,
      lines,
    };
  }

  getCharPosition(
    layout: TextLayout,
    charIndex: number,
  ): { lineIndex: number; x: number; y: number; height: number } | null {
    for (let li = 0; li < layout.lines.length; li++) {
      const line = layout.lines[li];
      if (lineContainsChar(line, charIndex)) {
        const local = charIndex - lineStartIndex(line);
        const ip = line.insertionPoints[local];
        if (ip) return { lineIndex: li, x: ip.x, y: ip.y, height: ip.height };
      }
    }
    return null;
  }

  getLineAt(layout: TextLayout, y: number): LineLayout | null {
    for (const line of layout.lines) {
      if (y >= line.top && y < line.top + line.height) {
        return line;
      }
    }
    if (layout.lines.length > 0) {
      if (y < layout.lines[0].top) return layout.lines[0];
      return layout.lines[layout.lines.length - 1];
    }
    return null;
  }

  getCharAt(layout: TextLayout, lineIndex: number, x: number): number {
    const line = layout.lines[lineIndex];
    if (!line || line.insertionPoints.length === 0) return lineStartIndex(line);
    const ips = line.insertionPoints;
    let best = 0;
    for (let i = 1; i < ips.length; i++) {
      if (Math.abs(x - ips[i].x) < Math.abs(x - ips[best].x)) best = i;
    }
    return ips[best].charIndex;
  }

  findWordBoundaries(text: string, charIndex: number): WordBoundary | null {
    if (!text || text.length === 0) return null;

    let start = charIndex;
    while (start > 0 && !WORD_SEPARATORS.test(text[start - 1])) start--;
    while (start < text.length && WORD_SEPARATORS.test(text[start])) start++;

    let end = charIndex;
    while (end < text.length && !WORD_SEPARATORS.test(text[end])) end++;
    while (end > start && WORD_SEPARATORS.test(text[end - 1])) end--;

    if (start >= end) {
      const safeIdx = Math.min(charIndex, text.length);
      return { start: safeIdx, end: safeIdx };
    }

    return { start, end };
  }

  findPrevWord(text: string, charIndex: number): number {
    let i = Math.max(0, charIndex - 1);
    while (i > 0 && WORD_SEPARATORS.test(text[i])) i--;
    while (i > 0 && !WORD_SEPARATORS.test(text[i - 1])) i--;
    return i;
  }

  findNextWord(text: string, charIndex: number): number {
    let i = charIndex;
    while (i < text.length && WORD_SEPARATORS.test(text[i])) i++;
    while (i < text.length && !WORD_SEPARATORS.test(text[i])) i++;
    return i;
  }

  getPreferredX(layout: TextLayout, charIndex: number): number {
    const pos = this.getCharPosition(layout, charIndex);
    return pos?.x ?? 0;
  }

  findLineAtChar(layout: TextLayout, charIndex: number): number {
    for (let li = 0; li < layout.lines.length; li++) {
      const line = layout.lines[li];
      if (lineContainsChar(line, charIndex)) return li;
    }
    return layout.lines.length - 1;
  }

  getFontSizeForBlock(type: string, level?: number): number {
    switch (type) {
      case "heading":
        return level === 1 ? 24 : level === 2 ? 20 : 18;
      default:
        return 12;
    }
  }

  getLineHeightMultiplier(type: string): number {
    switch (type) {
      case "heading":
        return 1.3;
      default:
        return 1.625;
    }
  }

  getFontFamily(): string {
    return "Georgia, 'Times New Roman', serif";
  }

  clearCache(): void {
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }
  }
}
