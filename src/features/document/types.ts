export interface HeadingBlock {
  type: "heading";
  id: string;
  level: 1 | 2 | 3;
  text: string;
}

export interface ParagraphBlock {
  type: "paragraph";
  id: string;
  text: string;
}

export interface ImageBlock {
  type: "image";
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface TableBlock {
  type: "table";
  id: string;
  rows: number;
  columns: number;
  cells: string[][];
}

export type Block = HeadingBlock | ParagraphBlock | ImageBlock | TableBlock;

export interface Document {
  id: string;
  title: string;
  blocks: Block[];
}

export interface BlockMeasureResult {
  height: number;
}

export interface BlockMeasurer {
  measure(block: Block): BlockMeasureResult;
}
