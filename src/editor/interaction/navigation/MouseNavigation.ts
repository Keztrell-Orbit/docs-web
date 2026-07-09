import type { CharacterPosition, HitTestResult } from "../types.ts";
import { NavigationEngine } from "./NavigationEngine.ts";

export function getClickTarget(
  hitResult: HitTestResult,
): CharacterPosition {
  return hitResult.position;
}

export function getDoubleClickWordRange(
  engine: NavigationEngine,
  position: CharacterPosition,
): { anchor: CharacterPosition; focus: CharacterPosition } | null {
  const bounds = engine.findWordAround(position);
  if (!bounds) return null;
  return {
    anchor: { ...position, charIndex: bounds.start },
    focus: { ...position, charIndex: bounds.end },
  };
}

export function getTripleClickLineRange(
  engine: NavigationEngine,
  position: CharacterPosition,
): { anchor: CharacterPosition; focus: CharacterPosition } | null {
  const range = engine.findLineRange(position);
  if (!range) return null;
  return {
    anchor: { ...position, charIndex: range.start },
    focus: { ...position, charIndex: range.end },
  };
}
