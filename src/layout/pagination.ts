import type { MeasuredBlock, LayoutTree, LayoutPage, LayoutBlock } from "./types.ts";

function createPage(
  id: string,
  width: number,
  height: number,
  margin: { top: number; bottom: number; left: number; right: number },
): LayoutPage {
  return { id, width, height, margin, blocks: [] };
}

export function paginate(
  measuredBlocks: MeasuredBlock[],
  pageWidth: number,
  pageHeight: number,
  margin: { top: number; bottom: number; left: number; right: number },
  documentId: string,
): LayoutTree {
  const pages: LayoutPage[] = [];
  const contentWidth = pageWidth - margin.left - margin.right;
  const contentHeight = pageHeight - margin.top - margin.bottom;
  let currentPage = createPage("page-0", pageWidth, pageHeight, margin);
  let usedHeight = 0;

  for (let i = 0; i < measuredBlocks.length; i++) {
    const { blockId, snapshot, outerHeight } = measuredBlocks[i];
    const remaining = contentHeight - usedHeight;
    let needsNewPage = false;

    if (usedHeight > 0) {
      if (snapshot.type === "heading") {
        const next = measuredBlocks[i + 1];
        if (next && outerHeight + next.outerHeight > remaining) {
          needsNewPage = true;
        }
      }

      if (!needsNewPage && outerHeight > remaining) {
        needsNewPage = true;
      }
    }

    if (needsNewPage) {
      pages.push(currentPage);
      currentPage = createPage(`page-${pages.length}`, pageWidth, pageHeight, margin);
      usedHeight = 0;
    }

    const layoutBlock: LayoutBlock = {
      blockId,
      pageId: currentPage.id,
      x: 0,
      y: usedHeight,
      width: contentWidth,
      height: outerHeight,
      snapshot,
    };

    currentPage.blocks.push(layoutBlock);
    usedHeight += outerHeight;
  }

  if (currentPage.blocks.length > 0) {
    pages.push(currentPage);
  }

  return { documentId, pages };
}
