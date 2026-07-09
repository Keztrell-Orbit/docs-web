import { useMemo } from "react";
import type { InteractionState } from "../types.ts";
import { SelectionModel } from "./SelectionModel.ts";
import { SelectionGeometry } from "../../core/geometry/SelectionGeometry.ts";
import type { CoordinateMapper } from "../../core/coordinates/CoordinateMapper.ts";
import type { LayoutState } from "../../core/coordinates/LayoutState.ts";
import type { CharacterAddress } from "../../core/coordinates/CoordinateTypes.ts";
import { characterAddress } from "../../core/coordinates/CoordinateTypes.ts";

const HIGHLIGHT_COLOR = "rgba(166, 200, 255, 0.4)";
const HIGHLIGHT_BORDER_COLOR = "rgba(120, 170, 250, 0.8)";

interface SelectionOverlayProps {
  state: InteractionState;
  mapper: CoordinateMapper;
  layout: LayoutState;
  registryVersion: number;
}

export function SelectionOverlay({
  state,
  mapper,
  layout,
  registryVersion,
}: SelectionOverlayProps) {
  const geometry = useMemo(() => new SelectionGeometry(mapper, layout), [mapper, layout]);

  const rects = useMemo(() => {
    if (SelectionModel.isSelectionEmpty(state)) return [];

    const anchor = state.selection.anchor;
    const focus = state.selection.focus;
    if (!anchor || !focus) return [];

    const start = toAddr(anchor);
    const end = toAddr(focus);

    return geometry.getRects(start, end);
  }, [state.selection, geometry, registryVersion]);

  if (rects.length === 0) return null;

  return (
    <>
      {rects.map((rect, i) => (
        <div
          key={`${rect.pageId}-${i}`}
          style={{
            position: "fixed",
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            backgroundColor: HIGHLIGHT_COLOR,
            borderLeft: `1px solid ${HIGHLIGHT_BORDER_COLOR}`,
            pointerEvents: "none",
            zIndex: 500,
          }}
        />
      ))}
    </>
  );
}

function toAddr(pos: { pageId: string; blockId: string; charIndex: number }): CharacterAddress {
  return characterAddress(pos.pageId, pos.blockId, pos.charIndex);
}
