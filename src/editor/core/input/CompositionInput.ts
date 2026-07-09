import type { NormalizedCompositionEvent, InputCommand, CompositionState } from "./InputTypes.ts";

export class CompositionHandler {
  #active = false;
  #data = "";

  processStart(event: NormalizedCompositionEvent): InputCommand | null {
    this.#active = true;
    this.#data = event.data;
    return null;
  }

  processUpdate(event: NormalizedCompositionEvent): InputCommand | null {
    this.#data = event.data;
    return null;
  }

  processEnd(event: NormalizedCompositionEvent): InputCommand | null {
    this.#active = false;
    const data = event.data;
    this.#data = "";
    if (data) {
      return { type: "INSERT_CHARACTER", text: data };
    }
    return null;
  }

  getCompositionState(): CompositionState {
    return { active: this.#active, data: this.#data };
  }

  reset(): void {
    this.#active = false;
    this.#data = "";
  }
}
