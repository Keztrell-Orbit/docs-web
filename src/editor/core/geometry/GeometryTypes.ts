import type { Rect } from "../coordinates/CoordinateTypes.ts";

export type { Rect };
export type { CharacterAddress } from "../coordinates/CoordinateTypes.ts";

export interface CaretRect extends Rect {
  blockId: string;
  pageId: string;
}
