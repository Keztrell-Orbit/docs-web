import type { NormalizedPointerEvent, InputCommand } from "./InputTypes.ts";

export class MouseInput {
  processClick(_event: NormalizedPointerEvent): InputCommand | null {
    return null;
  }

  processDoubleClick(_event: NormalizedPointerEvent): InputCommand | null {
    return null;
  }

  processTripleClick(_event: NormalizedPointerEvent): InputCommand | null {
    return null;
  }
}
