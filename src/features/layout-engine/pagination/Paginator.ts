import type { MeasuredBlock, PageGeometry, LayoutTree, LayoutPage, LayoutBlock } from "../types.ts";

function createEmptyPage(
  index: number,
  geometry: PageGeometry,
): LayoutPage {
  return {
    index,
    geometry,
    usableHeight: geometry.contentHeight,
    usedHeight: 0,
    blocks: [],
  };
}

export function paginate(
  measuredBlocks: MeasuredBlock[],
  geometry: PageGeometry,
  documentId: string,
): LayoutTree {
  const pages: LayoutPage[] = [];
  let currentPage = createEmptyPage(0, geometry);

  for (let i = 0; i < measuredBlocks.length; i++) {
    const { block, height } = measuredBlocks[i];
    const remaining = currentPage.usableHeight - currentPage.usedHeight;
    let needsNewPage = false;

    if (currentPage.usedHeight > 0) {
      if (block.type === "heading") {
        const next = measuredBlocks[i + 1];
        if (next && height + next.height > remaining) {
          needsNewPage = true;
        }
      }

      if (!needsNewPage && height > remaining) {
        needsNewPage = true;
      }
    }

    if (needsNewPage) {
      pages.push(currentPage);
      currentPage = createEmptyPage(pages.length, geometry);
    }

    const layoutBlock: LayoutBlock = {
      id: block.id,
      type: block.type,
      x: 0,
      y: currentPage.usedHeight,
      width: geometry.contentWidth,
      height,
      data: block,
    };

    currentPage.blocks.push(layoutBlock);
    currentPage.usedHeight += height;
  }

  if (currentPage.blocks.length > 0) {
    pages.push(currentPage);
  }

  return { documentId, pages };
}
