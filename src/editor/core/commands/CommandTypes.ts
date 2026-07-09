export interface InsertTextCommandData {
  readonly type: "INSERT_TEXT";
  readonly text: string;
}

export interface DeleteBackwardCommandData {
  readonly type: "DELETE_BACKWARD";
  readonly unit: "character" | "word";
}

export interface DeleteForwardCommandData {
  readonly type: "DELETE_FORWARD";
  readonly unit: "character" | "word";
}

export interface SplitParagraphCommandData {
  readonly type: "SPLIT_PARAGRAPH";
}

export interface MergeParagraphCommandData {
  readonly type: "MERGE_PARAGRAPH";
  readonly direction: "backward" | "forward";
}

export interface ReplaceSelectionCommandData {
  readonly type: "REPLACE_SELECTION";
  readonly text: string;
}

export interface DeleteSelectionCommandData {
  readonly type: "DELETE_SELECTION";
}

export interface UndoCommandData {
  readonly type: "UNDO";
}

export interface RedoCommandData {
  readonly type: "REDO";
}

export type EditorCommand =
  | InsertTextCommandData
  | DeleteBackwardCommandData
  | DeleteForwardCommandData
  | SplitParagraphCommandData
  | MergeParagraphCommandData
  | ReplaceSelectionCommandData
  | DeleteSelectionCommandData
  | UndoCommandData
  | RedoCommandData;
