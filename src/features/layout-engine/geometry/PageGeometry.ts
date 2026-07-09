import type { PageSize, PageMargins, PageGeometry } from "../types.ts";

export const A4: PageSize = {
  width: 595.28,
  height: 841.89,
  label: "A4",
};

export const Letter: PageSize = {
  width: 612,
  height: 792,
  label: "Letter",
};

export const Legal: PageSize = {
  width: 612,
  height: 1008,
  label: "Legal",
};

export const defaultMargins: PageMargins = {
  top: 72,
  bottom: 72,
  left: 72,
  right: 72,
};

export function createPageGeometry(
  size: PageSize,
  margins: PageMargins,
): PageGeometry {
  return {
    size,
    margins,
    contentX: margins.left,
    contentY: margins.top,
    contentWidth: size.width - margins.left - margins.right,
    contentHeight: size.height - margins.top - margins.bottom,
  };
}
