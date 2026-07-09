import { describe, it, expect, beforeEach } from "vitest";
import { NavigationEngine } from "../navigation/NavigationEngine.ts";
import { TextLayoutService } from "../services/TextLayoutService.ts";
import { TextLayoutRegistry } from "../../core/layout/TextLayoutRegistry.ts";
import type { CharacterPosition, TextLayout } from "../types.ts";
import type { LayoutTree } from "../../../layout/types.ts";

function createMockLayoutTree(): LayoutTree {
  return {
    documentId: "doc-1",
    pages: [
      {
        id: "page-1",
        width: 595,
        height: 842,
        margin: { top: 72, bottom: 72, left: 72, right: 72 },
        blocks: [
          {
            blockId: "block-1",
            pageId: "page-1",
            x: 0,
            y: 0,
            width: 451,
            height: 40,
            snapshot: { type: "paragraph", text: "Hello world" },
          },
          {
            blockId: "block-2",
            pageId: "page-1",
            x: 0,
            y: 50,
            width: 451,
            height: 80,
            snapshot: { type: "paragraph", text: "This is a longer block of text to test navigation across lines" },
          },
          {
            blockId: "block-img",
            pageId: "page-1",
            x: 0,
            y: 140,
            width: 451,
            height: 200,
            snapshot: { type: "image", src: "test.jpg", alt: "test" },
          },
          {
            blockId: "block-3",
            pageId: "page-1",
            x: 0,
            y: 350,
            width: 451,
            height: 60,
            snapshot: { type: "paragraph", text: "Final block" },
          },
        ],
      },
      {
        id: "page-2",
        width: 595,
        height: 842,
        margin: { top: 72, bottom: 72, left: 72, right: 72 },
        blocks: [
          {
            blockId: "block-4",
            pageId: "page-2",
            x: 0,
            y: 0,
            width: 451,
            height: 40,
            snapshot: { type: "heading", level: 1, text: "Page 2 heading" },
          },
        ],
      },
    ],
  };
}

function createMockTextLayout(blockId: string, text: string): TextLayout {
  const fontSize = 12;
  const lineHeight = fontSize * 1.625;
  const baselineOffset = fontSize * 0.65;
  const charsPerLine = 30;
  const lines = [];
  let idx = 0;
  let top = 0;
  while (idx < text.length) {
    const end = Math.min(idx + charsPerLine, text.length);
    const lineIndex = lines.length;
    const lineText = text.slice(idx, end);
    const characterBoxes = lineText.split("").map((char, i) => ({
      index: idx + i,
      char,
      x: i * 7.2,
      width: 7.2,
    }));
    const insertionPoints = [];
    for (let i = 0; i <= lineText.length; i++) {
      insertionPoints.push({ charIndex: idx + i, x: i * 7.2, y: top, height: lineHeight });
    }
    const lineWidth = insertionPoints.length > 0 ? insertionPoints[insertionPoints.length - 1].x : 0;
    lines.push({
      index: lineIndex,
      top,
      baseline: top + baselineOffset,
      height: lineHeight,
      width: lineWidth,
      insertionPoints,
      characterBoxes,
    });
    top += lineHeight;
    idx = end;
  }

  const totalHeight = lines.length > 0 ? lines[lines.length - 1].top + lineHeight : 0;

  return {
    blockId,
    documentVersion: 0,
    width: 451,
    height: totalHeight,
    lines,
  };
}

describe("NavigationEngine", () => {
  let engine: NavigationEngine;
  let layoutTree: LayoutTree;
  let textLayoutRegistry: TextLayoutRegistry;
  let textLayoutService: TextLayoutService;

  beforeEach(() => {
    layoutTree = createMockLayoutTree();
    textLayoutRegistry = new TextLayoutRegistry();
    textLayoutService = new TextLayoutService();

    // Create mock text layouts
    for (const page of layoutTree.pages) {
      for (const block of page.blocks) {
        const text = block.snapshot.text;
        if (text) {
          const layout = createMockTextLayout(block.blockId, text);
          textLayoutRegistry.register(block.blockId, layout);
        }
      }
    }

    engine = new NavigationEngine(layoutTree, textLayoutService, textLayoutRegistry);
  });

  describe("moveRight", () => {
    it("should advance one character within a block", () => {
      const pos: CharacterPosition = { pageId: "page-1", blockId: "block-1", charIndex: 0 };
      const result = engine.moveRight(pos);
      expect(result.charIndex).toBe(1);
      expect(result.blockId).toBe("block-1");
    });

    it("should move to next block at end of block", () => {
      const pos: CharacterPosition = { pageId: "page-1", blockId: "block-1", charIndex: 11 };
      const result = engine.moveRight(pos);
      expect(result.blockId).toBe("block-2");
      expect(result.charIndex).toBe(0);
    });

    it("should skip non-text blocks", () => {
      const pos: CharacterPosition = { pageId: "page-1", blockId: "block-img", charIndex: 0 };
      // block-3 should be skipped since we use hit-testing for navigation
      // In this case, right from block-img should go nowhere since it's a non-text block
      const result = engine.moveRight(pos);
      // Should wrap to next block after block-img (block-3)
      expect(result.blockId).toBe("block-3");
    });

    it("should stay at same position at end of document", () => {
      const pos: CharacterPosition = { pageId: "page-2", blockId: "block-4", charIndex: 14 };
      const result = engine.moveRight(pos);
      expect(result).toEqual(pos);
    });
  });

  describe("moveLeft", () => {
    it("should go back one character within a block", () => {
      const pos: CharacterPosition = { pageId: "page-1", blockId: "block-1", charIndex: 5 };
      const result = engine.moveLeft(pos);
      expect(result.charIndex).toBe(4);
    });

    it("should move to previous block at start of block", () => {
      const pos: CharacterPosition = { pageId: "page-1", blockId: "block-2", charIndex: 0 };
      const result = engine.moveLeft(pos);
      expect(result.blockId).toBe("block-1");
      expect(result.charIndex).toBe(11);
    });
  });

  describe("moveToLineStart / moveToLineEnd", () => {
    it("should move to start of current line", () => {
      const pos: CharacterPosition = { pageId: "page-1", blockId: "block-2", charIndex: 35 };
      const result = engine.moveToLineStart(pos);
      expect(result.charIndex).toBeLessThan(pos.charIndex);
    });

    it("should move to end of current line", () => {
      const pos: CharacterPosition = { pageId: "page-1", blockId: "block-2", charIndex: 5 };
      const result = engine.moveToLineEnd(pos);
      expect(result.charIndex).toBeGreaterThan(pos.charIndex);
    });
  });

  describe("moveToNextWord / moveToPrevWord", () => {
    it("should move to next word boundary", () => {
      const pos: CharacterPosition = { pageId: "page-1", blockId: "block-1", charIndex: 0 };
      const result = engine.moveToNextWord(pos);
      expect(result.charIndex).toBeGreaterThan(0);
    });

    it("should move to previous word boundary", () => {
      const pos: CharacterPosition = { pageId: "page-1", blockId: "block-1", charIndex: 11 };
      const result = engine.moveToPrevWord(pos);
      expect(result.charIndex).toBe(6);
    });
  });

  describe("moveToNextPage / moveToPrevPage", () => {
    it("should move to first block of next page", () => {
      const pos: CharacterPosition = { pageId: "page-1", blockId: "block-1", charIndex: 0 };
      const result = engine.moveToNextPage(pos);
      expect(result.pageId).toBe("page-2");
    });

    it("should move to last block of previous page", () => {
      const pos: CharacterPosition = { pageId: "page-2", blockId: "block-4", charIndex: 0 };
      const result = engine.moveToPrevPage(pos);
      expect(result.pageId).toBe("page-1");
    });
  });

  describe("moveToDocumentStart / moveToDocumentEnd", () => {
    it("should move to first character of first text block", () => {
      const result = engine.moveToDocumentStart();
      expect(result).not.toBeNull();
      expect(result!.pageId).toBe("page-1");
      expect(result!.blockId).toBe("block-1");
      expect(result!.charIndex).toBe(0);
    });

    it("should move to last character of last text block", () => {
      const result = engine.moveToDocumentEnd();
      expect(result).not.toBeNull();
      expect(result!.pageId).toBe("page-2");
      expect(result!.blockId).toBe("block-4");
      expect(result!.charIndex).toBe(14);
    });
  });

  describe("findWordAround", () => {
    it("should find word boundaries around a position", () => {
      const pos: CharacterPosition = { pageId: "page-1", blockId: "block-1", charIndex: 0 };
      const bounds = engine.findWordAround(pos);
      expect(bounds).not.toBeNull();
      expect(bounds!.start).toBe(0);
      expect(bounds!.end).toBeGreaterThan(0);
    });
  });
});
