import type { LayoutBlock } from "../layout/types.ts";
import type { DomBlockMeasurement } from "./hooks/useDomMeasurements.ts";
import { PlacedBlockRenderer } from "./PlacedBlockRenderer.tsx";

interface PageContentLayerProps {
  pageId: string;
  blocks: LayoutBlock[];
  debugLayout?: boolean;
  domMeasurements?: DomBlockMeasurement[];
}

export function PageContentLayer({
  pageId,
  blocks,
  debugLayout,
  domMeasurements,
}: PageContentLayerProps) {
  const domMap = new Map(domMeasurements?.map((m) => [m.blockId, m]) ?? []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }} data-page-id={pageId}>
      {blocks.map((block) => (
        <PlacedBlockRenderer
          key={block.blockId}
          block={block}
          debugLayout={debugLayout}
          domMeasurement={domMap.get(block.blockId)}
        />
      ))}
    </div>
  );
}
