import type { Block, BlockMeasurer } from "../types.ts";

export const placeholderBlockMeasurer: BlockMeasurer = {
  measure(block: Block) {
    switch (block.type) {
      case "heading": {
        const sizes: Record<1 | 2 | 3, number> = { 1: 48, 2: 44, 3: 40 };
        return { height: sizes[block.level] };
      }
      case "paragraph":
        return { height: 72 };
      case "image":
        return { height: block.height + 24 };
      case "table":
        return { height: block.rows * 28 + 24 };
    }
  },
};
