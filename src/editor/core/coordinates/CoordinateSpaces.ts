export const COORDINATE_SPACES = [
  "document",
  "page",
  "block",
  "line",
  "character",
  "viewport",
  "screen",
] as const;

export type CoordinateSpace = typeof COORDINATE_SPACES[number];

export const SPACE_LABELS: Record<CoordinateSpace, string> = {
  document: "Document",
  page: "Page",
  block: "Block",
  line: "Line",
  character: "Character",
  viewport: "Viewport",
  screen: "Screen",
};

export const SPACE_DESCRIPTIONS: Record<CoordinateSpace, string> = {
  document: "Logical document position (pageId, blockId, charIndex)",
  page: "Page-relative pixels (inside margins)",
  block: "Block origin relative to page content area",
  line: "Block-local line position",
  character: "Block-local character position",
  viewport: "Viewport CSS pixels",
  screen: "Physical device pixels (×devicePixelRatio)",
};
