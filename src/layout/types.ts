import type { Block, BlockMeasureResult } from "../editor/types.ts";

export interface RenderSnapshot {
  type: Block["type"];
  text?: string;
  level?: 1 | 2 | 3;
  src?: string;
  alt?: string;
  imageWidth?: number;
  imageHeight?: number;
  cells?: string[][];
}

export interface MeasuredBlock {
  blockId: string;
  snapshot: RenderSnapshot;
  metrics: BlockMeasureResult;
  outerHeight: number;
}

export interface LayoutBlock {
  blockId: string;
  pageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  snapshot: RenderSnapshot;
}

export interface LayoutPage {
  id: string;
  width: number;
  height: number;
  margin: { top: number; bottom: number; left: number; right: number };
  blocks: LayoutBlock[];
}

export interface LayoutTree {
  documentId: string;
  pages: LayoutPage[];
}
