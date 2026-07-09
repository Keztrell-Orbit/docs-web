import { describe, it, expect } from "vitest";
import type { Document, Block, ParagraphBlock } from "../../../types.ts";
import type { InteractionState } from "../../../interaction/types.ts";
import type { ExecutionResult } from "../../../core/types.ts";
import { CommandExecutor, type ExecutionContext, type CommandResult } from "../CommandExecutor.ts";
import type { DocumentController } from "../../document/DocumentController.ts";

function makeDoc(blocks: Block[]): Document {
  return { id: "test", title: "", blocks };
}

function para(id: string, text: string): ParagraphBlock {
  return { type: "paragraph", id, text };
}

function makeInteractionState(overrides?: Partial<InteractionState>): InteractionState {
  return {
    caret: { position: { pageId: "p1", blockId: "b1", charIndex: 0 }, preferredX: null, visible: true, focused: true },
    selection: { anchor: null, focus: null },
    pointer: { clientX: 0, clientY: 0, buttons: 0, isDown: false, clickCount: 0 },
    hover: { pageId: null, blockId: null, lineIndex: null, charIndex: null },
    focusedPageId: "p1",
    focusedBlockId: "b1",
    pressedKeys: new Set(),
    ...overrides,
  };
}

function makeMockController(): DocumentController {
  let doc = makeDoc([para("b1", "Hello World")]);
  let txCounter = 0;

  return {
    execute: (transaction: any) => {
      txCounter++;
      let current = doc;
      for (const op of transaction.operations) {
        current = op.apply(current);
      }
      doc = current;
      const committed = {
        id: `tx-${txCounter}`,
        operations: [...transaction.operations],
        inverseOperations: [],
        documentBefore: doc,
        documentAfter: doc,
        timestamp: Date.now(),
        duration: 0,
        valid: true,
        errors: [],
      };
      return { success: true, errors: [], document: doc, committed } as ExecutionResult;
    },
    undo: () => {
      return { success: true, errors: [], document: doc, committed: null } as ExecutionResult;
    },
    redo: () => {
      return { success: true, errors: [], document: doc, committed: null } as ExecutionResult;
    },
    get executor(): any { return {}; },
        get history(): any {
          return {
            canUndo: () => true,
            canRedo: () => true,
            undoDepth: 1,
            redoDepth: 0,
            push: () => {},
            peekUndo: () => ({ id: "mock-tx" }),
            peekRedo: () => null,
            undo: () => ({ id: "mock-tx" }),
            redo: () => ({ id: "mock-tx" }),
          };
        },
        get eventBus(): any { return { on: () => {}, off: () => {}, emit: () => {} }; },
  } as unknown as DocumentController;
}

describe("CommandExecutor", () => {
  describe("INSERT_TEXT", () => {
    it("inserts text at caret position and advances caret", () => {
      const executor = new CommandExecutor();
      const doc = makeDoc([para("b1", "Hello")]);
      const state = makeInteractionState({
        caret: { position: { pageId: "p1", blockId: "b1", charIndex: 5 }, preferredX: null, visible: true, focused: true },
      });
      const ctx: ExecutionContext = { document: doc, interactionState: state };
      const controller = makeMockController();

      const result = executor.execute({ type: "INSERT_TEXT", text: "!" }, ctx, controller);

      expect(result.success).toBe(true);
      expect(result.newCaretPosition).not.toBeNull();
      expect(result.newCaretPosition!.charIndex).toBe(6);
      expect(result.newCaretPosition!.blockId).toBe("b1");
      expect(result.clearSelection).toBe(true);
    });

    it("inserts text mid-paragraph", () => {
      const executor = new CommandExecutor();
      const doc = makeDoc([para("b1", "Hllo")]);
      const state = makeInteractionState({
        caret: { position: { pageId: "p1", blockId: "b1", charIndex: 1 }, preferredX: null, visible: true, focused: true },
      });
      const ctx: ExecutionContext = { document: doc, interactionState: state };
      const controller = makeMockController();

      const result = executor.execute({ type: "INSERT_TEXT", text: "e" }, ctx, controller);

      expect(result.success).toBe(true);
      expect(result.newCaretPosition!.charIndex).toBe(2);
      expect(result.lastCommand).toBe("INSERT_TEXT");
    });
  });

  describe("DELETE_BACKWARD", () => {
    it("deletes previous character and moves caret back", () => {
      const executor = new CommandExecutor();
      const doc = makeDoc([para("b1", "Hello")]);
      const state = makeInteractionState({
        caret: { position: { pageId: "p1", blockId: "b1", charIndex: 5 }, preferredX: null, visible: true, focused: true },
      });
      const ctx: ExecutionContext = { document: doc, interactionState: state };
      const controller = makeMockController();

      const result = executor.execute({ type: "DELETE_BACKWARD", unit: "character" }, ctx, controller);

      expect(result.success).toBe(true);
      expect(result.newCaretPosition!.charIndex).toBe(4);
    });

    it("does nothing at start of first block", () => {
      const executor = new CommandExecutor();
      const doc = makeDoc([para("b1", "Hello")]);
      const state = makeInteractionState({
        caret: { position: { pageId: "p1", blockId: "b1", charIndex: 0 }, preferredX: null, visible: true, focused: true },
      });
      const ctx: ExecutionContext = { document: doc, interactionState: state };
      const controller = makeMockController();

      const result = executor.execute({ type: "DELETE_BACKWARD", unit: "character" }, ctx, controller);

      expect(result.success).toBe(true);
      expect(result.newCaretPosition).toBeNull();
    });

    it("deletes selection when selection exists", () => {
      const executor = new CommandExecutor();
      const doc = makeDoc([para("b1", "Hello World")]);
      const state = makeInteractionState({
        caret: { position: { pageId: "p1", blockId: "b1", charIndex: 11 }, preferredX: null, visible: true, focused: true },
        selection: {
          anchor: { pageId: "p1", blockId: "b1", charIndex: 0 },
          focus: { pageId: "p1", blockId: "b1", charIndex: 6 },
        },
      });
      const ctx: ExecutionContext = { document: doc, interactionState: state };
      const controller = makeMockController();

      const result = executor.execute({ type: "DELETE_BACKWARD", unit: "character" }, ctx, controller);

      expect(result.success).toBe(true);
      expect(result.lastCommand).toBe("DELETE_SELECTION");
    });
  });

  describe("DELETE_FORWARD", () => {
    it("deletes next character", () => {
      const executor = new CommandExecutor();
      const doc = makeDoc([para("b1", "Hello")]);
      const state = makeInteractionState({
        caret: { position: { pageId: "p1", blockId: "b1", charIndex: 0 }, preferredX: null, visible: true, focused: true },
      });
      const ctx: ExecutionContext = { document: doc, interactionState: state };
      const controller = makeMockController();

      const result = executor.execute({ type: "DELETE_FORWARD", unit: "character" }, ctx, controller);

      expect(result.success).toBe(true);
      expect(result.newCaretPosition!.charIndex).toBe(0);
    });
  });

  describe("SPLIT_PARAGRAPH", () => {
    it("splits paragraph at caret position", () => {
      const executor = new CommandExecutor();
      const doc = makeDoc([para("b1", "HelloWorld")]);
      const state = makeInteractionState({
        caret: { position: { pageId: "p1", blockId: "b1", charIndex: 5 }, preferredX: null, visible: true, focused: true },
      });
      const ctx: ExecutionContext = { document: doc, interactionState: state };
      const controller = makeMockController();

      const result = executor.execute({ type: "SPLIT_PARAGRAPH" }, ctx, controller);

      expect(result.success).toBe(true);
      expect(result.newCaretPosition).not.toBeNull();
      expect(result.newCaretPosition!.charIndex).toBe(0);
      // Block should be different from original
      expect(result.newCaretPosition!.blockId).not.toBe("b1");
      expect(result.lastCommand).toBe("SPLIT_PARAGRAPH");
    });
  });

  describe("UNDO / REDO", () => {
    it("undo returns success but no caret position from executor alone", () => {
      const executor = new CommandExecutor();
      const doc = makeDoc([para("b1", "Hello")]);
      const state = makeInteractionState();
      const ctx: ExecutionContext = { document: doc, interactionState: state };
      const controller = makeMockController();

      const result = executor.execute({ type: "UNDO" }, ctx, controller);

      // Mock controller always returns success for undo/redo
      expect(result.success).toBe(true);
      expect(result.newCaretPosition).toBeNull();
      expect(result.lastCommand).toBe("UNDO");
    });
  });

  describe("DELETE_SELECTION", () => {
    it("deletes selected text within single block", () => {
      const executor = new CommandExecutor();
      const doc = makeDoc([para("b1", "Hello World")]);
      const state = makeInteractionState({
        caret: { position: { pageId: "p1", blockId: "b1", charIndex: 11 }, preferredX: null, visible: true, focused: true },
        selection: {
          anchor: { pageId: "p1", blockId: "b1", charIndex: 6 },
          focus: { pageId: "p1", blockId: "b1", charIndex: 11 },
        },
      });
      const ctx: ExecutionContext = { document: doc, interactionState: state };
      const controller = makeMockController();

      const result = executor.execute({ type: "DELETE_SELECTION" }, ctx, controller);

      expect(result.success).toBe(true);
      expect(result.lastCommand).toBe("DELETE_SELECTION");
    });
  });
});
