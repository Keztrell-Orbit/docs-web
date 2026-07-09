import type { InteractionState, CharacterPosition } from "../types.ts";

export function executeSelectWord(
  state: InteractionState,
  anchor: CharacterPosition,
  focus: CharacterPosition,
): InteractionState {
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

export function executeSelectLine(
  state: InteractionState,
  anchor: CharacterPosition,
  focus: CharacterPosition,
): InteractionState {
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

export function executeSelectParagraph(
  state: InteractionState,
  anchor: CharacterPosition,
  focus: CharacterPosition,
): InteractionState {
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

export function executeSelectAll(
  state: InteractionState,
  anchor: CharacterPosition,
  focus: CharacterPosition,
): InteractionState {
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
