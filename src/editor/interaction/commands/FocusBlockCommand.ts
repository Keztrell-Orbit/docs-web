import type { InteractionState } from "../types.ts";

export function executeFocusBlock(
  state: InteractionState,
  pageId: string | null,
  blockId: string | null,
): InteractionState {
  return {
    ...state,
    focusedPageId: pageId,
    focusedBlockId: blockId,
    caret: {
      ...state.caret,
      focused: pageId !== null,
      visible: pageId !== null,
    },
  };
}
