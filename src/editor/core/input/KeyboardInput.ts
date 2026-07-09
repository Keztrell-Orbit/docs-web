import type {
  NormalizedKeyboardEvent,
  InputCommand,
  MoveCaretCommand,
} from "./InputTypes.ts";
import type { InputContext } from "./InputContext.ts";
import { hasPrimaryModifier } from "./InputConstants.ts";

export class KeyboardMapper {
  processKeyDown(event: NormalizedKeyboardEvent, _context: InputContext): InputCommand | null {
    if (event.type !== "keydown") return null;

    const shortcut = this.#detectShortcut(event);
    if (shortcut) return shortcut;

    const navigation = this.#detectNavigation(event);
    if (navigation) return navigation;

    return null;
  }

  processKeyUp(_event: NormalizedKeyboardEvent, _context: InputContext): InputCommand | null {
    return null;
  }

  #detectShortcut(event: NormalizedKeyboardEvent): InputCommand | null {
    const { modifiers, key } = event;
    const primary = hasPrimaryModifier(modifiers);

    if (!primary && !modifiers.alt) return null;

    const lowerKey = key.toLowerCase();

    if (primary && lowerKey === "z") {
      return modifiers.shift
        ? { type: "REDO" }
        : { type: "UNDO" };
    }

    if (primary && !modifiers.shift && lowerKey === "y") {
      return { type: "REDO" };
    }

    if (primary && lowerKey === "c") {
      return { type: "COPY" };
    }

    if (primary && lowerKey === "x") {
      return { type: "CUT" };
    }

    if (primary && lowerKey === "v") {
      return { type: "PASTE", dataTransfer: null };
    }

    if (primary && lowerKey === "a") {
      return { type: "SELECT_ALL" };
    }

    return null;
  }

  #detectNavigation(event: NormalizedKeyboardEvent): InputCommand | null {
    const { key, modifiers } = event;
    const ctrl = hasPrimaryModifier(modifiers);
    const extend = modifiers.shift;

    switch (key) {
      case "ArrowLeft":
        return ctrl
          ? this.#moveCaret("prevWord", extend)
          : this.#moveCaret("left", extend);
      case "ArrowRight":
        return ctrl
          ? this.#moveCaret("nextWord", extend)
          : this.#moveCaret("right", extend);
      case "ArrowUp":
        return ctrl
          ? this.#moveCaret("docStart", extend)
          : this.#moveCaret("up", extend);
      case "ArrowDown":
        return ctrl
          ? this.#moveCaret("docEnd", extend)
          : this.#moveCaret("down", extend);
      case "Home":
        return this.#moveCaret("lineStart", extend);
      case "End":
        return this.#moveCaret("lineEnd", extend);
      case "PageUp":
        return this.#moveCaret("prevPage", extend);
      case "PageDown":
        return this.#moveCaret("nextPage", extend);
      default:
        return null;
    }
  }

  #moveCaret(direction: MoveCaretCommand["direction"], extend: boolean): MoveCaretCommand {
    return {
      type: "MOVE_CARET",
      direction,
      extend,
    };
  }
}
