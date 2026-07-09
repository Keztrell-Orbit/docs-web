import type { CoordinateMapper } from "./CoordinateMapper.ts";
import type { CharacterAddress, ViewportPoint, Rect } from "./CoordinateTypes.ts";

export interface CoordinateBreakdown {
  address: CharacterAddress;
  character: { x: number; y: number; lineIndex: number } | null;
  line: { x: number; y: number; blockId: string } | null;
  block: { x: number; y: number } | null;
  page: { x: number; y: number } | null;
  viewport: ViewportPoint | null;
  viewportFromDom: { left: number; top: number } | null;
  error?: string;
}

export interface AssertionResult {
  breakdown: CoordinateBreakdown;
  expectedViewport: ViewportPoint | null;
  actualDomPosition: { left: number; top: number } | null;
  deltaX: number | null;
  deltaY: number | null;
  passed: boolean;
  failingStep: string | null;
}

const TOLERANCE_PX = 1;

export function computeBreakdown(
  mapper: CoordinateMapper,
  addr: CharacterAddress,
  domPosition?: { left: number; top: number },
): CoordinateBreakdown {
  try {
    const char = mapper.documentToCharacter(addr);
    const line = mapper.characterToLine(char);
    const page = mapper.lineToPage(line);
    const blockOrigin = mapper.getBlockOrigin(addr.blockId);
    const vp = mapper.pageToViewport(addr.pageId, page);

    return {
      address: addr,
      character: { x: char.x, y: char.y, lineIndex: char.lineIndex },
      line: { x: line.x, y: line.y, blockId: line.blockId },
      block: blockOrigin ? { x: blockOrigin.x, y: blockOrigin.y } : null,
      page: { x: page.x, y: page.y },
      viewport: vp,
      viewportFromDom: domPosition ?? null,
    };
  } catch (e) {
    return {
      address: addr,
      character: null,
      line: null,
      block: null,
      page: null,
      viewport: null,
      viewportFromDom: domPosition ?? null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export function assertViewportPosition(
  mapper: CoordinateMapper,
  addr: CharacterAddress,
  actualDomPosition: { left: number; top: number },
): AssertionResult {
  const breakdown = computeBreakdown(mapper, addr, actualDomPosition);

  if (!breakdown.viewport) {
    return {
      breakdown,
      expectedViewport: null,
      actualDomPosition,
      deltaX: null,
      deltaY: null,
      passed: false,
      failingStep: breakdown.error ?? "documentToViewport",
    };
  }

  const expectedViewport = breakdown.viewport;
  const deltaX = actualDomPosition.left - expectedViewport.x;
  const deltaY = actualDomPosition.top - expectedViewport.y;
  const passed = Math.abs(deltaX) <= TOLERANCE_PX && Math.abs(deltaY) <= TOLERANCE_PX;

  let failingStep: string | null = null;
  if (!passed) {
    if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
      failingStep = "pageToViewport (possible pageRect/margin mismatch)";
    }
  }

  return {
    breakdown,
    expectedViewport,
    actualDomPosition,
    deltaX,
    deltaY,
    passed,
    failingStep,
  };
}

export function assertViewportRect(
  mapper: CoordinateMapper,
  addr: CharacterAddress,
  actualRect: Rect,
  expectedRect: Rect,
): string | null {
  const dx = actualRect.x - expectedRect.x;
  const dy = actualRect.y - expectedRect.y;
  const dw = actualRect.width - expectedRect.width;
  const dh = actualRect.height - expectedRect.height;

  if (
    Math.abs(dx) <= TOLERANCE_PX &&
    Math.abs(dy) <= TOLERANCE_PX &&
    Math.abs(dw) <= TOLERANCE_PX &&
    Math.abs(dh) <= TOLERANCE_PX
  ) {
    return null;
  }

  const parts: string[] = [];
  if (Math.abs(dx) > TOLERANCE_PX) parts.push(`x:${dx > 0 ? "+" : ""}${dx.toFixed(1)}`);
  if (Math.abs(dy) > TOLERANCE_PX) parts.push(`y:${dy > 0 ? "+" : ""}${dy.toFixed(1)}`);
  return parts.length > 0 ? parts.join(", ") : null;
}
