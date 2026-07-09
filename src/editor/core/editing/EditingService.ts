import type { CharacterPosition, InteractionState, SelectionState } from "../../interaction/types.ts";
import type { InputCommand } from "../input/InputTypes.ts";
import type { InputDispatcher } from "../input/InputDispatcher.ts";
import type { Document } from "../../types.ts";
import type { DocumentController } from "../document/DocumentController.ts";
import type { EditorCommand } from "../commands/CommandTypes.ts";
import type { TextLayoutRegistry } from "../layout/TextLayoutRegistry.ts";
import { CommandExecutor, type CommandResult, type ExecutionContext } from "../commands/CommandExecutor.ts";

export interface InteractionSnapshot {
  caret: CharacterPosition;
  selection: { anchor: CharacterPosition | null; focus: CharacterPosition | null };
}

export interface EditingServiceConfig {
  inputDispatcher: InputDispatcher;
  controller: DocumentController;
  getInteractionState: () => InteractionState;
  getDocument: () => Document;
  dispatchInteraction: React.Dispatch<any>;
  onCommand?: (commandType: string, affectedBlocks: string[]) => void;
  textLayoutRegistry?: TextLayoutRegistry;
}

export class EditingService {
  readonly commandExecutor: CommandExecutor;
  readonly #inputDispatcher: InputDispatcher;
  readonly #controller: DocumentController;
  readonly #getInteractionState: () => InteractionState;
  readonly #getDocument: () => Document;
  readonly #dispatchInteraction: React.Dispatch<any>;

  #historySnapshots: Map<string, InteractionSnapshot> = new Map();
  #lastCommandType: string = "";
  #active: boolean = false;
  #boundHandler: (cmd: InputCommand) => void;
  #onCommand?: (commandType: string, affectedBlocks: string[]) => void;
  #textLayoutRegistry?: TextLayoutRegistry;

  constructor(config: EditingServiceConfig) {
    this.commandExecutor = new CommandExecutor();
    this.#inputDispatcher = config.inputDispatcher;
    this.#controller = config.controller;
    this.#getInteractionState = config.getInteractionState;
    this.#getDocument = config.getDocument;
    this.#dispatchInteraction = config.dispatchInteraction;
    this.#onCommand = config.onCommand;
    this.#textLayoutRegistry = config.textLayoutRegistry;
    this.#boundHandler = this.#handleCommand.bind(this);
  }

  start(): void {
    if (this.#active) return;
    this.#active = true;
    this.#inputDispatcher.register(this.#boundHandler);
  }

  stop(): void {
    if (!this.#active) return;
    this.#active = false;
    this.#inputDispatcher.unregister(this.#boundHandler);
  }

  destroy(): void {
    this.stop();
    this.#historySnapshots.clear();
  }

  get lastCommandType(): string {
    return this.#lastCommandType;
  }

  #handleCommand(inputCommand: InputCommand): void {
    if (!this.#active) return;

    const interactionState = this.#getInteractionState();

    // Input suspension: block editing until focused block has a valid TextLayout
    const focusedId = interactionState.focusedBlockId;
    if (focusedId && this.#textLayoutRegistry) {
      if (!this.#textLayoutRegistry.has(focusedId)) {
        console.warn(`[EditingService] Input suspended waiting for TextLayout: block '${focusedId}' has no layout`);
        return;
      }
    }

    const editorCommand = this.#toEditorCommand(inputCommand);
    if (!editorCommand) return;

    const document = this.#getDocument();

    const ctx: ExecutionContext = { document, interactionState };

    let result: CommandResult;

    if (editorCommand.type === "UNDO" || editorCommand.type === "REDO") {
      result = this.commandExecutor.execute(editorCommand, ctx, this.#controller);
      if (result.success) {
        this.#lastCommandType = result.lastCommand;
        this.#onCommand?.(result.lastCommand, result.affectedBlocks);
      }
    } else {
      const snapshot = this.#captureInteractionState(interactionState);
      result = this.commandExecutor.execute(editorCommand, ctx, this.#controller);
      if (result.success && result.committedTransactionId) {
        this.#historySnapshots.set(result.committedTransactionId, snapshot);
        this.#pruneSnapshots();
        this.#lastCommandType = result.lastCommand;
        this.#onCommand?.(result.lastCommand, result.affectedBlocks);
      }
    }

    if (result.success) {
      if (result.newCaretPosition) {
        this.#dispatchInteraction({
          type: "CARET_MOVED",
          position: result.newCaretPosition,
          extend: false,
          preferredX: null,
        });
      }
      if (result.clearSelection) {
        this.#dispatchInteraction({ type: "SELECTION_COLLAPSED" });
      }
      if (editorCommand.type === "UNDO") {
        this.#restoreStateAfterUndo();
      }
    }
  }

  #captureInteractionState(state: InteractionState): InteractionSnapshot {
    return {
      caret: { ...state.caret.position },
      selection: {
        anchor: state.selection.anchor ? { ...state.selection.anchor } : null,
        focus: state.selection.focus ? { ...state.selection.focus } : null,
      },
    };
  }

  #restoreStateAfterUndo(): void {
    const tx = this.#controller.history.peekRedo();
    if (!tx) return;
    const snapshot = this.#historySnapshots.get(tx.id);
    if (!snapshot) return;

    this.#dispatchInteraction({
      type: "CARET_MOVED",
      position: snapshot.caret,
      extend: false,
      preferredX: null,
    });

    if (snapshot.selection.anchor && snapshot.selection.focus) {
      this.#dispatchInteraction({
        type: "SELECTION_EXTENDED",
        focus: snapshot.selection.focus,
      });
    }
  }

  #pruneSnapshots(): void {
    if (this.#historySnapshots.size > 200) {
      const keys = [...this.#historySnapshots.keys()];
      const toDelete = keys.slice(0, keys.length - 150);
      for (const key of toDelete) {
        this.#historySnapshots.delete(key);
      }
    }
  }

  #toEditorCommand(input: InputCommand): EditorCommand | null {
    switch (input.type) {
      case "INSERT_CHARACTER":
        return { type: "INSERT_TEXT", text: input.text };
      case "DELETE_BACKWARD":
        return { type: "DELETE_BACKWARD", unit: input.unit };
      case "DELETE_FORWARD":
        return { type: "DELETE_FORWARD", unit: input.unit };
      case "SPLIT_PARAGRAPH":
      case "INSERT_PARAGRAPH":
        return { type: "SPLIT_PARAGRAPH" };
      case "REPLACE_SELECTION":
        return { type: "REPLACE_SELECTION", text: input.text };
      case "UNDO":
        return { type: "UNDO" };
      case "REDO":
        return { type: "REDO" };
      default:
        return null;
    }
  }
}
