import { describe, it, expect } from "vitest";
import { CompositionHandler } from "../CompositionInput.ts";
import type { NormalizedCompositionEvent } from "../InputTypes.ts";

function event(type: NormalizedCompositionEvent["type"], data: string): NormalizedCompositionEvent {
  return { type, data, timestamp: 0, inputSource: "ime" };
}

describe("CompositionHandler", () => {
  it("starts with inactive composition", () => {
    const handler = new CompositionHandler();
    expect(handler.getCompositionState()).toEqual({ active: false, data: "" });
  });

  it("processStart activates composition and returns null", () => {
    const handler = new CompositionHandler();
    const cmd = handler.processStart(event("compositionstart", ""));
    expect(cmd).toBeNull();
    expect(handler.getCompositionState().active).toBe(true);
  });

  it("processUpdate stores data and returns null", () => {
    const handler = new CompositionHandler();
    handler.processStart(event("compositionstart", ""));
    const cmd = handler.processUpdate(event("compositionupdate", "h"));
    expect(cmd).toBeNull();
    expect(handler.getCompositionState().data).toBe("h");
  });

  it("processUpdate accumulates data through multiple updates", () => {
    const handler = new CompositionHandler();
    handler.processStart(event("compositionstart", ""));
    handler.processUpdate(event("compositionupdate", "he"));
    handler.processUpdate(event("compositionupdate", "hel"));
    handler.processUpdate(event("compositionupdate", "hell"));
    expect(handler.getCompositionState().data).toBe("hell");
  });

  it("processEnd with data emits InsertCharacterCommand and resets", () => {
    const handler = new CompositionHandler();
    handler.processStart(event("compositionstart", ""));
    handler.processUpdate(event("compositionupdate", "hello"));
    const cmd = handler.processEnd(event("compositionend", "hello"));
    expect(cmd).toEqual({ type: "INSERT_CHARACTER", text: "hello" });
    expect(handler.getCompositionState()).toEqual({ active: false, data: "" });
  });

  it("processEnd with empty data emits null and resets", () => {
    const handler = new CompositionHandler();
    handler.processStart(event("compositionstart", ""));
    handler.processUpdate(event("compositionupdate", ""));
    const cmd = handler.processEnd(event("compositionend", ""));
    expect(cmd).toBeNull();
    expect(handler.getCompositionState()).toEqual({ active: false, data: "" });
  });

  it("full IME lifecycle produces correct command", () => {
    const handler = new CompositionHandler();

    expect(handler.processStart(event("compositionstart", ""))).toBeNull();
    expect(handler.getCompositionState().active).toBe(true);

    expect(handler.processUpdate(event("compositionupdate", "한"))).toBeNull();
    expect(handler.getCompositionState().data).toBe("한");

    expect(handler.processUpdate(event("compositionupdate", "한글"))).toBeNull();
    expect(handler.getCompositionState().data).toBe("한글");

    const cmd = handler.processEnd(event("compositionend", "한글"));
    expect(cmd).toEqual({ type: "INSERT_CHARACTER", text: "한글" });
    expect(handler.getCompositionState().active).toBe(false);
  });

  it("reset clears composition state", () => {
    const handler = new CompositionHandler();
    handler.processStart(event("compositionstart", ""));
    handler.processUpdate(event("compositionupdate", "data"));
    handler.reset();
    expect(handler.getCompositionState()).toEqual({ active: false, data: "" });
  });

  it("handles rapid restart (composition interrupted)", () => {
    const handler = new CompositionHandler();
    handler.processStart(event("compositionstart", ""));
    handler.processUpdate(event("compositionupdate", "abc"));
    handler.processEnd(event("compositionend", "abc"));

    handler.processStart(event("compositionstart", ""));
    handler.processUpdate(event("compositionupdate", "d"));
    const cmd = handler.processEnd(event("compositionend", "d"));
    expect(cmd).toEqual({ type: "INSERT_CHARACTER", text: "d" });
  });
});
