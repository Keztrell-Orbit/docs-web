// ——— Address types (logical document locations, no pixels) ———

export interface CharacterAddress {
  readonly __address: "character";
  pageId: string;
  blockId: string;
  charIndex: number;
}

export interface LineAddress {
  readonly __address: "line";
  pageId: string;
  blockId: string;
  lineIndex: number;
}

export interface BlockAddress {
  readonly __address: "block";
  pageId: string;
  blockId: string;
}

export interface PageAddress {
  readonly __address: "page";
  pageId: string;
}

// ——— Point types (pixel positions with address metadata) ———

export interface CharacterPoint {
  readonly __point: "character";
  pageId: string;
  blockId: string;
  lineIndex: number;
  charIndex: number;
  x: number;
  y: number;
}

export interface LinePoint {
  readonly __point: "line";
  pageId: string;
  blockId: string;
  lineIndex: number;
  x: number;
  y: number;
}

export interface BlockPoint {
  readonly __point: "block";
  pageId: string;
  blockId: string;
  x: number;
  y: number;
}

export interface PagePoint {
  readonly __point: "page";
  x: number;
  y: number;
}

export interface ViewportPoint {
  readonly __point: "viewport";
  x: number;
  y: number;
}

export interface ScreenPoint {
  readonly __point: "screen";
  x: number;
  y: number;
}

// ——— Geometry types ———

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ——— Factory functions ———

export function characterAddress(pageId: string, blockId: string, charIndex: number): CharacterAddress {
  return { __address: "character", pageId, blockId, charIndex };
}

export function lineAddress(pageId: string, blockId: string, lineIndex: number): LineAddress {
  return { __address: "line", pageId, blockId, lineIndex };
}

export function blockAddress(pageId: string, blockId: string): BlockAddress {
  return { __address: "block", pageId, blockId };
}

export function pageAddress(pageId: string): PageAddress {
  return { __address: "page", pageId };
}

export function characterPoint(
  pageId: string, blockId: string, lineIndex: number, charIndex: number, x: number, y: number,
): CharacterPoint {
  return { __point: "character", pageId, blockId, lineIndex, charIndex, x, y };
}

export function linePoint(pageId: string, blockId: string, lineIndex: number, x: number, y: number): LinePoint {
  return { __point: "line", pageId, blockId, lineIndex, x, y };
}

export function blockPoint(pageId: string, blockId: string, x: number, y: number): BlockPoint {
  return { __point: "block", pageId, blockId, x, y };
}

export function pagePoint(x: number, y: number): PagePoint {
  return { __point: "page", x, y };
}

export function viewportPoint(x: number, y: number): ViewportPoint {
  return { __point: "viewport", x, y };
}

export function screenPoint(x: number, y: number): ScreenPoint {
  return { __point: "screen", x, y };
}

export function rect(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height };
}

// ——— Error type ———

export class CoordinateError extends Error {
  constructor(message: string) {
    super(`[Coordinate] ${message}`);
    this.name = "CoordinateError";
  }
}
