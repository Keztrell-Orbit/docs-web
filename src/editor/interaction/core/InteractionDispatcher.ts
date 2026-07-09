import type { InteractionState, InteractionAction } from "../types.ts";
import { HitTestEngine } from "../hit-testing/HitTestEngine.ts";
import { NavigationEngine } from "../navigation/NavigationEngine.ts";
import { getNavigationDirection, navigateInDirection } from "../navigation/KeyboardNavigation.ts";
import { isNavigationKey, isModifierKey, isTabKey } from "../events/KeyboardEvents.ts";
import { getClickCount } from "../events/MouseEvents.ts";
import { handlePointerDown, handlePointerMove } from "../events/PointerEvents.ts";

export class InteractionDispatcher {
  #lastClickTime = 0;
  #lastClickPosition = { x: 0, y: 0 };
  #doubleClickDelay = 350;
  #dragStartPosition: { x: number; y: number } | null = null;
  #dragThreshold = 4;

  dispatch: React.Dispatch<InteractionAction>;
  getState: () => InteractionState;
  hitTestEngine: HitTestEngine;
  navigationEngine: NavigationEngine;

  constructor(
    dispatch: React.Dispatch<InteractionAction>,
    getState: () => InteractionState,
    hitTestEngine: HitTestEngine,
    navigationEngine: NavigationEngine,
  ) {
    this.dispatch = dispatch;
    this.getState = getState;
    this.hitTestEngine = hitTestEngine;
    this.navigationEngine = navigationEngine;
  }

  handlePointerDown(event: React.PointerEvent): void {
    const state = this.getState();
    const clickCount = getClickCount(
      event.nativeEvent as unknown as MouseEvent,
      this.#lastClickTime,
      this.#lastClickPosition,
      this.#doubleClickDelay,
    );

    this.#lastClickTime = Date.now();
    this.#lastClickPosition = { x: event.clientX, y: event.clientY };
    this.#dragStartPosition = { x: event.clientX, y: event.clientY };

    const result = handlePointerDown(
      state,
      event.clientX,
      event.clientY,
      event.buttons,
      clickCount,
      this.hitTestEngine,
      this.navigationEngine,
    );

    const s = result.state;
    this.dispatch({ type: "POINTER_DOWN", clientX: s.pointer.clientX, clientY: s.pointer.clientY, buttons: s.pointer.buttons, clickCount: s.pointer.clickCount });

    if (s.selection.focus) {
      this.dispatch({
        type: "CARET_MOVED",
        position: s.selection.focus,
        extend: false,
      });
    }

    if (s.selection.anchor && s.selection.focus) {
      if (result.action === "selectWord") {
        this.dispatch({ type: "SELECT_WORD", anchor: s.selection.anchor, focus: s.selection.focus });
      } else if (result.action === "selectParagraph") {
        this.dispatch({ type: "SELECT_PARAGRAPH", anchor: s.selection.anchor, focus: s.selection.focus });
      }
    }

    if (s.hover.pageId !== state.hover.pageId || s.hover.blockId !== state.hover.blockId) {
      this.dispatch({ type: "HOVER_CHANGED", pageId: s.hover.pageId, blockId: s.hover.blockId, lineIndex: s.hover.lineIndex, charIndex: s.hover.charIndex });
    }
  }

  handlePointerMove(event: React.PointerEvent): void {
    const state = this.getState();

    if (state.pointer.isDown && this.#dragStartPosition) {
      const dx = Math.abs(event.clientX - this.#dragStartPosition.x);
      const dy = Math.abs(event.clientY - this.#dragStartPosition.y);
      if (dx <= this.#dragThreshold && dy <= this.#dragThreshold) {
        return;
      }
    }

    const result = handlePointerMove(
      state,
      event.clientX,
      event.clientY,
      event.buttons,
      this.hitTestEngine,
    );

    const s = result.state;

    this.dispatch({
      type: "POINTER_MOVE",
      clientX: s.pointer.clientX,
      clientY: s.pointer.clientY,
      buttons: s.pointer.buttons,
    });

    if (state.pointer.isDown && s.selection.focus) {
      this.dispatch({
        type: "CARET_MOVED",
        position: s.selection.focus,
        extend: true,
      });
    }

    if (s.hover.pageId !== state.hover.pageId || s.hover.blockId !== state.hover.blockId || s.hover.charIndex !== state.hover.charIndex) {
      this.dispatch({
        type: "HOVER_CHANGED",
        pageId: s.hover.pageId,
        blockId: s.hover.blockId,
        lineIndex: s.hover.lineIndex,
        charIndex: s.hover.charIndex,
      });
    }
  }

  handlePointerUp(_event: React.PointerEvent): void {
    this.dispatch({ type: "POINTER_UP" });

    if (this.#dragStartPosition) {
      this.#dragStartPosition = null;
    }

    this.dispatch({ type: "CARET_SHOW" });
  }

  handleKeyDown(event: React.KeyboardEvent): void {
    if (isModifierKey(event.nativeEvent) || isTabKey(event.nativeEvent)) return;

    this.dispatch({ type: "KEY_PRESSED", key: event.key });

    if (!isNavigationKey(event.nativeEvent)) return;

    event.preventDefault();

    const direction = getNavigationDirection(event.nativeEvent);
    if (!direction) return;

    const state = this.getState();
    const shift = event.shiftKey;

    const { position, preferredX } = navigateInDirection(
      this.navigationEngine,
      state.caret.position,
      direction,
      state.caret.preferredX,
    );

    if (shift) {
      this.dispatch({
        type: "CARET_MOVED",
        position,
        extend: true,
        preferredX,
      });
    } else {
      this.dispatch({
        type: "CARET_MOVED",
        position,
        preferredX,
      });
    }
  }

  handleKeyUp(event: React.KeyboardEvent): void {
    this.dispatch({ type: "KEY_RELEASED", key: event.key });
  }
}
