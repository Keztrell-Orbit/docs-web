import type { NormalizedWheelEvent, InputCommand } from "./InputTypes.ts";

export class WheelInput {
  process(event: NormalizedWheelEvent): InputCommand | null {
    const absDeltaY = Math.abs(event.deltaY);
    if (absDeltaY < 1) return null;
    return { type: "SCROLL_INTO_VIEW", alignToTop: event.deltaY < 0 };
  }
}
