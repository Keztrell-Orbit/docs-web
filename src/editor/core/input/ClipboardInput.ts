import type { NormalizedClipboardEvent, InputCommand } from "./InputTypes.ts";

export class ClipboardInput {
  processCopy(_event: NormalizedClipboardEvent): InputCommand | null {
    return { type: "COPY" };
  }

  processCut(_event: NormalizedClipboardEvent): InputCommand | null {
    return { type: "CUT" };
  }

  processPaste(event: NormalizedClipboardEvent): InputCommand | null {
    return { type: "PASTE", dataTransfer: event.dataTransfer };
  }
}
