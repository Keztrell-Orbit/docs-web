import type { LayoutBlock } from "../../layout/types.ts";

export interface PagePosition {
  pageId: string;
}

export interface BlockPosition extends PagePosition {
  blockId: string;
}

export interface CharacterPosition extends BlockPosition {
  charIndex: number;
}

export interface CaretState {
  position: CharacterPosition;
  preferredX: number | null;
  visible: boolean;
  focused: boolean;
}

export interface SelectionState {
  anchor: CharacterPosition | null;
  focus: CharacterPosition | null;
}

export interface PointerState {
  clientX: number;
  clientY: number;
  buttons: number;
  isDown: boolean;
  clickCount: number;
}

export interface HoverState {
  pageId: string | null;
  blockId: string | null;
  lineIndex: number | null;
  charIndex: number | null;
}

export interface InteractionState {
  caret: CaretState;
  selection: SelectionState;
  pointer: PointerState;
  hover: HoverState;
  focusedPageId: string | null;
  focusedBlockId: string | null;
  pressedKeys: Set<string>;
}

export type InteractionAction =
  | { type: "CARET_MOVED"; position: CharacterPosition; extend?: boolean; preferredX?: number | null }
  | { type: "SELECTION_EXTENDED"; focus: CharacterPosition }
  | { type: "SELECTION_COLLAPSED" }
  | { type: "SELECTION_CLEARED" }
  | { type: "SELECT_WORD"; anchor: CharacterPosition; focus: CharacterPosition }
  | { type: "SELECT_LINE"; anchor: CharacterPosition; focus: CharacterPosition }
  | { type: "SELECT_PARAGRAPH"; anchor: CharacterPosition; focus: CharacterPosition }
  | { type: "SELECT_ALL"; anchor: CharacterPosition; focus: CharacterPosition }
  | { type: "POINTER_DOWN"; clientX: number; clientY: number; buttons: number; clickCount: number }
  | { type: "POINTER_MOVE"; clientX: number; clientY: number; buttons: number }
  | { type: "POINTER_UP" }
  | { type: "HOVER_CHANGED"; pageId: string | null; blockId: string | null; lineIndex: number | null; charIndex: number | null }
  | { type: "KEY_PRESSED"; key: string }
  | { type: "KEY_RELEASED"; key: string }
  | { type: "FOCUS_CHANGED"; pageId: string | null; blockId: string | null }
  | { type: "CARET_BLINK" }
  | { type: "CARET_FOCUS" }
  | { type: "CARET_BLUR" }
  | { type: "CARET_SHOW" }
  | { type: "CARET_HIDE" };

// ——— Layout types ———
// InsertionPoint is the single source of truth for caret/selection/coordinate geometry.
// CharacterBox is optional debug-only metadata.

export interface TextLayout {
  blockId: string;
  documentVersion: number;
  width: number;
  height: number;
  lines: LineLayout[];
}

export interface LineLayout {
  index: number;
  top: number;
  baseline: number;
  height: number;
  width: number;
  insertionPoints: InsertionPoint[];
  characterBoxes?: CharacterBox[];
}

export interface InsertionPoint {
  charIndex: number;
  x: number;
  y: number;
  height: number;
}

export interface CharacterBox {
  index: number;
  char: string;
  x: number;
  width: number;
}

export interface HitTestResult {
  pageId: string;
  block: LayoutBlock | null;
  lineIndex: number | null;
  charIndex: number | null;
  position: CharacterPosition;
  pageLocalX: number;
  pageLocalY: number;
}

export interface WordBoundary {
  start: number;
  end: number;
}

// ——— LineLayout helpers (derive start/end from insertion points) ———

export function lineStartIndex(line: LineLayout): number {
  return line.insertionPoints.length > 0 ? line.insertionPoints[0].charIndex : 0;
}

export function lineEndIndex(line: LineLayout): number {
  return line.insertionPoints.length > 0
    ? line.insertionPoints[line.insertionPoints.length - 1].charIndex
    : 0;
}

export function lineContainsChar(line: LineLayout, charIndex: number): boolean {
  return charIndex >= lineStartIndex(line) && charIndex <= lineEndIndex(line);
}
