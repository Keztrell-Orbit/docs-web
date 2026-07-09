import { describe, it, expect } from "vitest";
import type { Document, Block, ParagraphBlock } from "../../../types.ts";
import { DeleteRangeOperation } from "../DeleteRangeOperation.ts";

function para(id: string, text: string): ParagraphBlock {
  return { type: "paragraph", id, text };
}

function makeDoc(blocks: Block[]): Document {
  return { id: "test", title: "", blocks };
}

describe("DeleteRangeOperation", () => {
  it("deletes text within a single block", () => {
    const doc = makeDoc([para("b1", "Hello World")]);
    const op = new DeleteRangeOperation("b1", 0, "b1", 5, []);
    const result = op.apply(doc);

    const block = result.blocks[0] as ParagraphBlock;
    expect(block.text).toBe(" World");
  });

  it("handles empty range (collapsed)", () => {
    const doc = makeDoc([para("b1", "Hello")]);
    const op = new DeleteRangeOperation("b1", 3, "b1", 3, []);
    const result = op.apply(doc);

    expect(result.blocks).toHaveLength(1);
    expect((result.blocks[0] as ParagraphBlock).text).toBe("Hello");
  });

  it("invert returns operation that restores document", () => {
    const doc = makeDoc([para("b1", "Hello World")]);
    const op = new DeleteRangeOperation("b1", 0, "b1", 6, []);
    const result = op.apply(doc);

    const inverse = op.invert(doc);
    const restored = inverse.apply(result);

    const block = restored.blocks[0] as ParagraphBlock;
    expect(block.text).toBe("Hello World");
  });
});
