import type { InteractionState, CharacterPosition } from "../types.ts";

export function executeMoveCaret(
  state: InteractionState,
  position: CharacterPosition,
  extend?: boolean,
  preferredX?: number | null,
): InteractionState {
  return {
    ...state,
    caret: {
      ...state.caret,
      position,
      preferredX: preferredX !== undefined ? preferredX : state.caret.preferredX,
      visible: true,
      focused: true,
    },
    selection: extend
      ? { anchor: state.selection.anchor ?? state.caret.position, focus: position }
      : { anchor: null, focus: null },
    focusedPageId: position.pageId,
    focusedBlockId: position.blockId,
  };
}
