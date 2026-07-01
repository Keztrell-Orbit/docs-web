export interface DocSnapshot {
  label: string;
  timestamp: string;
  showLogo: boolean;
  content: string;
}

export interface OutlinePart {
  id: string;
  title: string;
}

export interface OutlineChapter {
  id: string;
  title: string;
  parts?: OutlinePart[];
}

export const PAGE_DIMENSIONS = {
  A4: { width: "794px", minHeight: "1123px" },
  A5: { width: "560px", minHeight: "792px" },
  A6: { width: "397px", minHeight: "561px" },
  Letter: { width: "816px", minHeight: "1056px" },
};
