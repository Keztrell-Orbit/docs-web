import type { Block, BlockMeasurer, BlockMeasureResult } from "../editor/types.ts";
import type { MeasuredBlock, RenderSnapshot } from "./types.ts";

function outerHeight(m: BlockMeasureResult): number {
  return (
    m.marginTop +
    m.borderTop +
    m.paddingTop +
    m.contentHeight +
    m.paddingBottom +
    m.borderBottom +
    m.marginBottom
  );
}

export function buildSnapshot(block: Block): RenderSnapshot {
  switch (block.type) {
    case "heading":
      return { type: "heading", text: block.text, level: block.level };
    case "paragraph":
      return { type: "paragraph", text: block.text };
    case "image":
      return {
        type: "image",
        src: block.src,
        alt: block.alt,
        imageWidth: block.width,
        imageHeight: block.height,
      };
    case "table":
      return { type: "table", cells: block.cells };
  }
}

export function measureBlocks(
  blocks: Block[],
  measurer: BlockMeasurer,
): MeasuredBlock[] {
  return blocks.map((block) => {
    const metrics = measurer.measure(block);
    return {
      blockId: block.id,
      snapshot: buildSnapshot(block),
      metrics,
      outerHeight: outerHeight(metrics),
    };
  });
}
