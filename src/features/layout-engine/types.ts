import type { Block } from "../document/types.ts";

export interface MeasuredBlock {
  block: Block;
  height: number;
}

export interface PageSize {
  width: number;
  height: number;
  label: string;
}

export interface PageMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PageGeometry {
  size: PageSize;
  margins: PageMargins;
  contentX: number;
  contentY: number;
  contentWidth: number;
  contentHeight: number;
}

export interface LayoutBlock {
  id: string;
  type: Block["type"];
  x: number;
  y: number;
  width: number;
  height: number;
  data: Block;
}

export interface LayoutPage {
  index: number;
  geometry: PageGeometry;
  usableHeight: number;
  usedHeight: number;
  blocks: LayoutBlock[];
}

export interface LayoutTree {
  documentId: string;
  pages: LayoutPage[];
}
