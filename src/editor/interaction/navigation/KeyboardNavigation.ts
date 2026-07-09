import type { CharacterPosition } from "../types.ts";
import { NavigationEngine } from "./NavigationEngine.ts";

export type NavigationDirection =
  | "left"
  | "right"
  | "up"
  | "down"
  | "lineStart"
  | "lineEnd"
  | "prevWord"
  | "nextWord"
  | "prevPage"
  | "nextPage"
  | "docStart"
  | "docEnd";

export function getNavigationDirection(event: KeyboardEvent): NavigationDirection | null {
  const ctrl = event.ctrlKey || event.metaKey;

  switch (event.key) {
    case "ArrowRight":
      if (ctrl) return "nextWord";
      return "right";
    case "ArrowLeft":
      if (ctrl) return "prevWord";
      return "left";
    case "ArrowUp":
      if (ctrl) return "docStart";
      return "up";
    case "ArrowDown":
      if (ctrl) return "docEnd";
      return "down";
    case "Home":
      return "lineStart";
    case "End":
      return "lineEnd";
    case "PageUp":
      return "prevPage";
    case "PageDown":
      return "nextPage";
    default:
      return null;
  }
}

export function navigateInDirection(
  engine: NavigationEngine,
  pos: CharacterPosition,
  direction: NavigationDirection,
  preferredX: number | null,
): { position: CharacterPosition; preferredX: number | null } {
  const visualX = preferredX ?? 0;

  switch (direction) {
    case "right": {
      const moved = engine.moveRight(pos);
      return { position: moved, preferredX: null };
    }
    case "left": {
      const moved = engine.moveLeft(pos);
      return { position: moved, preferredX: null };
    }
    case "up": {
      const moved = engine.moveUp(pos, visualX);
      return { position: moved, preferredX };
    }
    case "down": {
      const moved = engine.moveDown(pos, visualX);
      return { position: moved, preferredX };
    }
    case "lineStart": {
      const moved = engine.moveToLineStart(pos);
      return { position: moved, preferredX: 0 };
    }
    case "lineEnd": {
      const moved = engine.moveToLineEnd(pos);
      return { position: moved, preferredX: null };
    }
    case "prevWord": {
      const moved = engine.moveToPrevWord(pos);
      return { position: moved, preferredX: null };
    }
    case "nextWord": {
      const moved = engine.moveToNextWord(pos);
      return { position: moved, preferredX: null };
    }
    case "prevPage": {
      const moved = engine.moveToPrevPage(pos);
      return { position: moved, preferredX: null };
    }
    case "nextPage": {
      const moved = engine.moveToNextPage(pos);
      return { position: moved, preferredX: null };
    }
    case "docStart": {
      const moved = engine.moveToDocumentStart();
      return { position: moved ?? pos, preferredX: null };
    }
    case "docEnd": {
      const moved = engine.moveToDocumentEnd();
      return { position: moved ?? pos, preferredX: null };
    }
    default:
      return { position: pos, preferredX: null };
  }
}
