import type { Block, BlockMeasurer } from "../../document/types.ts";
import type { MeasuredBlock } from "../types.ts";

export function measureBlocks(
  blocks: Block[],
  measurer: BlockMeasurer,
): MeasuredBlock[] {
  return blocks.map((block) => ({
    block,
    height: measurer.measure(block).height,
  }));
}
