import { describe, it, expect } from "vitest";
import { hasPrimaryModifier, hasModifier, isOnlyModifier, MODIFIER_KEY_MAP } from "../InputConstants.ts";
import type { ModifierState } from "../InputTypes.ts";

describe("InputConstants", () => {
  describe("hasModifier", () => {
    it("returns true when any modifier is active", () => {
      expect(hasModifier({ ctrl: true, meta: false, alt: false, shift: false })).toBe(true);
      expect(hasModifier({ ctrl: false, meta: true, alt: false, shift: false })).toBe(true);
      expect(hasModifier({ ctrl: false, meta: false, alt: true, shift: false })).toBe(true);
      expect(hasModifier({ ctrl: false, meta: false, alt: false, shift: true })).toBe(true);
    });

    it("returns false when no modifiers are active", () => {
      expect(hasModifier({ ctrl: false, meta: false, alt: false, shift: false })).toBe(false);
    });
  });

  describe("isOnlyModifier", () => {
    it("returns true for modifier keys", () => {
      expect(isOnlyModifier("Control")).toBe(true);
      expect(isOnlyModifier("Meta")).toBe(true);
      expect(isOnlyModifier("Alt")).toBe(true);
      expect(isOnlyModifier("Shift")).toBe(true);
    });

    it("returns false for non-modifier keys", () => {
      expect(isOnlyModifier("a")).toBe(false);
      expect(isOnlyModifier("ArrowLeft")).toBe(false);
      expect(isOnlyModifier("Enter")).toBe(false);
    });
  });

  describe("MODIFIER_KEY_MAP", () => {
    it("maps modifier keys to state keys", () => {
      expect(MODIFIER_KEY_MAP["Control"]).toBe("ctrl");
      expect(MODIFIER_KEY_MAP["Meta"]).toBe("meta");
      expect(MODIFIER_KEY_MAP["Alt"]).toBe("alt");
      expect(MODIFIER_KEY_MAP["Shift"]).toBe("shift");
    });
  });
});
