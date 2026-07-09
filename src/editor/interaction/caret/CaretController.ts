import type { CharacterPosition } from "../types.ts";

export interface CaretPosition {
  pageId: string;
  blockId: string;
  charIndex: number;
}

export class CaretController {
  private onMove: (position: CharacterPosition) => void;
  private onFocus: () => void;
  private onBlur: () => void;
  private onShow: () => void;
  private onHide: () => void;

  constructor(handlers: {
    onMove: (position: CharacterPosition) => void;
    onFocus: () => void;
    onBlur: () => void;
    onShow: () => void;
    onHide: () => void;
  }) {
    this.onMove = handlers.onMove;
    this.onFocus = handlers.onFocus;
    this.onBlur = handlers.onBlur;
    this.onShow = handlers.onShow;
    this.onHide = handlers.onHide;
  }

  moveTo(position: CharacterPosition): void {
    this.onMove(position);
  }

  focus(): void {
    this.onFocus();
  }

  blur(): void {
    this.onBlur();
  }

  hide(): void {
    this.onHide();
  }

  show(): void {
    this.onShow();
  }
}
