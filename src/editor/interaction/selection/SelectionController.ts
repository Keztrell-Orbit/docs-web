import type { CharacterPosition, TextLayout } from "../types.ts";
import { TextLayoutService } from "../services/TextLayoutService.ts";
import { lineStartIndex, lineEndIndex } from "../types.ts";

export class SelectionController {
  private textLayoutService: TextLayoutService;

  constructor(textLayoutService?: TextLayoutService) {
    this.textLayoutService = textLayoutService ?? new TextLayoutService();
  }

  selectWord(
    position: CharacterPosition,
    text: string,
  ): { anchor: CharacterPosition; focus: CharacterPosition } {
    const bounds = this.textLayoutService.findWordBoundaries(text, position.charIndex);
    return {
      anchor: { ...position, charIndex: bounds?.start ?? position.charIndex },
      focus: { ...position, charIndex: bounds?.end ?? position.charIndex },
    };
  }

  selectLine(
    position: CharacterPosition,
    textLayout: TextLayout,
  ): { anchor: CharacterPosition; focus: CharacterPosition } {
    const lineIdx = this.textLayoutService.findLineAtChar(textLayout, position.charIndex);
    const line = textLayout.lines[lineIdx];
    if (!line) {
      return { anchor: position, focus: position };
    }
    return {
      anchor: { ...position, charIndex: lineStartIndex(line) },
      focus: { ...position, charIndex: lineEndIndex(line) },
    };
  }

  selectParagraph(
    position: CharacterPosition,
    text: string,
  ): { anchor: CharacterPosition; focus: CharacterPosition } {
    return {
      anchor: { ...position, charIndex: 0 },
      focus: { ...position, charIndex: text.length },
    };
  }
}
