import { describe, it, expect } from "vitest";
import { ClipboardInput } from "../ClipboardInput.ts";
import type { NormalizedClipboardEvent } from "../InputTypes.ts";

function event(overrides: Partial<NormalizedClipboardEvent>): NormalizedClipboardEvent {
  return {
    type: "copy",
    dataTransfer: null,
    modifiers: { ctrl: false, meta: false, alt: false, shift: false },
    timestamp: 0,
    inputSource: "clipboard",
    ...overrides,
  };
}

describe("ClipboardInput", () => {
  const clipboard = new ClipboardInput();

  it("copy → CopyCommand", () => {
    const cmd = clipboard.processCopy(event({ type: "copy" }));
    expect(cmd).toEqual({ type: "COPY" });
  });

  it("cut → CutCommand", () => {
    const cmd = clipboard.processCut(event({ type: "cut" }));
    expect(cmd).toEqual({ type: "CUT" });
  });

  it("paste → PasteCommand with dataTransfer", () => {
    const cmd = clipboard.processPaste(event({ type: "paste", dataTransfer: {} as DataTransfer }));
    expect(cmd?.type).toBe("PASTE");
    if (cmd?.type === "PASTE") {
      expect(cmd.dataTransfer).not.toBeNull();
    }
  });

  it("paste → PasteCommand with null dataTransfer", () => {
    const cmd = clipboard.processPaste(event({ type: "paste", dataTransfer: null }));
    expect(cmd).toEqual({ type: "PASTE", dataTransfer: null });
  });
});
