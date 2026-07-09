import { describe, it, expect, vi, afterAll } from "vitest";
import { KeyboardMapper } from "../KeyboardInput.ts";
import { InputContext } from "../InputContext.ts";
import { CompositionHandler } from "../CompositionInput.ts";
import type { InteractionState } from "../../../interaction/types.ts";
import type { NormalizedKeyboardEvent } from "../InputTypes.ts";

function createMockState(overrides?: Partial<InteractionState>): InteractionState {
  return {
    caret: { position: { pageId: "p1", blockId: "b1", charIndex: 0 }, preferredX: null, visible: true, focused: true },
    selection: { anchor: null, focus: null },
    pointer: { clientX: 0, clientY: 0, buttons: 0, isDown: false, clickCount: 0 },
    hover: { pageId: null, blockId: null, lineIndex: null, charIndex: null },
    focusedPageId: "p1",
    focusedBlockId: "b1",
    pressedKeys: new Set<string>(),
    ...overrides,
  };
}

function createContext(pressedKeys: Set<string> = new Set()): InputContext {
  const state = createMockState({ pressedKeys });
  const comp = new CompositionHandler();
  return new InputContext(() => state, comp);
}

function keyEvent(overrides: Partial<NormalizedKeyboardEvent>): NormalizedKeyboardEvent {
  return {
    type: "keydown",
    key: "",
    code: "",
    modifiers: { ctrl: false, meta: false, alt: false, shift: false },
    repeat: false,
    timestamp: 0,
    inputSource: "keyboard",
    ...overrides,
  };
}

describe("KeyboardMapper", () => {
  describe("navigation", () => {
    const mapper = new KeyboardMapper();

    it("ArrowLeft → MoveCaret left", () => {
      const cmd = mapper.processKeyDown(keyEvent({ key: "ArrowLeft" }), createContext());
      expect(cmd).toEqual({ type: "MOVE_CARET", direction: "left", extend: false });
    });

    it("ArrowRight → MoveCaret right", () => {
      const cmd = mapper.processKeyDown(keyEvent({ key: "ArrowRight" }), createContext());
      expect(cmd).toEqual({ type: "MOVE_CARET", direction: "right", extend: false });
    });

    it("ArrowUp → MoveCaret up", () => {
      const cmd = mapper.processKeyDown(keyEvent({ key: "ArrowUp" }), createContext());
      expect(cmd).toEqual({ type: "MOVE_CARET", direction: "up", extend: false });
    });

    it("ArrowDown → MoveCaret down", () => {
      const cmd = mapper.processKeyDown(keyEvent({ key: "ArrowDown" }), createContext());
      expect(cmd).toEqual({ type: "MOVE_CARET", direction: "down", extend: false });
    });

    it("Shift+ArrowLeft → MoveCaret left extend", () => {
      const cmd = mapper.processKeyDown(
        keyEvent({ key: "ArrowLeft", modifiers: { ctrl: false, meta: false, alt: false, shift: true } }),
        createContext(),
      );
      expect(cmd).toEqual({ type: "MOVE_CARET", direction: "left", extend: true });
    });

    it("Home → MoveCaret lineStart", () => {
      const cmd = mapper.processKeyDown(keyEvent({ key: "Home" }), createContext());
      expect(cmd).toEqual({ type: "MOVE_CARET", direction: "lineStart", extend: false });
    });

    it("End → MoveCaret lineEnd", () => {
      const cmd = mapper.processKeyDown(keyEvent({ key: "End" }), createContext());
      expect(cmd).toEqual({ type: "MOVE_CARET", direction: "lineEnd", extend: false });
    });

    it("PageUp → MoveCaret prevPage", () => {
      const cmd = mapper.processKeyDown(keyEvent({ key: "PageUp" }), createContext());
      expect(cmd).toEqual({ type: "MOVE_CARET", direction: "prevPage", extend: false });
    });

    it("PageDown → MoveCaret nextPage", () => {
      const cmd = mapper.processKeyDown(keyEvent({ key: "PageDown" }), createContext());
      expect(cmd).toEqual({ type: "MOVE_CARET", direction: "nextPage", extend: false });
    });
  });

  describe("word navigation with Ctrl (Windows/Linux)", () => {
    const mapper = new KeyboardMapper();

    it("Ctrl+ArrowLeft → MoveCaret prevWord", () => {
      const cmd = mapper.processKeyDown(
        keyEvent({ key: "ArrowLeft", modifiers: { ctrl: true, meta: false, alt: false, shift: false } }),
        createContext(),
      );
      expect(cmd).toEqual({ type: "MOVE_CARET", direction: "prevWord", extend: false });
    });

    it("Ctrl+ArrowRight → MoveCaret nextWord", () => {
      const cmd = mapper.processKeyDown(
        keyEvent({ key: "ArrowRight", modifiers: { ctrl: true, meta: false, alt: false, shift: false } }),
        createContext(),
      );
      expect(cmd).toEqual({ type: "MOVE_CARET", direction: "nextWord", extend: false });
    });

    it("Ctrl+ArrowUp → MoveCaret docStart", () => {
      const cmd = mapper.processKeyDown(
        keyEvent({ key: "ArrowUp", modifiers: { ctrl: true, meta: false, alt: false, shift: false } }),
        createContext(),
      );
      expect(cmd).toEqual({ type: "MOVE_CARET", direction: "docStart", extend: false });
    });

    it("Ctrl+ArrowDown → MoveCaret docEnd", () => {
      const cmd = mapper.processKeyDown(
        keyEvent({ key: "ArrowDown", modifiers: { ctrl: true, meta: false, alt: false, shift: false } }),
        createContext(),
      );
      expect(cmd).toEqual({ type: "MOVE_CARET", direction: "docEnd", extend: false });
    });
  });

  describe("shortcuts", () => {
    const mapper = new KeyboardMapper();

    it("Ctrl+Z → Undo", () => {
      const cmd = mapper.processKeyDown(
        keyEvent({ key: "z", modifiers: { ctrl: true, meta: false, alt: false, shift: false } }),
        createContext(),
      );
      expect(cmd).toEqual({ type: "UNDO" });
    });

    it("Ctrl+Shift+Z → Redo", () => {
      const cmd = mapper.processKeyDown(
        keyEvent({ key: "z", modifiers: { ctrl: true, meta: false, alt: false, shift: true } }),
        createContext(),
      );
      expect(cmd).toEqual({ type: "REDO" });
    });

    it("Ctrl+Y → Redo", () => {
      const cmd = mapper.processKeyDown(
        keyEvent({ key: "y", modifiers: { ctrl: true, meta: false, alt: false, shift: false } }),
        createContext(),
      );
      expect(cmd).toEqual({ type: "REDO" });
    });

    it("Ctrl+C → Copy", () => {
      const cmd = mapper.processKeyDown(
        keyEvent({ key: "c", modifiers: { ctrl: true, meta: false, alt: false, shift: false } }),
        createContext(),
      );
      expect(cmd).toEqual({ type: "COPY" });
    });

    it("Ctrl+X → Cut", () => {
      const cmd = mapper.processKeyDown(
        keyEvent({ key: "x", modifiers: { ctrl: true, meta: false, alt: false, shift: false } }),
        createContext(),
      );
      expect(cmd).toEqual({ type: "CUT" });
    });

    it("Ctrl+V → Paste", () => {
      const cmd = mapper.processKeyDown(
        keyEvent({ key: "v", modifiers: { ctrl: true, meta: false, alt: false, shift: false } }),
        createContext(),
      );
      expect(cmd).toEqual({ type: "PASTE", dataTransfer: null });
    });

    it("Ctrl+A → SelectAll", () => {
      const cmd = mapper.processKeyDown(
        keyEvent({ key: "a", modifiers: { ctrl: true, meta: false, alt: false, shift: false } }),
        createContext(),
      );
      expect(cmd).toEqual({ type: "SELECT_ALL" });
    });
  });

  describe("edge cases", () => {
    const mapper = new KeyboardMapper();

    it("plain letter key produces no command from KeyboardMapper", () => {
      const cmd = mapper.processKeyDown(keyEvent({ key: "a" }), createContext());
      expect(cmd).toBeNull();
    });

    it("keyup produces null command", () => {
      const cmd = mapper.processKeyUp(
        { type: "keyup", key: "ArrowLeft", code: "ArrowLeft", modifiers: { ctrl: false, meta: false, alt: false, shift: false }, repeat: false, timestamp: 0, inputSource: "keyboard" },
        createContext(),
      );
      expect(cmd).toBeNull();
    });

    it("Alt+Z does not trigger shortcut", () => {
      const cmd = mapper.processKeyDown(
        keyEvent({ key: "z", modifiers: { ctrl: false, meta: false, alt: true, shift: false } }),
        createContext(),
      );
      expect(cmd).toBeNull();
    });
  });
});
