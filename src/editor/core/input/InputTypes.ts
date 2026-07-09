export type Platform = "mac" | "windows" | "linux" | "unknown";

export type InputSource = "keyboard" | "mouse" | "touch" | "pen" | "ime" | "clipboard" | "contextMenu" | "wheel" | "drag" | "drop";

export interface ModifierState {
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
}

export interface CompositionState {
  active: boolean;
  data: string;
}

export interface NormalizedKeyboardEvent {
  type: "keydown" | "keyup";
  key: string;
  code: string;
  modifiers: ModifierState;
  repeat: boolean;
  timestamp: number;
  inputSource: "keyboard";
}

export interface NormalizedBeforeInputEvent {
  type: "beforeinput";
  inputType: string;
  data: string | null;
  dataTransfer: DataTransfer | null;
  modifiers: ModifierState;
  timestamp: number;
  inputSource: InputSource;
}

export interface NormalizedCompositionEvent {
  type: "compositionstart" | "compositionupdate" | "compositionend";
  data: string;
  timestamp: number;
  inputSource: "ime";
}

export interface NormalizedPointerEvent {
  type: "pointerdown" | "pointermove" | "pointerup";
  clientX: number;
  clientY: number;
  buttons: number;
  pointerType: string;
  clickCount: number;
  modifiers: ModifierState;
  timestamp: number;
  inputSource: InputSource;
}

export interface NormalizedClipboardEvent {
  type: "copy" | "cut" | "paste";
  dataTransfer: DataTransfer | null;
  modifiers: ModifierState;
  timestamp: number;
  inputSource: "clipboard";
}

export interface NormalizedWheelEvent {
  type: "wheel";
  deltaX: number;
  deltaY: number;
  deltaZ: number;
  deltaMode: number;
  ctrlKey: boolean;
  timestamp: number;
  inputSource: "wheel";
}

export interface NormalizedFocusEvent {
  type: "focus" | "blur";
  timestamp: number;
  inputSource: InputSource;
}

export interface NormalizedDragEvent {
  type: "drag" | "drop";
  dataTransfer: DataTransfer | null;
  clientX: number;
  clientY: number;
  modifiers: ModifierState;
  timestamp: number;
  inputSource: "drag";
}

export interface NormalizedContextMenuEvent {
  type: "contextmenu";
  clientX: number;
  clientY: number;
  modifiers: ModifierState;
  timestamp: number;
  inputSource: "contextMenu";
}

export type NormalizedEvent =
  | NormalizedKeyboardEvent
  | NormalizedBeforeInputEvent
  | NormalizedCompositionEvent
  | NormalizedPointerEvent
  | NormalizedClipboardEvent
  | NormalizedWheelEvent
  | NormalizedFocusEvent
  | NormalizedDragEvent
  | NormalizedContextMenuEvent;

export interface MoveCaretCommand {
  type: "MOVE_CARET";
  direction?: "left" | "right" | "up" | "down" | "lineStart" | "lineEnd" | "prevWord" | "nextWord" | "prevPage" | "nextPage" | "docStart" | "docEnd";
  position?: {
    pageId: string;
    blockId: string;
    charIndex: number;
  };
  extend: boolean;
}

export interface ExtendSelectionCommand {
  type: "EXTEND_SELECTION";
  direction: "left" | "right" | "up" | "down" | "lineStart" | "lineEnd";
  granularity: "character" | "word" | "line";
}

export interface SelectWordCommand {
  type: "SELECT_WORD";
}

export interface SelectParagraphCommand {
  type: "SELECT_PARAGRAPH";
}

export interface SelectAllCommand {
  type: "SELECT_ALL";
}

export interface FocusEditorCommand {
  type: "FOCUS_EDITOR";
}

export interface BlurEditorCommand {
  type: "BLUR_EDITOR";
}

export interface ScrollIntoViewCommand {
  type: "SCROLL_INTO_VIEW";
  alignToTop?: boolean;
}

export interface HoverBlockCommand {
  type: "HOVER_BLOCK";
  pageId: string | null;
  blockId: string | null;
}

export interface HoverCharacterCommand {
  type: "HOVER_CHARACTER";
  pageId: string | null;
  blockId: string | null;
  lineIndex: number | null;
  charIndex: number | null;
}

export interface InsertCharacterCommand {
  type: "INSERT_CHARACTER";
  text: string;
}

export interface DeleteBackwardCommand {
  type: "DELETE_BACKWARD";
  unit: "character" | "word";
}

export interface DeleteForwardCommand {
  type: "DELETE_FORWARD";
  unit: "character" | "word";
}

export interface SplitParagraphCommand {
  type: "SPLIT_PARAGRAPH";
}

export interface ReplaceSelectionCommand {
  type: "REPLACE_SELECTION";
  text: string;
}

export interface InsertParagraphCommand {
  type: "INSERT_PARAGRAPH";
}

export interface PasteCommand {
  type: "PASTE";
  dataTransfer: DataTransfer | null;
}

export interface CopyCommand {
  type: "COPY";
}

export interface CutCommand {
  type: "CUT";
}

export interface UndoCommand {
  type: "UNDO";
}

export interface RedoCommand {
  type: "REDO";
}

export type InputCommand =
  | MoveCaretCommand
  | ExtendSelectionCommand
  | SelectWordCommand
  | SelectParagraphCommand
  | SelectAllCommand
  | FocusEditorCommand
  | BlurEditorCommand
  | ScrollIntoViewCommand
  | HoverBlockCommand
  | HoverCharacterCommand
  | InsertCharacterCommand
  | DeleteBackwardCommand
  | DeleteForwardCommand
  | SplitParagraphCommand
  | ReplaceSelectionCommand
  | InsertParagraphCommand
  | PasteCommand
  | CopyCommand
  | CutCommand
  | UndoCommand
  | RedoCommand;

export type CommandSink = (command: InputCommand) => void;

export interface InputStateSnapshot {
  selection: {
    anchor: { pageId: string; blockId: string; charIndex: number } | null;
    focus: { pageId: string; blockId: string; charIndex: number } | null;
  };
  caret: {
    position: { pageId: string; blockId: string; charIndex: number };
    focused: boolean;
  };
  modifiers: ModifierState;
  pressedKeys: Set<string>;
  focusedBlockId: string | null;
  focusedPageId: string | null;
}
