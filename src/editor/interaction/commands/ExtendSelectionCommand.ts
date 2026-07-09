import type { InteractionState, CharacterPosition } from "../types.ts";

export function executeExtendSelection(
  state: InteractionState,
  focus: CharacterPosition,
): InteractionState {
  const anchor = state.selection.anchor ?? state.caret.position;
  return {
    ...state,
    selection: { anchor, focus },
    caret: {
      ...state.caret,
      position: focus,
      visible: true,
      focused: true,
    },
    focusedPageId: focus.pageId,
    focusedBlockId: focus.blockId,
  };
}
