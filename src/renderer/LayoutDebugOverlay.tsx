import type { LayoutBlock } from "../layout/types.ts";
import type { DomBlockMeasurement } from "./hooks/useDomMeasurements.ts";
import { buildDebugReport } from "../debug/report.ts";
import type { WarningLevel } from "../debug/types.ts";

interface LayoutDebugOverlayProps {
  block: LayoutBlock;
  dom?: DomBlockMeasurement;
}

const BORDER_COLOR: Record<WarningLevel, string> = {
  FATAL: "rgba(239,68,68,0.7)",
  ERROR: "rgba(249,115,22,0.7)",
  WARNING: "rgba(234,179,8,0.7)",
  INFO: "rgba(34,197,94,0.35)",
};

export function LayoutDebugOverlay({ block, dom }: LayoutDebugOverlayProps) {
  if (!dom) return null;

  const report = buildDebugReport(block, dom);
  const borderColor = BORDER_COLOR[report.level];
  const isInfo = report.level === "INFO";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        border: `2px solid ${borderColor}`,
        boxSizing: "border-box",
      }}
    >
      {!isInfo && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            fontSize: 10,
            fontFamily: "monospace",
            color: "#333",
            background: "rgba(255,255,255,0.85)",
            padding: "2px 4px",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
          }}
          title={
            `y(L):${block.y} | y(DOM):${dom.pageRelativeTop.toFixed(1)} | ΔY:${report.deltaY.toFixed(1)} | ` +
            `Outer: L=${dom.layoutOuterHeight} vs DOM=${dom.domOuterHeight.toFixed(1)} | ` +
            `Content: L=${dom.layoutContentHeight} vs DOM=${dom.domContentHeight.toFixed(1)}`
          }
        >
          <div>
            ◆ {block.blockId} ({block.snapshot.type}) | {block.pageId.replace("page-", "")}
          </div>
          <div>
            Y Δ={report.deltaY.toFixed(1)}px{report.deltaY >= 1 && " ⚠"}
            {" | "}
            outer Δ={Math.abs(dom.layoutOuterHeight - dom.domOuterHeight).toFixed(1)}px
            {" | "}
            content Δ={Math.abs(dom.layoutContentHeight - dom.domContentHeight).toFixed(1)}px
          </div>
        </div>
      )}
    </div>
  );
}
