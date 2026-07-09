import { describe, it, expect } from "vitest";
import {
  normalizeKeyboardEvent,
  normalizeBeforeInputEvent,
  normalizeCompositionEvent,
  normalizePointerEvent,
  normalizeClipboardEvent,
  normalizeWheelEvent,
  getModifiers,
} from "../InputEventNormalizer.ts";

function fakeKeyboardEvent(props: Record<string, unknown>): KeyboardEvent {
  return { type: "keydown", key: "", code: "", ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, repeat: false, timeStamp: 0, ...props } as unknown as KeyboardEvent;
}

function fakeInputEvent(props: Record<string, unknown>): InputEvent {
  return { type: "beforeinput", inputType: "", data: null, dataTransfer: null, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, timeStamp: 0, ...props } as unknown as InputEvent;
}

function fakeCompositionEvent(props: Record<string, unknown>): CompositionEvent {
  return { type: "compositionstart", data: "", timeStamp: 0, ...props } as unknown as CompositionEvent;
}

function fakePointerEvent(props: Record<string, unknown>): PointerEvent {
  return { type: "pointerdown", clientX: 0, clientY: 0, buttons: 0, pointerType: "mouse", detail: 0, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, timeStamp: 0, ...props } as unknown as PointerEvent;
}

function fakeClipboardEvent(props: Record<string, unknown>): ClipboardEvent {
  return { type: "copy", clipboardData: null, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, timeStamp: 0, ...props } as unknown as ClipboardEvent;
}

function fakeWheelEvent(props: Record<string, unknown>): WheelEvent {
  return { type: "wheel", deltaX: 0, deltaY: 0, deltaZ: 0, deltaMode: 0, ctrlKey: false, timeStamp: 0, ...props } as unknown as WheelEvent;
}

describe("InputEventNormalizer", () => {
  describe("getModifiers", () => {
    it("extracts all modifier states", () => {
      const mods = getModifiers({ ctrlKey: true, metaKey: false, altKey: true, shiftKey: false });
      expect(mods).toEqual({ ctrl: true, meta: false, alt: true, shift: false });
    });

    it("handles all false", () => {
      const mods = getModifiers({ ctrlKey: false, metaKey: false, altKey: false, shiftKey: false });
      expect(mods).toEqual({ ctrl: false, meta: false, alt: false, shift: false });
    });
  });

  describe("normalizeKeyboardEvent", () => {
    it("normalizes a keydown event", () => {
      const event = fakeKeyboardEvent({ key: "ArrowLeft", code: "ArrowLeft", ctrlKey: true, type: "keydown" });
      const result = normalizeKeyboardEvent(event);
      expect(result.type).toBe("keydown");
      expect(result.key).toBe("ArrowLeft");
      expect(result.code).toBe("ArrowLeft");
      expect(result.modifiers.ctrl).toBe(true);
      expect(result.repeat).toBe(false);
      expect(result.inputSource).toBe("keyboard");
    });

    it("normalizes a keyup event", () => {
      const event = fakeKeyboardEvent({ key: "z", code: "KeyZ", metaKey: true, type: "keyup" });
      const result = normalizeKeyboardEvent(event);
      expect(result.type).toBe("keyup");
      expect(result.key).toBe("z");
      expect(result.code).toBe("KeyZ");
      expect(result.modifiers.meta).toBe(true);
    });
  });

  describe("normalizeBeforeInputEvent", () => {
    it("normalizes insertText beforeinput", () => {
      const event = fakeInputEvent({ inputType: "insertText", data: "a" });
      const result = normalizeBeforeInputEvent(event);
      expect(result.type).toBe("beforeinput");
      expect(result.inputType).toBe("insertText");
      expect(result.data).toBe("a");
    });

    it("normalizes deleteContentBackward beforeinput", () => {
      const event = fakeInputEvent({ inputType: "deleteContentBackward" });
      const result = normalizeBeforeInputEvent(event);
      expect(result.inputType).toBe("deleteContentBackward");
      expect(result.data).toBeNull();
    });
  });

  describe("normalizeCompositionEvent", () => {
    it("normalizes compositionstart", () => {
      const event = fakeCompositionEvent({ type: "compositionstart", data: "" });
      const result = normalizeCompositionEvent(event);
      expect(result.type).toBe("compositionstart");
      expect(result.inputSource).toBe("ime");
    });

    it("normalizes compositionupdate with data", () => {
      const event = fakeCompositionEvent({ type: "compositionupdate", data: "你好" });
      const result = normalizeCompositionEvent(event);
      expect(result.type).toBe("compositionupdate");
      expect(result.data).toBe("你好");
    });
  });

  describe("normalizePointerEvent", () => {
    it("normalizes pointerdown", () => {
      const event = fakePointerEvent({ clientX: 100, clientY: 200, buttons: 1, detail: 1 });
      const result = normalizePointerEvent(event);
      expect(result.type).toBe("pointerdown");
      expect(result.clientX).toBe(100);
      expect(result.clientY).toBe(200);
      expect(result.buttons).toBe(1);
      expect(result.pointerType).toBe("mouse");
      expect(result.clickCount).toBe(1);
    });
  });

  describe("normalizeClipboardEvent", () => {
    it("normalizes copy event", () => {
      const event = fakeClipboardEvent({ type: "copy" });
      const result = normalizeClipboardEvent(event);
      expect(result.type).toBe("copy");
      expect(result.inputSource).toBe("clipboard");
    });

    it("normalizes paste event", () => {
      const event = fakeClipboardEvent({ type: "paste" });
      const result = normalizeClipboardEvent(event);
      expect(result.type).toBe("paste");
    });
  });

  describe("normalizeWheelEvent", () => {
    it("normalizes wheel event", () => {
      const event = fakeWheelEvent({ deltaY: 100, deltaMode: 0 });
      const result = normalizeWheelEvent(event);
      expect(result.type).toBe("wheel");
      expect(result.deltaY).toBe(100);
      expect(result.deltaMode).toBe(0);
    });
  });
});
