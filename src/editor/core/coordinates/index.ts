export { CoordinateMapper } from "./CoordinateMapper.ts";
export { PageRegistry } from "./PageRegistry.ts";
export { CoordinateDebugger } from "./CoordinateDebugger.tsx";
export { computeBreakdown, assertViewportPosition, assertViewportRect } from "./CoordinateAssertions.ts";
export { getCharPosition, findLineAtY, findCharAtX } from "./CoordinateTransforms.ts";
export { COORDINATE_SPACES, SPACE_LABELS, SPACE_DESCRIPTIONS } from "./CoordinateSpaces.ts";
export type { LayoutState } from "./LayoutState.ts";
export type { PageMetrics } from "./PageRegistry.ts";
export type { CharPositionResult, LineAtYResult } from "./CoordinateTransforms.ts";
export type { CoordinateBreakdown, AssertionResult } from "./CoordinateAssertions.ts";
export type { CoordinateSpace } from "./CoordinateSpaces.ts";

export {
  characterAddress,
  lineAddress,
  blockAddress,
  pageAddress,
  characterPoint,
  linePoint,
  blockPoint,
  pagePoint,
  viewportPoint,
  screenPoint,
  rect,
  CoordinateError,
} from "./CoordinateTypes.ts";

export type {
  CharacterAddress,
  LineAddress,
  BlockAddress,
  PageAddress,
  CharacterPoint,
  LinePoint,
  BlockPoint,
  PagePoint,
  ViewportPoint,
  ScreenPoint,
  Rect,
} from "./CoordinateTypes.ts";
