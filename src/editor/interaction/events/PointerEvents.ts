import type { InteractionState } from "../types.ts";
import { HitTestEngine } from "../hit-testing/HitTestEngine.ts";
import { NavigationEngine } from "../navigation/NavigationEngine.ts";
import { getDoubleClickWordRange, getTripleClickLineRange } from "../navigation/MouseNavigation.ts";

export interface PointerEventResult {
  state: InteractionState;
  action?: "caret" | "extend" | "selectWord" | "selectLine" | "selectParagraph" | "drag";
}

export function handlePointerDown(
  state: InteractionState,
  clientX: number,
  clientY: number,
  buttons: number,
  clickCount: number,
  hitTestEngine: HitTestEngine,
  navigationEngine: NavigationEngine,
): PointerEventResult {
  const hitResult = hitTestEngine.hitTestFromViewport(clientX, clientY);
  const position = hitResult.position;

  if (!hitResult.block) {
    return {
      state: {
        ...state,
        pointer: { ...state.pointer, clientX, clientY, buttons, isDown: true, clickCount },
        caret: { ...state.caret, visible: true },
      },
    };
  }

  if (state.pointer.isDown) {
    return {
      state: {
        ...state,
        pointer: { ...state.pointer, clientX, clientY, buttons, isDown: true, clickCount },
      },
      action: "drag",
    };
  }

  const pointerState = {
    ...state.pointer,
    clientX, clientY, buttons, isDown: true, clickCount,
  };

  if (clickCount === 3) {
    const range = getTripleClickLineRange(navigationEngine, position);
    if (range) {
      return {
        state: {
          ...state,
          pointer: pointerState,
          selection: { anchor: range.anchor, focus: range.focus },
          caret: { ...state.caret, position: range.focus, visible: true, focused: true },
          focusedPageId: position.pageId,
          focusedBlockId: position.blockId,
        },
        action: "selectParagraph",
      };
    }
  }

  if (clickCount === 2) {
    const range = getDoubleClickWordRange(navigationEngine, position);
    if (range) {
      return {
        state: {
          ...state,
          pointer: pointerState,
          selection: { anchor: range.anchor, focus: range.focus },
          caret: { ...state.caret, position: range.focus, visible: true, focused: true },
          focusedPageId: position.pageId,
          focusedBlockId: position.blockId,
        },
        action: "selectWord",
      };
    }
  }

  return {
    state: {
      ...state,
      pointer: pointerState,
      selection: { anchor: position, focus: position },
      caret: {
        ...state.caret,
        position,
        preferredX: null,
        visible: true,
        focused: true,
      },
      focusedPageId: position.pageId,
      focusedBlockId: position.blockId,
    },
    action: "caret",
  };
}

export function handlePointerMove(
  state: InteractionState,
  clientX: number,
  clientY: number,
  buttons: number,
  hitTestEngine: HitTestEngine,
): PointerEventResult {
  const hitResult = hitTestEngine.hitTestFromViewport(clientX, clientY);

  const hoverState = {
    pageId: hitResult.pageId || null,
    blockId: hitResult.block?.blockId ?? null,
    lineIndex: hitResult.lineIndex,
    charIndex: hitResult.charIndex,
  };

  if (state.pointer.isDown) {
    const position = hitResult.position;
    const anchor = state.selection.anchor ?? state.caret.position;
    return {
      state: {
        ...state,
        pointer: { ...state.pointer, clientX, clientY, buttons },
        hover: hoverState,
        selection: { anchor, focus: position },
        caret: { ...state.caret, position, visible: true },
      },
      action: "drag",
    };
  }

  return {
    state: {
      ...state,
      pointer: { ...state.pointer, clientX, clientY, buttons },
      hover: hoverState,
    },
  };
}

export function handlePointerUp(state: InteractionState): PointerEventResult {
  return {
    state: {
      ...state,
      pointer: { ...state.pointer, isDown: false },
      caret: { ...state.caret, visible: true },
    },
  };
}
