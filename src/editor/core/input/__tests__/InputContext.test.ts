import { describe, it, expect } from "vitest";
import { InputContext } from "../InputContext.ts";
import { CompositionHandler } from "../CompositionInput.ts";
import type { InteractionState } from "../../../interaction/types.ts";

function createMockState(overrides?: Partial<InteractionState>): InteractionState {
  return {
    caret: { position: { pageId: "p1", blockId: "b1", charIndex: 5 }, preferredX: null, visible: true, focused: true },
    selection: { anchor: { pageId: "p1", blockId: "b1", charIndex: 2 }, focus: { pageId: "p1", blockId: "b1", charIndex: 5 } },
    pointer: { clientX: 0, clientY: 0, buttons: 0, isDown: false, clickCount: 0 },
    hover: { pageId: null, blockId: null, lineIndex: null, charIndex: null },
    focusedPageId: "p1",
    focusedBlockId: "b1",
    pressedKeys: new Set(["Shift"]),
    ...overrides,
  };
}

describe("InputContext", () => {
  it("reads modifiers from pressedKeys", () => {
    const ctx = new InputContext(() => createMockState(), new CompositionHandler());
    const mods = ctx.modifiers;
    expect(mods.shift).toBe(true);
    expect(mods.ctrl).toBe(false);
    expect(mods.meta).toBe(false);
    expect(mods.alt).toBe(false);
  });

  it("returns pressedKeys set", () => {
    const state = createMockState();
    state.pressedKeys.add("Control");
    const ctx = new InputContext(() => state, new CompositionHandler());
    expect(ctx.pressedKeys.has("Control")).toBe(true);
    expect(ctx.pressedKeys.has("Shift")).toBe(true);
  });

  it("returns composition state from handler", () => {
    const comp = new CompositionHandler();
    const ctx = new InputContext(() => createMockState(), comp);
    expect(ctx.composition).toEqual({ active: false, data: "" });

    comp.processStart({ type: "compositionstart", data: "", timestamp: 0, inputSource: "ime" });
    expect(ctx.composition.active).toBe(true);
  });

  it("returns focused block/page", () => {
    const ctx = new InputContext(() => createMockState(), new CompositionHandler());
    expect(ctx.focusedBlockId).toBe("b1");
    expect(ctx.focusedPageId).toBe("p1");
  });

  it("returns caretFocused", () => {
    const ctx = new InputContext(() => createMockState(), new CompositionHandler());
    expect(ctx.caretFocused).toBe(true);

    const state = createMockState({ caret: { position: { pageId: "p1", blockId: "b1", charIndex: 0 }, preferredX: null, visible: false, focused: false } });
    const ctx2 = new InputContext(() => state, new CompositionHandler());
    expect(ctx2.caretFocused).toBe(false);
  });

  it("snapshot captures full state", () => {
    const ctx = new InputContext(() => createMockState(), new CompositionHandler());
    const snap = ctx.snapshot();
    expect(snap.caret.position.charIndex).toBe(5);
    expect(snap.selection.anchor?.charIndex).toBe(2);
    expect(snap.selection.focus?.charIndex).toBe(5);
    expect(snap.modifiers.shift).toBe(true);
    expect(snap.focusedBlockId).toBe("b1");
  });

  it("snapshot returns null selection when no selection", () => {
    const state = createMockState({ selection: { anchor: null, focus: null } });
    const ctx = new InputContext(() => state, new CompositionHandler());
    const snap = ctx.snapshot();
    expect(snap.selection.anchor).toBeNull();
    expect(snap.selection.focus).toBeNull();
  });
});
