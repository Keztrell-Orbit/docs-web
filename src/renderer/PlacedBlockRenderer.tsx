import type { LayoutBlock } from "../layout/types.ts";
import type { DomBlockMeasurement } from "./hooks/useDomMeasurements.ts";
import { LayoutDebugOverlay } from "./LayoutDebugOverlay.tsx";
import { BlockContentRenderer } from "./BlockContentRenderer.tsx";

interface PlacedBlockRendererProps {
  block: LayoutBlock;
  debugLayout?: boolean;
  domMeasurement?: DomBlockMeasurement;
}

export function PlacedBlockRenderer({
  block,
  debugLayout,
  domMeasurement,
}: PlacedBlockRendererProps) {
  const containerStyle: React.CSSProperties = {
    position: "absolute",
    top: block.y,
    left: block.x,
    width: block.width,
  };

  return (
    <div
      style={containerStyle}
      data-block-id={block.blockId}
      data-layout-height={block.height}
    >
      <div data-block-content-id={block.blockId}>
        <BlockContentRenderer snapshot={block.snapshot} />
      </div>
      {debugLayout && (
        <LayoutDebugOverlay block={block} dom={domMeasurement} />
      )}
    </div>
  );
}
