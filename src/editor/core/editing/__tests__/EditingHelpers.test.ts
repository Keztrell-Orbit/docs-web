import { describe, it, expect } from "vitest";
import type { Document, Block, ParagraphBlock, HeadingBlock } from "../../../types.ts";
import {
  getTextBlockAtPosition,
  getTextBeforeCaret,
  getTextAfterCaret,
  isAtBlockStart,
  isAtBlockEnd,
  findPreviousBlock,
  findNextBlock,
  isTextBlock,
  getBlockText,
  findBlockIndex,
} from "../EditingHelpers.ts";

function makeDoc(blocks: Block[]): Document {
  return { id: "test-doc", title: "", blocks };
}

function makeParagraph(id: string, text: string): ParagraphBlock {
  return { type: "paragraph", id, text };
}

function makeHeading(id: string, text: string, level: 1 | 2 | 3 = 1): HeadingBlock {
  return { type: "heading", id, level, text };
}

describe("EditingHelpers", () => {
  const doc = makeDoc([
    makeHeading("h1", "Hello World"),
    makeParagraph("p1", "Foo bar baz"),
    makeParagraph("p2", ""),
  ]);

  describe("getTextBlockAtPosition", () => {
    it("returns paragraph block at position", () => {
      const block = getTextBlockAtPosition(doc, { pageId: "p", blockId: "p1", charIndex: 2 });
      expect(block).not.toBeNull();
      expect(block!.id).toBe("p1");
      expect(block!.type).toBe("paragraph");
    });

    it("returns heading block at position", () => {
      const block = getTextBlockAtPosition(doc, { pageId: "p", blockId: "h1", charIndex: 0 });
      expect(block).not.toBeNull();
      expect(block!.id).toBe("h1");
      expect(block!.type).toBe("heading");
    });

    it("returns null for unknown block", () => {
      const block = getTextBlockAtPosition(doc, { pageId: "p", blockId: "nonexistent", charIndex: 0 });
      expect(block).toBeNull();
    });
  });

  describe("getTextBeforeCaret", () => {
    it("returns text before caret position", () => {
      const text = getTextBeforeCaret(doc, { pageId: "p", blockId: "p1", charIndex: 4 });
      expect(text).toBe("Foo ");
    });

    it("returns empty string at start", () => {
      const text = getTextBeforeCaret(doc, { pageId: "p", blockId: "p1", charIndex: 0 });
      expect(text).toBe("");
    });
  });

  describe("getTextAfterCaret", () => {
    it("returns text after caret position", () => {
      const text = getTextAfterCaret(doc, { pageId: "p", blockId: "p1", charIndex: 4 });
      expect(text).toBe("bar baz");
    });

    it("returns empty string at end", () => {
      const text = getTextAfterCaret(doc, { pageId: "p", blockId: "p1", charIndex: 11 });
      expect(text).toBe("");
    });
  });

  describe("isAtBlockStart", () => {
    it("returns true when charIndex is 0", () => {
      expect(isAtBlockStart({ pageId: "p", blockId: "p1", charIndex: 0 })).toBe(true);
    });

    it("returns false when charIndex > 0", () => {
      expect(isAtBlockStart({ pageId: "p", blockId: "p1", charIndex: 3 })).toBe(false);
    });
  });

  describe("isAtBlockEnd", () => {
    it("returns true when charIndex >= text length", () => {
      expect(isAtBlockEnd(doc, { pageId: "p", blockId: "p1", charIndex: 11 })).toBe(true);
    });

    it("returns false when charIndex < text length", () => {
      expect(isAtBlockEnd(doc, { pageId: "p", blockId: "p1", charIndex: 5 })).toBe(false);
    });

    it("returns true for empty block", () => {
      expect(isAtBlockEnd(doc, { pageId: "p", blockId: "p2", charIndex: 0 })).toBe(true);
    });
  });

  describe("findPreviousBlock", () => {
    it("returns previous block", () => {
      const prev = findPreviousBlock(doc, "p1");
      expect(prev).not.toBeNull();
      expect(prev!.id).toBe("h1");
    });

    it("returns null for first block", () => {
      expect(findPreviousBlock(doc, "h1")).toBeNull();
    });

    it("returns null for unknown block", () => {
      expect(findPreviousBlock(doc, "nonexistent")).toBeNull();
    });
  });

  describe("findNextBlock", () => {
    it("returns next block", () => {
      const next = findNextBlock(doc, "p1");
      expect(next).not.toBeNull();
      expect(next!.id).toBe("p2");
    });

    it("returns null for last block", () => {
      expect(findNextBlock(doc, "p2")).toBeNull();
    });
  });

  describe("isTextBlock", () => {
    it("returns true for paragraph", () => {
      expect(isTextBlock(makeParagraph("x", "text"))).toBe(true);
    });

    it("returns true for heading", () => {
      expect(isTextBlock(makeHeading("x", "text"))).toBe(true);
    });
  });

  describe("getBlockText", () => {
    it("returns paragraph text", () => {
      expect(getBlockText(makeParagraph("x", "hello"))).toBe("hello");
    });

    it("returns heading text", () => {
      expect(getBlockText(makeHeading("x", "world"))).toBe("world");
    });
  });

  describe("findBlockIndex", () => {
    it("finds block index by id", () => {
      expect(findBlockIndex(doc, "h1")).toBe(0);
      expect(findBlockIndex(doc, "p1")).toBe(1);
      expect(findBlockIndex(doc, "p2")).toBe(2);
    });

    it("returns -1 for unknown block", () => {
      expect(findBlockIndex(doc, "nonexistent")).toBe(-1);
    });
  });
});
