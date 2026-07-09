import { describe, it, expect, vi } from "vitest";
import { InputEngine } from "../InputEngine.ts";
import type { InteractionState } from "../../../interaction/types.ts";
import type { InputCommand } from "../InputTypes.ts";

function createMockState(): InteractionState {
  return {
    caret: { position: { pageId: "p1", blockId: "b1", charIndex: 0 }, preferredX: null, visible: true, focused: true },
    selection: { anchor: null, focus: null },
    pointer: { clientX: 0, clientY: 0, buttons: 0, isDown: false, clickCount: 0 },
    hover: { pageId: null, blockId: null, lineIndex: null, charIndex: null },
    focusedPageId: "p1",
    focusedBlockId: "b1",
    pressedKeys: new Set<string>(),
  };
}

function fakeEvent(props: Record<string, unknown>): Event {
  return { type: "", ...props } as unknown as Event;
}

describe("InputEngine", () => {
  it("creates with default log sink", () => {
    const engine = new InputEngine(() => createMockState());
    expect(engine.dispatcher.sinkCount).toBe(1);
    engine.destroy();
  });

  it("handles keyboard events via keyboardMapper", () => {
    const commands: InputCommand[] = [];
    const engine = new InputEngine(() => createMockState(), (cmd) => commands.push(cmd));

    const cmd = engine.keyboardMapper.processKeyDown(
      { type: "keydown", key: "ArrowLeft", code: "ArrowLeft", modifiers: { ctrl: false, meta: false, alt: false, shift: false }, repeat: false, timestamp: 0, inputSource: "keyboard" },
      engine.context,
    );
    if (cmd) engine.dispatcher.dispatch(cmd);

    expect(commands.length).toBeGreaterThan(0);
    expect(commands.some(c => c.type === "MOVE_CARET")).toBe(true);
    engine.destroy();
  });

  it("processes beforeinput through BeforeInputHandler", () => {
    const commands: InputCommand[] = [];
    const engine = new InputEngine(() => createMockState(), (cmd) => commands.push(cmd));

    const cmd = engine.beforeInputHandler.process(
      { type: "beforeinput", inputType: "insertText", data: "x", dataTransfer: null, modifiers: { ctrl: false, meta: false, alt: false, shift: false }, timestamp: 0, inputSource: "keyboard" },
    );
    if (cmd) engine.dispatcher.dispatch(cmd);

    expect(commands.some(c => c.type === "INSERT_CHARACTER")).toBe(true);
    if (commands[0]?.type === "INSERT_CHARACTER") {
      expect(commands[0].text).toBe("x");
    }
    engine.destroy();
  });

  it("processes composition through CompositionHandler", () => {
    const commands: InputCommand[] = [];
    const engine = new InputEngine(() => createMockState(), (cmd) => commands.push(cmd));

    engine.compositionHandler.processStart({ type: "compositionstart", data: "", timestamp: 0, inputSource: "ime" });
    engine.compositionHandler.processUpdate({ type: "compositionupdate", data: "a", timestamp: 0, inputSource: "ime" });
    const cmd = engine.compositionHandler.processEnd({ type: "compositionend", data: "a", timestamp: 0, inputSource: "ime" });
    if (cmd) engine.dispatcher.dispatch(cmd);

    expect(commands.some(c => c.type === "INSERT_CHARACTER")).toBe(true);
    engine.destroy();
  });

  it("processes clipboard through ClipboardInput", () => {
    const commands: InputCommand[] = [];
    const engine = new InputEngine(() => createMockState(), (cmd) => commands.push(cmd));

    const copyCmd = engine.clipboardInput.processCopy({ type: "copy", dataTransfer: null, modifiers: { ctrl: false, meta: false, alt: false, shift: false }, timestamp: 0, inputSource: "clipboard" });
    if (copyCmd) engine.dispatcher.dispatch(copyCmd);

    const cutCmd = engine.clipboardInput.processCut({ type: "cut", dataTransfer: null, modifiers: { ctrl: false, meta: false, alt: false, shift: false }, timestamp: 0, inputSource: "clipboard" });
    if (cutCmd) engine.dispatcher.dispatch(cutCmd);

    const pasteCmd = engine.clipboardInput.processPaste({ type: "paste", dataTransfer: null, modifiers: { ctrl: false, meta: false, alt: false, shift: false }, timestamp: 0, inputSource: "clipboard" });
    if (pasteCmd) engine.dispatcher.dispatch(pasteCmd);

    expect(commands.some(c => c.type === "COPY")).toBe(true);
    expect(commands.some(c => c.type === "CUT")).toBe(true);
    expect(commands.some(c => c.type === "PASTE")).toBe(true);
    engine.destroy();
  });

  it("provides composition state", () => {
    const engine = new InputEngine(() => createMockState());
    expect(engine.getCompositionState()).toEqual({ active: false, data: "" });

    engine.compositionHandler.processStart({ type: "compositionstart", data: "", timestamp: 0, inputSource: "ime" });
    expect(engine.getCompositionState().active).toBe(true);
    engine.destroy();
  });

  it("destroy clears dispatcher and resets composition", () => {
    const engine = new InputEngine(() => createMockState());
    engine.compositionHandler.processStart({ type: "compositionstart", data: "", timestamp: 0, inputSource: "ime" });
    engine.destroy();

    expect(engine.dispatcher.sinkCount).toBe(0);
    expect(engine.getCompositionState()).toEqual({ active: false, data: "" });
  });

  it("processes undo shortcut via keyboardMapper", () => {
    const commands: InputCommand[] = [];
    const engine = new InputEngine(() => createMockState(), (cmd) => commands.push(cmd));

    const cmd = engine.keyboardMapper.processKeyDown(
      { type: "keydown", key: "z", code: "KeyZ", modifiers: { ctrl: true, meta: false, alt: false, shift: false }, repeat: false, timestamp: 0, inputSource: "keyboard" },
      engine.context,
    );
    if (cmd) engine.dispatcher.dispatch(cmd);

    expect(commands.some(c => c.type === "UNDO")).toBe(true);
    engine.destroy();
  });

  it("processes redo shortcut via keyboardMapper", () => {
    const commands: InputCommand[] = [];
    const engine = new InputEngine(() => createMockState(), (cmd) => commands.push(cmd));

    const cmd = engine.keyboardMapper.processKeyDown(
      { type: "keydown", key: "y", code: "KeyY", modifiers: { ctrl: true, meta: false, alt: false, shift: false }, repeat: false, timestamp: 0, inputSource: "keyboard" },
      engine.context,
    );
    if (cmd) engine.dispatcher.dispatch(cmd);

    expect(commands.some(c => c.type === "REDO")).toBe(true);
    engine.destroy();
  });

  it("does not handle pointer events through engine route", () => {
    const commands: InputCommand[] = [];
    const engine = new InputEngine(() => createMockState(), (cmd) => commands.push(cmd));

    const pointerEvent = fakeEvent({ type: "pointerdown" });
    engine.handleEvent(pointerEvent);

    expect(commands.length).toBe(0);
    engine.destroy();
  });
});
