import type { NormalizedPointerEvent, InputCommand } from "./InputTypes.ts";

export class PointerInput {
  processPointerDown(_event: NormalizedPointerEvent): InputCommand | null {
    return null;
  }

  processPointerMove(_event: NormalizedPointerEvent): InputCommand | null {
    return null;
  }

  processPointerUp(_event: NormalizedPointerEvent): InputCommand | null {
    return null;
  }
}
