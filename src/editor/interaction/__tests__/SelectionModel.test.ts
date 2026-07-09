import { describe, it, expect } from "vitest";
import { SelectionModel } from "../selection/SelectionModel.ts";
import type { InteractionState } from "../types.ts";

function makeState(anchor: { pageId: string; blockId: string; charIndex: number } | null, focus: { pageId: string; blockId: string; charIndex: number } | null): InteractionState {
  return {
    caret: {
      position: { pageId: "", blockId: "", charIndex: 0 },
      preferredX: null,
      visible: true,
      focused: false,
    },
    selection: { anchor, focus },
    pointer: { clientX: 0, clientY: 0, buttons: 0, isDown: false, clickCount: 0 },
    hover: { pageId: null, blockId: null, lineIndex: null, charIndex: null },
    focusedPageId: null,
    focusedBlockId: null,
    pressedKeys: new Set(),
  };
}

describe("SelectionModel", () => {
  it("isCollapsed returns true when anchor equals focus", () => {
    const pos = { pageId: "p1", blockId: "b1", charIndex: 5 };
    const state = makeState(pos, pos);
    expect(SelectionModel.isCollapsed(state)).toBe(true);
  });

  it("isCollapsed returns false when anchor differs from focus", () => {
    const state = makeState(
      { pageId: "p1", blockId: "b1", charIndex: 0 },
      { pageId: "p1", blockId: "b1", charIndex: 10 },
    );
    expect(SelectionModel.isCollapsed(state)).toBe(false);
  });

  it("isCollapsed returns true when both null", () => {
    const state = makeState(null, null);
    expect(SelectionModel.isCollapsed(state)).toBe(true);
  });

  it("getRange returns sorted start/end (forward)", () => {
    const a = { pageId: "p1", blockId: "b1", charIndex: 0 };
    const f = { pageId: "p1", blockId: "b1", charIndex: 10 };
    const state = makeState(a, f);
    const range = SelectionModel.getRange(state);
    expect(range).not.toBeNull();
    expect(range!.start).toEqual(a);
    expect(range!.end).toEqual(f);
  });

  it("getRange returns sorted start/end (backward)", () => {
    const a = { pageId: "p1", blockId: "b1", charIndex: 10 };
    const f = { pageId: "p1", blockId: "b1", charIndex: 0 };
    const state = makeState(a, f);
    const range = SelectionModel.getRange(state);
    expect(range!.start).toEqual(f);
    expect(range!.end).toEqual(a);
  });

  it("getRange returns null when anchor or focus is null", () => {
    const state = makeState(null, null);
    expect(SelectionModel.getRange(state)).toBeNull();
  });

  it("containsPosition returns true for position inside range", () => {
    const state = makeState(
      { pageId: "p1", blockId: "b1", charIndex: 0 },
      { pageId: "p1", blockId: "b1", charIndex: 10 },
    );
    expect(SelectionModel.containsPosition(state, { pageId: "p1", blockId: "b1", charIndex: 5 })).toBe(true);
  });

  it("containsPosition returns false for position outside range", () => {
    const state = makeState(
      { pageId: "p1", blockId: "b1", charIndex: 0 },
      { pageId: "p1", blockId: "b1", charIndex: 10 },
    );
    expect(SelectionModel.containsPosition(state, { pageId: "p1", blockId: "b1", charIndex: 15 })).toBe(false);
  });

  it("getDirection returns forward when anchor < focus", () => {
    const state = makeState(
      { pageId: "p1", blockId: "b1", charIndex: 0 },
      { pageId: "p1", blockId: "b1", charIndex: 10 },
    );
    expect(SelectionModel.getDirection(state)).toBe("forward");
  });

  it("getDirection returns backward when anchor > focus", () => {
    const state = makeState(
      { pageId: "p1", blockId: "b1", charIndex: 10 },
      { pageId: "p1", blockId: "b1", charIndex: 0 },
    );
    expect(SelectionModel.getDirection(state)).toBe("backward");
  });

  it("getDirection returns none when equal", () => {
    const pos = { pageId: "p1", blockId: "b1", charIndex: 5 };
    const state = makeState(pos, pos);
    expect(SelectionModel.getDirection(state)).toBe("none");
  });
});
