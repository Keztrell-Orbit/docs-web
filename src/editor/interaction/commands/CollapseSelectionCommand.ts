import type { InteractionState, CharacterPosition } from "../types.ts";

export function executeCollapseSelection(
  state: InteractionState,
  position: CharacterPosition,
): InteractionState {
  return {
    ...state,
    selection: { anchor: position, focus: position },
    caret: {
      ...state.caret,
      position,
      visible: true,
      focused: true,
    },
    focusedPageId: position.pageId,
    focusedBlockId: position.blockId,
  };
}

export function executeClearSelection(state: InteractionState): InteractionState {
  return {
    ...state,
    selection: { anchor: null, focus: null },
  };
}
