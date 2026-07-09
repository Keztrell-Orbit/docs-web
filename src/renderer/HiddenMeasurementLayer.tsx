import { useRef, useLayoutEffect } from "react";
import type { RenderSnapshot } from "../layout/types.ts";
import { BlockContentRenderer } from "./BlockContentRenderer.tsx";

interface MeasurementBlock {
  blockId: string;
  snapshot: RenderSnapshot;
}

interface HiddenMeasurementLayerProps {
  blocks: MeasurementBlock[];
  contentWidth: number;
  onMeasure: (heights: Map<string, number>) => void;
}

export function HiddenMeasurementLayer({
  blocks,
  contentWidth,
  onMeasure,
}: HiddenMeasurementLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const blocksKey = useRef("");

  const currentKey = blocks.map((b) => b.blockId).join(",");
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (blocksKey.current === currentKey) return;
    blocksKey.current = currentKey;

    const heights = new Map<string, number>();
    for (const { blockId } of blocks) {
      const el = containerRef.current.querySelector<HTMLElement>(
        `[data-measure-id="${blockId}"]`,
      );
      if (el) {
        heights.set(blockId, el.getBoundingClientRect().height);
      }
    }

    if (heights.size > 0) {
      onMeasure(heights);
    }
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        left: "-9999px",
        top: 0,
        visibility: "hidden",
        width: contentWidth,
      }}
    >
      {blocks.map(({ blockId, snapshot }) => (
        <div key={blockId} data-measure-id={blockId}>
          <BlockContentRenderer snapshot={snapshot} />
        </div>
      ))}
    </div>
  );
}
