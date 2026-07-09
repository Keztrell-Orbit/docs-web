import { useMemo } from "react";
import type { Document, BlockMeasurer } from "../../document/types.ts";
import type { PageSize, PageMargins, LayoutTree } from "../types.ts";
import { createPageGeometry } from "../geometry/PageGeometry.ts";
import { measureBlocks } from "../measurement/measureBlocks.ts";
import { paginate } from "../pagination/Paginator.ts";

export function useLayoutTree(
  document: Document,
  size: PageSize,
  margins: PageMargins,
  measurer: BlockMeasurer,
): LayoutTree {
  return useMemo(() => {
    const geometry = createPageGeometry(size, margins);
    const measuredBlocks = measureBlocks(document.blocks, measurer);
    return paginate(measuredBlocks, geometry, document.id);
  }, [document, size, margins, measurer]);
}
