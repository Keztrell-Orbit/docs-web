import { describe, it, expect } from "vitest";
import { interactionReducer, createInitialInteractionState } from "../core/interactionReducer.ts";

describe("interactionReducer", () => {
  it("should create initial state", () => {
    const state = createInitialInteractionState();
    expect(state.caret.position).toEqual({ pageId: "", blockId: "", charIndex: 0 });
    expect(state.caret.visible).toBe(true);
    expect(state.caret.focused).toBe(false);
    expect(state.selection.anchor).toBeNull();
    expect(state.selection.focus).toBeNull();
    expect(state.pointer.isDown).toBe(false);
    expect(state.pressedKeys.size).toBe(0);
  });

  it("should handle CARET_MOVED", () => {
    const state = createInitialInteractionState();
    const pos = { pageId: "page-1", blockId: "block-1", charIndex: 5 };
    const next = interactionReducer(state, { type: "CARET_MOVED", position: pos });
    expect(next.caret.position).toEqual(pos);
    expect(next.caret.focused).toBe(true);
    expect(next.focusedPageId).toBe("page-1");
    expect(next.focusedBlockId).toBe("block-1");
    expect(next.selection.anchor).toEqual(pos);
    expect(next.selection.focus).toEqual(pos);
  });

  it("should handle CARET_MOVED with extend=true", () => {
    const state = createInitialInteractionState();
    const pos1 = { pageId: "page-1", blockId: "block-1", charIndex: 0 };
    const afterFirst = interactionReducer(state, { type: "CARET_MOVED", position: pos1 });

    const pos2 = { pageId: "page-1", blockId: "block-1", charIndex: 10 };
    const next = interactionReducer(afterFirst, {
      type: "CARET_MOVED",
      position: pos2,
      extend: true,
    });
    expect(next.caret.position).toEqual(pos2);
    expect(next.selection.anchor).toEqual(pos1);
    expect(next.selection.focus).toEqual(pos2);
  });

  it("should handle SELECTION_EXTENDED", () => {
    const state = createInitialInteractionState();
    const state2 = interactionReducer(state, {
      type: "CARET_MOVED",
      position: { pageId: "p1", blockId: "b1", charIndex: 0 },
    });
    const next = interactionReducer(state2, {
      type: "SELECTION_EXTENDED",
      focus: { pageId: "p1", blockId: "b1", charIndex: 15 },
    });
    expect(next.selection.anchor).toEqual({ pageId: "p1", blockId: "b1", charIndex: 0 });
    expect(next.selection.focus).toEqual({ pageId: "p1", blockId: "b1", charIndex: 15 });
  });

  it("should handle SELECT_WORD / SELECT_LINE / SELECT_PARAGRAPH", () => {
    const state = createInitialInteractionState();
    const a = { pageId: "p1", blockId: "b1", charIndex: 0 };
    const f = { pageId: "p1", blockId: "b1", charIndex: 10 };

    const wordState = interactionReducer(state, { type: "SELECT_WORD", anchor: a, focus: f });
    expect(wordState.selection.anchor).toEqual(a);
    expect(wordState.selection.focus).toEqual(f);

    const lineState = interactionReducer(state, { type: "SELECT_LINE", anchor: a, focus: f });
    expect(lineState.selection.anchor).toEqual(a);
    expect(lineState.selection.focus).toEqual(f);

    const paraState = interactionReducer(state, { type: "SELECT_PARAGRAPH", anchor: a, focus: f });
    expect(paraState.selection.anchor).toEqual(a);
    expect(paraState.selection.focus).toEqual(f);
  });

  it("should handle SELECT_ALL", () => {
    const state = createInitialInteractionState();
    const a = { pageId: "p1", blockId: "b1", charIndex: 0 };
    const f = { pageId: "p1", blockId: "b1", charIndex: 50 };
    const next = interactionReducer(state, { type: "SELECT_ALL", anchor: a, focus: f });
    expect(next.selection.anchor).toEqual(a);
    expect(next.selection.focus).toEqual(f);
  });

  it("should handle POINTER_DOWN / POINTER_MOVE / POINTER_UP", () => {
    const state = createInitialInteractionState();
    const downState = interactionReducer(state, {
      type: "POINTER_DOWN",
      clientX: 100,
      clientY: 200,
      buttons: 1,
      clickCount: 1,
    });
    expect(downState.pointer.clientX).toBe(100);
    expect(downState.pointer.clientY).toBe(200);
    expect(downState.pointer.isDown).toBe(true);
    expect(downState.pointer.clickCount).toBe(1);

    const moveState = interactionReducer(downState, {
      type: "POINTER_MOVE",
      clientX: 150,
      clientY: 250,
      buttons: 1,
    });
    expect(moveState.pointer.clientX).toBe(150);
    expect(moveState.pointer.clientY).toBe(250);
    expect(moveState.pointer.isDown).toBe(true);

    const upState = interactionReducer(moveState, { type: "POINTER_UP" });
    expect(upState.pointer.isDown).toBe(false);
  });

  it("should handle HOVER_CHANGED", () => {
    const state = createInitialInteractionState();
    const next = interactionReducer(state, {
      type: "HOVER_CHANGED",
      pageId: "p1",
      blockId: "b1",
      lineIndex: 2,
      charIndex: 10,
    });
    expect(next.hover.pageId).toBe("p1");
    expect(next.hover.blockId).toBe("b1");
    expect(next.hover.lineIndex).toBe(2);
    expect(next.hover.charIndex).toBe(10);
  });

  it("should handle KEY_PRESSED / KEY_RELEASED", () => {
    const state = createInitialInteractionState();
    const pressed = interactionReducer(state, { type: "KEY_PRESSED", key: "ArrowRight" });
    expect(pressed.pressedKeys.has("ArrowRight")).toBe(true);

    const released = interactionReducer(pressed, { type: "KEY_RELEASED", key: "ArrowRight" });
    expect(released.pressedKeys.has("ArrowRight")).toBe(false);
  });

  it("should handle CARET_BLINK toggle", () => {
    const state = createInitialInteractionState();
    const blinked = interactionReducer(state, { type: "CARET_BLINK" });
    expect(blinked.caret.visible).toBe(false);

    const blinkedAgain = interactionReducer(blinked, { type: "CARET_BLINK" });
    expect(blinkedAgain.caret.visible).toBe(true);
  });
});
