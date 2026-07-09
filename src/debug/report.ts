import type { LayoutBlock } from "../layout/types.ts";
import type { DomBlockMeasurement } from "../renderer/hooks/useDomMeasurements.ts";
import type { DebugMetrics, DebugBlockReport, WarningLevel } from "./types.ts";

const LEVEL_ORDER: WarningLevel[] = ["INFO", "WARNING", "ERROR", "FATAL"];

function maxLevel(a: WarningLevel, b: WarningLevel): WarningLevel {
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b;
}

export function buildDebugReport(
  block: LayoutBlock,
  dom: DomBlockMeasurement,
): DebugBlockReport {
  const deltaY = Math.abs(block.y - dom.pageRelativeTop);
  const deltaOuter = Math.abs(dom.layoutOuterHeight - dom.domOuterHeight);
  const deltaContent = Math.abs(dom.layoutContentHeight - dom.domContentHeight);

  const metrics: DebugMetrics = {
    layoutContentHeight: dom.layoutContentHeight,
    layoutOuterHeight: dom.layoutOuterHeight,
    domContentHeight: dom.domContentHeight,
    domOuterHeight: dom.domOuterHeight,
    marginTop: dom.wrapperMarginTop,
    marginBottom: dom.wrapperMarginBottom,
    paddingTop: dom.contentPaddingTop,
    paddingBottom: dom.contentPaddingBottom,
    borderTop: dom.contentBorderTop,
    borderBottom: dom.contentBorderBottom,
  };

  const issues: string[] = [];
  let level: WarningLevel = "INFO";

  if (dom.intrinsicHeight === 0) {
    issues.push("awaiting offscreen measurement");
    return {
      blockId: block.blockId,
      pageId: block.pageId,
      snapshotType: block.snapshot.type,
      yLayout: block.y,
      yDom: dom.pageRelativeTop,
      deltaY: 0,
      metrics,
      level: "INFO",
      issues,
    };
  }

  if (deltaY >= 1) {
    issues.push(`Y Δ=${deltaY.toFixed(1)}px`);
    level = deltaY > 8 ? maxLevel(level, "FATAL") : maxLevel(level, "WARNING");
  }

  if (deltaOuter > 2) {
    issues.push(`outer H Δ=${deltaOuter.toFixed(1)}px`);
    level = deltaOuter > 8 ? maxLevel(level, "ERROR") : maxLevel(level, "WARNING");
  }

  if (deltaContent > 2) {
    issues.push(`content H Δ=${deltaContent.toFixed(1)}px`);
    level = deltaContent > 8 ? maxLevel(level, "ERROR") : maxLevel(level, "WARNING");
  }

  return {
    blockId: block.blockId,
    pageId: block.pageId,
    snapshotType: block.snapshot.type,
    yLayout: block.y,
    yDom: dom.pageRelativeTop,
    deltaY,
    metrics,
    level,
    issues,
  };
}
