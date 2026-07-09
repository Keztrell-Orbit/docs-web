import { describe, it, expect } from "vitest";
import { BeforeInputHandler } from "../BeforeInput.ts";
import type { NormalizedBeforeInputEvent } from "../InputTypes.ts";

function event(overrides: Partial<NormalizedBeforeInputEvent>): NormalizedBeforeInputEvent {
  return {
    type: "beforeinput",
    inputType: "insertText",
    data: null,
    dataTransfer: null,
    modifiers: { ctrl: false, meta: false, alt: false, shift: false },
    timestamp: 0,
    inputSource: "keyboard",
    ...overrides,
  };
}

describe("BeforeInputHandler", () => {
  const handler = new BeforeInputHandler();

  it("insertText with data → InsertCharacterCommand", () => {
    const cmd = handler.process(event({ inputType: "insertText", data: "a" }));
    expect(cmd).toEqual({ type: "INSERT_CHARACTER", text: "a" });
  });

  it("insertText without data → null", () => {
    const cmd = handler.process(event({ inputType: "insertText", data: null }));
    expect(cmd).toBeNull();
  });

  it("insertText with empty string → null", () => {
    const cmd = handler.process(event({ inputType: "insertText", data: "" }));
    expect(cmd).toBeNull();
  });

  it("insertParagraph → InsertParagraphCommand", () => {
    const cmd = handler.process(event({ inputType: "insertParagraph" }));
    expect(cmd).toEqual({ type: "INSERT_PARAGRAPH" });
  });

  it("insertLineBreak → SplitParagraphCommand", () => {
    const cmd = handler.process(event({ inputType: "insertLineBreak" }));
    expect(cmd).toEqual({ type: "SPLIT_PARAGRAPH" });
  });

  it("deleteContentBackward → DeleteBackward character", () => {
    const cmd = handler.process(event({ inputType: "deleteContentBackward" }));
    expect(cmd).toEqual({ type: "DELETE_BACKWARD", unit: "character" });
  });

  it("deleteWordBackward → DeleteBackward word", () => {
    const cmd = handler.process(event({ inputType: "deleteWordBackward" }));
    expect(cmd).toEqual({ type: "DELETE_BACKWARD", unit: "word" });
  });

  it("deleteContentForward → DeleteForward character", () => {
    const cmd = handler.process(event({ inputType: "deleteContentForward" }));
    expect(cmd).toEqual({ type: "DELETE_FORWARD", unit: "character" });
  });

  it("deleteWordForward → DeleteForward word", () => {
    const cmd = handler.process(event({ inputType: "deleteWordForward" }));
    expect(cmd).toEqual({ type: "DELETE_FORWARD", unit: "word" });
  });

  it("historyUndo → UndoCommand", () => {
    const cmd = handler.process(event({ inputType: "historyUndo" }));
    expect(cmd).toEqual({ type: "UNDO" });
  });

  it("historyRedo → RedoCommand", () => {
    const cmd = handler.process(event({ inputType: "historyRedo" }));
    expect(cmd).toEqual({ type: "REDO" });
  });

  it("insertFromPaste → PasteCommand", () => {
    const cmd = handler.process(event({ inputType: "insertFromPaste", dataTransfer: {} as DataTransfer }));
    expect(cmd?.type).toBe("PASTE");
    if (cmd?.type === "PASTE") {
      expect(cmd.dataTransfer).not.toBeNull();
    }
  });

  it("insertReplacementText → ReplaceSelectionCommand", () => {
    const cmd = handler.process(event({ inputType: "insertReplacementText", data: "abc" }));
    expect(cmd).toEqual({ type: "REPLACE_SELECTION", text: "abc" });
  });

  it("insertReplacementText without data → null", () => {
    const cmd = handler.process(event({ inputType: "insertReplacementText", data: null }));
    expect(cmd).toBeNull();
  });

  it("unknown inputType → null", () => {
    const cmd = handler.process(event({ inputType: "formatBold" as any }));
    expect(cmd).toBeNull();
  });

  it("deleteSoftLineBackward → DeleteBackward word", () => {
    const cmd = handler.process(event({ inputType: "deleteSoftLineBackward" }));
    expect(cmd).toEqual({ type: "DELETE_BACKWARD", unit: "word" });
  });

  it("insertFromDrop → null", () => {
    const cmd = handler.process(event({ inputType: "insertFromDrop" }));
    expect(cmd).toBeNull();
  });

  it("insertCompositionText → null", () => {
    const cmd = handler.process(event({ inputType: "insertCompositionText" }));
    expect(cmd).toBeNull();
  });
});
