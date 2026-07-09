import { describe, it, expect } from "vitest";
import type { Document, Block, ParagraphBlock } from "../../../types.ts";
import type { SelectionState } from "../../../interaction/types.ts";
import {
  getSelectionRange,
  getSelectedText,
  isCollapsed,
  generateDeleteRangeOps,
} from "../SelectionEditing.ts";

function makeDoc(blocks: Block[]): Document {
  return { id: "test-doc", title: "", blocks };
}

function para(id: string, text: string): ParagraphBlock {
  return { type: "paragraph", id, text };
}

function sel(anchorBlock: string, anchorChar: number, focusBlock: string, focusChar: number): SelectionState {
  return {
    anchor: { pageId: "p1", blockId: anchorBlock, charIndex: anchorChar },
    focus: { pageId: "p1", blockId: focusBlock, charIndex: focusChar },
  };
}

describe("SelectionEditing", () => {
  const doc = makeDoc([
    para("b1", "Hello World"),
    para("b2", "Foo bar baz"),
    para("b3", "Last"),
  ]);

  describe("getSelectionRange", () => {
    it("returns collapsed range when anchor === focus", () => {
      const range = getSelectionRange(doc, sel("b1", 3, "b1", 3));
      expect(range).not.toBeNull();
      expect(range!.isCollapsed).toBe(true);
      expect(range!.isSingleBlock).toBe(true);
      expect(range!.startOffset).toBe(3);
      expect(range!.endOffset).toBe(3);
    });

    it("returns single-block range for forward selection", () => {
      const range = getSelectionRange(doc, sel("b1", 2, "b1", 7));
      expect(range).not.toBeNull();
      expect(range!.isCollapsed).toBe(false);
      expect(range!.isSingleBlock).toBe(true);
      expect(range!.startBlockId).toBe("b1");
      expect(range!.startOffset).toBe(2);
      expect(range!.endBlockId).toBe("b1");
      expect(range!.endOffset).toBe(7);
      expect(range!.middleBlockIds).toEqual([]);
    });

    it("normalizes backward selection within a block", () => {
      const range = getSelectionRange(doc, sel("b1", 7, "b1", 2));
      expect(range).not.toBeNull();
      expect(range!.startOffset).toBe(2);
      expect(range!.endOffset).toBe(7);
    });

    it("detects multi-block selection", () => {
      const range = getSelectionRange(doc, sel("b1", 3, "b3", 2));
      expect(range).not.toBeNull();
      expect(range!.isCollapsed).toBe(false);
      expect(range!.isSingleBlock).toBe(false);
      expect(range!.startBlockId).toBe("b1");
      expect(range!.startOffset).toBe(3);
      expect(range!.endBlockId).toBe("b3");
      expect(range!.endOffset).toBe(2);
      expect(range!.middleBlockIds).toEqual(["b2"]);
    });

    it("returns null when anchor or focus is null", () => {
      expect(getSelectionRange(doc, { anchor: null, focus: null })).toBeNull();
    });
  });

  describe("getSelectedText", () => {
    it("returns empty for collapsed selection", () => {
      expect(getSelectedText(doc, sel("b1", 0, "b1", 0))).toBe("");
    });

    it("returns selected text within single block", () => {
      expect(getSelectedText(doc, sel("b1", 0, "b1", 5))).toBe("Hello");
    });

    it("returns concatenated text for multi-block selection", () => {
      const text = getSelectedText(doc, sel("b1", 6, "b2", 4));
      expect(text).toBe("World\nFoo ");
    });
  });

  describe("isCollapsed", () => {
    it("returns true when anchor === focus", () => {
      expect(isCollapsed(sel("b1", 3, "b1", 3))).toBe(true);
    });

    it("returns false when different", () => {
      expect(isCollapsed(sel("b1", 3, "b1", 5))).toBe(false);
    });

    it("returns true when anchor or focus is null", () => {
      expect(isCollapsed({ anchor: null, focus: null })).toBe(true);
    });
  });

  describe("generateDeleteRangeOps", () => {
    it("returns empty array for collapsed selection", () => {
      const ops = generateDeleteRangeOps(doc, sel("b1", 0, "b1", 0));
      expect(ops).toEqual([]);
    });

    it("generates DeleteTextOperation for single-block range", () => {
      const ops = generateDeleteRangeOps(doc, sel("b1", 0, "b1", 5));
      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe("delete-text");
      expect(ops[0].describe()).toContain("offset=0, length=5");
    });

    it("generates multiple operations for multi-block range", () => {
      const ops = generateDeleteRangeOps(doc, sel("b1", 6, "b2", 4));
      expect(ops.length).toBeGreaterThanOrEqual(1);
    });
  });
});
