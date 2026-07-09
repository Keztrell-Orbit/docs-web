import type { InteractionState, CharacterPosition } from "../types.ts";

export class SelectionModel {
  static isCollapsed(state: InteractionState): boolean {
    const { anchor, focus } = state.selection;
    if (!anchor || !focus) return true;
    return (
      anchor.pageId === focus.pageId &&
      anchor.blockId === focus.blockId &&
      anchor.charIndex === focus.charIndex
    );
  }

  static getRange(state: InteractionState): { start: CharacterPosition; end: CharacterPosition } | null {
    const { anchor, focus } = state.selection;
    if (!anchor || !focus) return null;

    const cmp = SelectionModel.comparePositions(anchor, focus);
    if (cmp <= 0) return { start: anchor, end: focus };
    return { start: focus, end: anchor };
  }

  static getDirection(state: InteractionState): "forward" | "backward" | "none" {
    const { anchor, focus } = state.selection;
    if (!anchor || !focus) return "none";
    const cmp = SelectionModel.comparePositions(anchor, focus);
    if (cmp < 0) return "forward";
    if (cmp > 0) return "backward";
    return "none";
  }

  static containsPosition(state: InteractionState, pos: CharacterPosition): boolean {
    const range = SelectionModel.getRange(state);
    if (!range) return false;
    return (
      SelectionModel.comparePositions(range.start, pos) <= 0 &&
      SelectionModel.comparePositions(pos, range.end) <= 0
    );
  }

  private static comparePositions(a: CharacterPosition, b: CharacterPosition): number {
    if (a.pageId !== b.pageId) return a.pageId.localeCompare(b.pageId);
    if (a.blockId !== b.blockId) return a.blockId.localeCompare(b.blockId);
    return a.charIndex - b.charIndex;
  }

  static getAnchor(state: InteractionState): CharacterPosition | null {
    return state.selection.anchor;
  }

  static getFocus(state: InteractionState): CharacterPosition | null {
    return state.selection.focus;
  }

  static isSelectionEmpty(state: InteractionState): boolean {
    return !state.selection.anchor || !state.selection.focus;
  }
}
