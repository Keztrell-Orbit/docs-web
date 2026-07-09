import type { InteractionState, InteractionAction } from "../types.ts";

export function createInitialInteractionState(): InteractionState {
  return {
    caret: {
      position: { pageId: "", blockId: "", charIndex: 0 },
      preferredX: null,
      visible: true,
      focused: false,
    },
    selection: {
      anchor: null,
      focus: null,
    },
    pointer: {
      clientX: 0,
      clientY: 0,
      buttons: 0,
      isDown: false,
      clickCount: 0,
    },
    hover: {
      pageId: null,
      blockId: null,
      lineIndex: null,
      charIndex: null,
    },
    focusedPageId: null,
    focusedBlockId: null,
    pressedKeys: new Set(),
  };
}

export function interactionReducer(state: InteractionState, action: InteractionAction): InteractionState {
  switch (action.type) {
    case "CARET_MOVED": {
      const extending = action.extend ?? false;

      const newSelection = extending
        ? { anchor: state.selection.anchor ?? state.caret.position, focus: action.position }
        : { anchor: action.position, focus: action.position };

      return {
        ...state,
        caret: {
          ...state.caret,
          position: action.position,
          preferredX: action.preferredX !== undefined ? action.preferredX : state.caret.preferredX,
          visible: true,
          focused: true,
        },
        selection: newSelection,
        focusedPageId: action.position.pageId,
        focusedBlockId: action.position.blockId,
      };
    }

    case "SELECTION_EXTENDED": {
      const anchor = state.selection.anchor ?? state.caret.position;
      return {
        ...state,
        selection: { anchor, focus: action.focus },
        caret: {
          ...state.caret,
          position: action.focus,
          visible: true,
          focused: true,
        },
        focusedPageId: action.focus.pageId,
        focusedBlockId: action.focus.blockId,
      };
    }

    case "SELECTION_COLLAPSED": {
      return {
        ...state,
        selection: { anchor: state.caret.position, focus: state.caret.position },
      };
    }

    case "SELECTION_CLEARED": {
      return {
        ...state,
        selection: { anchor: null, focus: null },
      };
    }

    case "SELECT_WORD":
    case "SELECT_LINE":
    case "SELECT_PARAGRAPH": {
      return {
        ...state,
        selection: { anchor: action.anchor, focus: action.focus },
        caret: {
          ...state.caret,
          position: action.focus,
          visible: true,
          focused: true,
        },
        focusedPageId: action.focus.pageId,
        focusedBlockId: action.focus.blockId,
      };
    }

    case "SELECT_ALL": {
      return {
        ...state,
        selection: { anchor: action.anchor, focus: action.focus },
        caret: {
          ...state.caret,
          position: action.focus,
          visible: true,
          focused: true,
        },
        focusedPageId: action.focus.pageId,
        focusedBlockId: action.focus.blockId,
      };
    }

    case "POINTER_DOWN": {
      return {
        ...state,
        pointer: {
          clientX: action.clientX,
          clientY: action.clientY,
          buttons: action.buttons,
          isDown: true,
          clickCount: action.clickCount,
        },
        caret: { ...state.caret, visible: true },
      };
    }

    case "POINTER_MOVE": {
      return {
        ...state,
        pointer: {
          ...state.pointer,
          clientX: action.clientX,
          clientY: action.clientY,
          buttons: action.buttons,
        },
        caret: { ...state.caret, visible: true },
      };
    }

    case "POINTER_UP": {
      return {
        ...state,
        pointer: { ...state.pointer, isDown: false },
        caret: { ...state.caret, visible: true },
      };
    }

    case "HOVER_CHANGED": {
      return {
        ...state,
        hover: {
          pageId: action.pageId,
          blockId: action.blockId,
          lineIndex: action.lineIndex,
          charIndex: action.charIndex,
        },
      };
    }

    case "KEY_PRESSED": {
      const next = new Set(state.pressedKeys);
      next.add(action.key);
      return {
        ...state,
        pressedKeys: next,
        caret: { ...state.caret, visible: true },
      };
    }

    case "KEY_RELEASED": {
      const next = new Set(state.pressedKeys);
      next.delete(action.key);
      return { ...state, pressedKeys: next };
    }

    case "FOCUS_CHANGED": {
      return {
        ...state,
        focusedPageId: action.pageId,
        focusedBlockId: action.blockId,
        caret: { ...state.caret, focused: action.pageId !== null },
      };
    }

    case "CARET_BLINK": {
      return {
        ...state,
        caret: { ...state.caret, visible: !state.caret.visible },
      };
    }

    case "CARET_FOCUS": {
      return {
        ...state,
        caret: { ...state.caret, focused: true, visible: true },
      };
    }

    case "CARET_BLUR": {
      return {
        ...state,
        caret: { ...state.caret, focused: false, visible: false },
      };
    }

    case "CARET_SHOW": {
      return {
        ...state,
        caret: { ...state.caret, visible: true },
      };
    }

    case "CARET_HIDE": {
      return {
        ...state,
        caret: { ...state.caret, visible: false },
      };
    }

    default:
      return state;
  }
}
