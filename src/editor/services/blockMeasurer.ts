import type { Block, BlockMeasurer, BlockMeasureResult } from "../types.ts";

export const placeholderBlockMeasurer: BlockMeasurer = {
  measure(block: Block): BlockMeasureResult {
    switch (block.type) {
      case "heading": {
        const contentHeights: Record<1 | 2 | 3, number> = { 1: 36, 2: 32, 3: 28 };
        return {
          contentHeight: contentHeights[block.level],
          marginTop: 0,
          marginBottom: 12,
          paddingTop: 0,
          paddingBottom: 0,
          borderTop: 0,
          borderBottom: 0,
        };
      }
      case "paragraph":
        return {
          contentHeight: 64,
          marginTop: 0,
          marginBottom: 8,
          paddingTop: 0,
          paddingBottom: 0,
          borderTop: 0,
          borderBottom: 0,
        };
      case "image":
        return {
          contentHeight: block.height,
          marginTop: 12,
          marginBottom: 12,
          paddingTop: 0,
          paddingBottom: 0,
          borderTop: 0,
          borderBottom: 0,
        };
      case "table":
        return {
          contentHeight: block.rows * 28,
          marginTop: 12,
          marginBottom: 12,
          paddingTop: 0,
          paddingBottom: 0,
          borderTop: 0,
          borderBottom: 0,
        };
    }
  },
};
