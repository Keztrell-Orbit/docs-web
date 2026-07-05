import { useMemo, useState, useEffect } from "react";
import { createSampleDocument } from "./editor/model.ts";
import { placeholderBlockMeasurer } from "./editor/services/blockMeasurer.ts";
import { A4, defaultMargins, measureBlocks, paginate, buildSnapshot } from "./layout/index.ts";
import { validateLayoutTree } from "./layout/validate.ts";
import { useDomMeasurements } from "./renderer/hooks/useDomMeasurements.ts";
import { HiddenMeasurementLayer } from "./renderer/HiddenMeasurementLayer.tsx";
import { printComparisonTable } from "./debug/printComparisonTable.ts";
import { InteractiveWorkspace } from "./editor/interaction/components/InteractiveWorkspace.tsx";
import type { Block, BlockMeasurer, BlockMeasureResult } from "./editor/types.ts";

export default function App() {
  const [debugLayout, setDebugLayout] = useState(true);
  const doc = useMemo(() => createSampleDocument(), []);
  const contentWidth = A4.width - defaultMargins.left - defaultMargins.right;

  const [measuredHeights, setMeasuredHeights] = useState<Map<string, number> | null>(null);

  const measurer: BlockMeasurer = useMemo(() => {
    if (measuredHeights) {
      return {
        measure(block: Block): BlockMeasureResult {
          const h = measuredHeights.get(block.id);
          const contentHeight = h ?? placeholderBlockMeasurer.measure(block).contentHeight;
          return { contentHeight, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, borderTop: 0, borderBottom: 0 };
        },
      };
    }
    return placeholderBlockMeasurer;
  }, [measuredHeights]);

  const measuredBlocks = useMemo(
    () => measureBlocks(doc.blocks, measurer),
    [doc.blocks, measurer],
  );

  const tree = useMemo(() => {
    const result = paginate(measuredBlocks, A4.width, A4.height, defaultMargins, doc.id);
    if (import.meta.env.DEV) validateLayoutTree(result);
    return result;
  }, [measuredBlocks]);

  const metricsMap = useMemo(() => {
    const map = new Map<string, BlockMeasureResult>();
    for (const mb of measuredBlocks) {
      map.set(mb.blockId, mb.metrics);
    }
    return map;
  }, [measuredBlocks]);

  const domMeasurements = useDomMeasurements(
    debugLayout,
    tree,
    measuredHeights,
    metricsMap,
  );

  useEffect(() => {
    if (!debugLayout || domMeasurements.length === 0) return;
    printComparisonTable(tree, domMeasurements);
  }, [debugLayout, domMeasurements, tree]);

  return (
    <>
      <button
        onClick={() => setDebugLayout((p) => !p)}
        style={{
          position: "fixed",
          top: 8,
          right: 8,
          zIndex: 9999,
          padding: "4px 10px",
          fontSize: 12,
          cursor: "pointer",
          background: debugLayout ? "#ef4444" : "#22c55e",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          fontFamily: "monospace",
        }}
      >
        Debug: {debugLayout ? "ON" : "OFF"}
      </button>
      <HiddenMeasurementLayer
        blocks={doc.blocks.map((b) => ({ blockId: b.id, snapshot: buildSnapshot(b) }))}
        contentWidth={contentWidth}
        onMeasure={setMeasuredHeights}
      />
      <InteractiveWorkspace
        tree={tree}
        debugLayout={debugLayout}
        domMeasurements={domMeasurements}
        debugInteraction={debugLayout}
      />
    </>
  );
}
