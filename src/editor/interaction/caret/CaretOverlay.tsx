import { useMemo } from "react";
import { CaretGeometry } from "../../core/geometry/CaretGeometry.ts";
import type { CoordinateMapper } from "../../core/coordinates/CoordinateMapper.ts";
import type { LayoutState } from "../../core/coordinates/LayoutState.ts";
import type { CharacterAddress } from "../../core/coordinates/CoordinateTypes.ts";

const CARET_COLOR = "#000000";

interface CaretOverlayProps {
  caretAddress: CharacterAddress;
  mapper: CoordinateMapper;
  layout: LayoutState;
  registryVersion: number;
  focused: boolean;
  visible: boolean;
}

export function CaretOverlay({
  caretAddress,
  mapper,
  layout,
  registryVersion,
  focused,
  visible,
}: CaretOverlayProps) {
  const geometry = useMemo(() => new CaretGeometry(mapper, layout), [mapper, layout]);

  const rect = useMemo(() => {
    if (!caretAddress.blockId) return null;
    return geometry.getRect(caretAddress);
  }, [geometry, caretAddress, registryVersion]);

  if (!focused || !visible || !rect) return null;

  const { x, y, width, height } = rect;

  return (
    <div
      style={{
        position: "fixed",
        left: x,
        top: y,
        width,
        height,
        backgroundColor: CARET_COLOR,
        pointerEvents: "none",
        zIndex: 1000,
      }}
    />
  );
}
