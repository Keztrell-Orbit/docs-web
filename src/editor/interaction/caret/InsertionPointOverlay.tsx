import { useMemo } from "react";
import type { CoordinateMapper } from "../../core/coordinates/CoordinateMapper.ts";
import type { LayoutState } from "../../core/coordinates/LayoutState.ts";
import type { CharacterAddress } from "../../core/coordinates/CoordinateTypes.ts";

interface InsertionPointOverlayProps {
  focusedBlockId: string | null;
  mapper: CoordinateMapper;
  layout: LayoutState;
  caretAddress: CharacterAddress | null;
  enabled?: boolean;
}

const LABEL_EVERY_NTH = 10;

export function InsertionPointOverlay({
  focusedBlockId,
  mapper,
  layout,
  caretAddress,
  enabled = true,
}: InsertionPointOverlayProps) {
  const markers = useMemo(() => {
    if (!focusedBlockId) return null;
    try {
      const textLayout = layout.getTextLayout(focusedBlockId);

      const topLines = [];
      const baselineLines = [];
      const insertionLines = [];
      const charBoxRects = [];
      const labels = [];
      let lineCount = 0;

      for (const line of textLayout.lines) {
        const lineTopVp = mapper.blockLocalToViewport(focusedBlockId, 0, line.top);
        const lineEndVp = mapper.blockLocalToViewport(focusedBlockId, line.width, line.top);
        const baselineVp = mapper.blockLocalToViewport(focusedBlockId, 0, line.baseline);

        topLines.push({
          key: `top-${line.index}`,
          x: lineTopVp.x,
          y: lineTopVp.y,
          width: lineEndVp.x - lineTopVp.x,
        });

        baselineLines.push({
          key: `bl-${line.index}`,
          x: baselineVp.x,
          y: baselineVp.y,
          width: lineEndVp.x - lineTopVp.x,
        });

        for (const ip of line.insertionPoints) {
          const iv = mapper.blockLocalToViewport(focusedBlockId, ip.x, ip.y);
          insertionLines.push({
            key: `ip-${ip.charIndex}`,
            x: iv.x,
            y: iv.y,
            height: ip.height,
            charIndex: ip.charIndex,
          });
          if (ip.charIndex % LABEL_EVERY_NTH === 0) {
            labels.push({
              key: `l-${ip.charIndex}`,
              x: iv.x + 2,
              y: iv.y + 10,
              text: `#${ip.charIndex} ${ip.x.toFixed(1)}px`,
            });
          }
        }

        if (line.characterBoxes) {
          for (const cb of line.characterBoxes) {
            const cv = mapper.blockLocalToViewport(focusedBlockId, cb.x, line.top);
            charBoxRects.push({
              key: `cb-${cb.index}`,
              x: cv.x,
              y: cv.y,
              width: cb.width,
              height: line.height,
            });
          }
        }

        lineCount++;
      }

      return { topLines, baselineLines, insertionLines, charBoxRects, labels };
    } catch {
      return null;
    }
  }, [focusedBlockId, mapper, layout]);

  const caretPos = useMemo(() => {
    if (!caretAddress || !caretAddress.blockId || !focusedBlockId || caretAddress.blockId !== focusedBlockId) return null;
    try {
      const textLayout = layout.getTextLayout(caretAddress.blockId);

      for (const line of textLayout.lines) {
        const firstIdx = line.insertionPoints.length > 0 ? line.insertionPoints[0].charIndex : 0;
        const lastIdx = line.insertionPoints.length > 0 ? line.insertionPoints[line.insertionPoints.length - 1].charIndex : 0;
        if (caretAddress.charIndex >= firstIdx && caretAddress.charIndex <= lastIdx) {
          const local = caretAddress.charIndex - firstIdx;
          const ip = line.insertionPoints[local];
          if (!ip) return null;
          const iv = mapper.blockLocalToViewport(focusedBlockId, ip.x, ip.y);
          return { x: iv.x, y: iv.y, height: ip.height };
        }
      }
      return null;
    } catch {
      return null;
    }
  }, [caretAddress, focusedBlockId, mapper, layout]);

  if (!enabled || !markers) return null;

  return (
    <>
      {markers.topLines.map((l) => (
        <div
          key={l.key}
          style={{
            position: "fixed",
            left: l.x,
            top: l.y,
            width: l.width,
            height: 1,
            background: "rgba(0, 200, 0, 0.4)",
            pointerEvents: "none",
            zIndex: 9998,
          }}
        />
      ))}
      {markers.baselineLines.map((l) => (
        <div
          key={l.key}
          style={{
            position: "fixed",
            left: l.x,
            top: l.y,
            width: l.width,
            height: 1,
            background: "rgba(200, 200, 0, 0.4)",
            pointerEvents: "none",
            zIndex: 9998,
          }}
        />
      ))}
      {markers.charBoxRects.map((r) => (
        <div
          key={r.key}
          style={{
            position: "fixed",
            left: r.x,
            top: r.y,
            width: r.width,
            height: r.height,
            border: "1px solid rgba(200, 0, 0, 0.3)",
            background: "rgba(200, 0, 0, 0.06)",
            pointerEvents: "none",
            zIndex: 9997,
          }}
        />
      ))}
      {markers.insertionLines.map((l) => (
        <div
          key={l.key}
          style={{
            position: "fixed",
            left: l.x,
            top: l.y,
            width: 1,
            height: l.height,
            background: "rgba(0, 120, 255, 0.35)",
            pointerEvents: "none",
            zIndex: 9996,
          }}
        />
      ))}
      {caretPos && (
        <div
          style={{
            position: "fixed",
            left: caretPos.x,
            top: caretPos.y,
            width: 2,
            height: caretPos.height,
            background: "rgba(220, 0, 0, 0.8)",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />
      )}
      {markers.labels.map((l) => (
        <div
          key={l.key}
          style={{
            position: "fixed",
            left: l.x,
            top: l.y,
            fontSize: 9,
            fontFamily: "monospace",
            color: "rgba(0,120,255,0.7)",
            pointerEvents: "none",
            zIndex: 9999,
            lineHeight: 1,
          }}
        >
          {l.text}
        </div>
      ))}
    </>
  );
}
