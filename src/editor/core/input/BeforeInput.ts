import type { NormalizedBeforeInputEvent, InputCommand } from "./InputTypes.ts";

export class BeforeInputHandler {
  process(event: NormalizedBeforeInputEvent): InputCommand | null {
    switch (event.inputType) {
      case "insertText":
        if (!event.data) return null;
        return { type: "INSERT_CHARACTER", text: event.data };

      case "insertParagraph":
        return { type: "INSERT_PARAGRAPH" };

      case "insertLineBreak":
        return { type: "SPLIT_PARAGRAPH" };

      case "deleteContentBackward":
        return { type: "DELETE_BACKWARD", unit: "character" };

      case "deleteWordBackward":
        return { type: "DELETE_BACKWARD", unit: "word" };

      case "deleteContentForward":
        return { type: "DELETE_FORWARD", unit: "character" };

      case "deleteWordForward":
        return { type: "DELETE_FORWARD", unit: "word" };

      case "historyUndo":
        return { type: "UNDO" };

      case "historyRedo":
        return { type: "REDO" };

      case "insertFromPaste":
      case "insertFromPasteAsQuotation":
        return { type: "PASTE", dataTransfer: event.dataTransfer };

      case "insertReplacementText":
        if (!event.data) return null;
        return { type: "REPLACE_SELECTION", text: event.data };

      case "deleteSoftLineBackward":
      case "deleteHardLineBackward":
      case "deleteEntireSoftLine":
        return { type: "DELETE_BACKWARD", unit: "word" };

      case "deleteSoftLineForward":
      case "deleteHardLineForward":
        return { type: "DELETE_FORWARD", unit: "word" };

      case "insertFromDrop":
      case "insertFromYank":
      case "insertTranspose":
      case "insertCompositionText":
        return null;

      default:
        return null;
    }
  }
}
