import type { LayoutTree } from "./types.ts";

export function validateLayoutTree(tree: LayoutTree): void {
  for (const page of tree.pages) {
    const sorted = [...page.blocks].sort((a, b) => a.y - b.y);

    if (sorted.length === 0) continue;

    if (sorted[0].y < 0) {
      throw new Error(
        `Block ${sorted[0].blockId} has negative y=${sorted[0].y} on page ${page.id}`,
      );
    }

    let prevBottom = 0;
    for (const block of sorted) {
      if (block.y < prevBottom) {
        throw new Error(
          `Overlap detected: block ${block.blockId} y=${block.y} < previous bottom=${prevBottom} on page ${page.id}`,
        );
      }

      if (block.height <= 0) {
        throw new Error(
          `Block ${block.blockId} has non-positive height ${block.height}`,
        );
      }

      prevBottom = block.y + block.height;
    }

    if (prevBottom > page.height - page.margin.bottom) {
      throw new Error(
        `Page ${page.id} content overflows bottom margin: last block bottom=${prevBottom} > bottom margin edge=${page.height - page.margin.bottom}`,
      );
    }
  }
}
