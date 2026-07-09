import { useLayoutEffect, useState } from "react";
import type { LayoutTree } from "../../layout/types.ts";
import type { BlockMeasureResult } from "../../editor/types.ts";

export interface DomBlockMeasurement {
  blockId: string;
  pageId: string;
  pageTop: number;
  viewportTop: number;
  pageRelativeTop: number;
  domOuterHeight: number;
  wrapperMarginTop: number;
  wrapperMarginBottom: number;
  domContentHeight: number;
  contentPaddingTop: number;
  contentPaddingBottom: number;
  contentBorderTop: number;
  contentBorderBottom: number;
  intrinsicHeight: number;
  layoutOuterHeight: number;
  layoutContentHeight: number;
}

export function useDomMeasurements(
  active: boolean,
  tree: LayoutTree | null,
  intrinsicHeights: Map<string, number> | null,
  metricsMap: Map<string, BlockMeasureResult> | null,
): DomBlockMeasurement[] {
  const [measurements, setMeasurements] = useState<DomBlockMeasurement[]>([]);

  useLayoutEffect(() => {
    if (!active || !tree) {
      setMeasurements([]);
      return;
    }

    const blocks = document.querySelectorAll<HTMLElement>("[data-block-id]");
    const results: DomBlockMeasurement[] = [];

    for (const el of blocks) {
      const blockId = el.getAttribute("data-block-id") ?? "";
      const pageEl = el.closest<HTMLElement>("[data-page-id]");
      const pageId = pageEl?.getAttribute("data-page-id") ?? "";
      const rect = el.getBoundingClientRect();
      const pageRect = pageEl?.getBoundingClientRect();
      const pageTop = pageRect?.top ?? 0;

      const layoutHeightAttr = el.getAttribute("data-layout-height");
      const layoutOuterHeight = layoutHeightAttr ? parseFloat(layoutHeightAttr) : 0;

      const wrapperStyle = getComputedStyle(el);
      const wrapperMarginTop = parseFloat(wrapperStyle.marginTop) || 0;
      const wrapperMarginBottom = parseFloat(wrapperStyle.marginBottom) || 0;

      const contentEl = el.querySelector<HTMLElement>(
        "[data-block-content-id]",
      );
      const contentRect = contentEl?.getBoundingClientRect();
      const contentStyle = contentEl ? getComputedStyle(contentEl) : null;

      const metrics = metricsMap?.get(blockId);
      const layoutContentHeight = metrics
        ? metrics.contentHeight
        : layoutOuterHeight;

      results.push({
        blockId,
        pageId,
        pageTop,
        viewportTop: rect.top,
        pageRelativeTop: rect.top - pageTop,
        domOuterHeight:
          rect.height + wrapperMarginTop + wrapperMarginBottom,
        wrapperMarginTop,
        wrapperMarginBottom,
        domContentHeight: contentRect?.height ?? 0,
        contentPaddingTop:
          parseFloat(contentStyle?.paddingTop ?? "0") || 0,
        contentPaddingBottom:
          parseFloat(contentStyle?.paddingBottom ?? "0") || 0,
        contentBorderTop:
          parseFloat(contentStyle?.borderTopWidth ?? "0") || 0,
        contentBorderBottom:
          parseFloat(contentStyle?.borderBottomWidth ?? "0") || 0,
        intrinsicHeight: intrinsicHeights?.get(blockId) ?? 0,
        layoutOuterHeight,
        layoutContentHeight,
      });
    }

    setMeasurements(results);
  }, [active, tree, intrinsicHeights, metricsMap]);

  return measurements;
}
