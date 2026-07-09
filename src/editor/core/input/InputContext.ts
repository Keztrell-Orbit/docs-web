import type { ModifierState, CompositionState, InputStateSnapshot } from "./InputTypes.ts";
import type { InteractionState } from "../../interaction/types.ts";
import type { CompositionHandler } from "./CompositionInput.ts";
import { getModifiers } from "./InputEventNormalizer.ts";
import { PLATFORM } from "./InputConstants.ts";
import type { Platform } from "./InputTypes.ts";

export class InputContext {
  #getInteractionState: () => InteractionState;
  #compositionHandler: CompositionHandler;

  constructor(
    getInteractionState: () => InteractionState,
    compositionHandler: CompositionHandler,
  ) {
    this.#getInteractionState = getInteractionState;
    this.#compositionHandler = compositionHandler;
  }

  get modifiers(): ModifierState {
    const state = this.#getInteractionState();
    const ctrl = state.pressedKeys.has("Control");
    const meta = state.pressedKeys.has("Meta");
    const alt = state.pressedKeys.has("Alt");
    const shift = state.pressedKeys.has("Shift");
    return { ctrl, meta, alt, shift };
  }

  get pressedKeys(): Set<string> {
    return this.#getInteractionState().pressedKeys;
  }

  get composition(): CompositionState {
    return this.#compositionHandler.getCompositionState();
  }

  get platform(): Platform {
    return PLATFORM;
  }

  get focusedBlockId(): string | null {
    return this.#getInteractionState().focusedBlockId;
  }

  get focusedPageId(): string | null {
    return this.#getInteractionState().focusedPageId;
  }

  get caretFocused(): boolean {
    return this.#getInteractionState().caret.focused;
  }

  snapshot(): InputStateSnapshot {
    const state = this.#getInteractionState();
    return {
      selection: {
        anchor: state.selection.anchor
          ? { pageId: state.selection.anchor.pageId, blockId: state.selection.anchor.blockId, charIndex: state.selection.anchor.charIndex }
          : null,
        focus: state.selection.focus
          ? { pageId: state.selection.focus.pageId, blockId: state.selection.focus.blockId, charIndex: state.selection.focus.charIndex }
          : null,
      },
      caret: {
        position: {
          pageId: state.caret.position.pageId,
          blockId: state.caret.position.blockId,
          charIndex: state.caret.position.charIndex,
        },
        focused: state.caret.focused,
      },
      modifiers: this.modifiers,
      pressedKeys: new Set(state.pressedKeys),
      focusedBlockId: state.focusedBlockId,
      focusedPageId: state.focusedPageId,
    };
  }
}
