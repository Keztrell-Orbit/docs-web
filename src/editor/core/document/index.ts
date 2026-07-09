export { DocumentProvider, useDocumentContext, createInitialDocumentState } from "./DocumentContext.tsx";
export type { DocumentState, DocumentAction } from "./DocumentContext.tsx";
export { DocumentController } from "./DocumentController.ts";
export { DocumentControllerProvider, useDocumentController } from "./DocumentControllerContext.tsx";
export { TransactionBuilder } from "./transaction/TransactionBuilder.ts";
export { TransactionExecutor } from "./transaction/TransactionExecutor.ts";
export { TransactionHistory } from "./transaction/TransactionHistory.ts";
export { TransactionEventBus } from "./transaction/TransactionEventBus.ts";
export { TransactionDebugger } from "./debug/TransactionDebugger.tsx";
export { validateDocument } from "./validation/DocumentValidator.ts";
export { validateTransaction } from "./transaction/TransactionValidator.ts";

export {
  InsertTextOperation,
  DeleteTextOperation,
  ReplaceTextOperation,
  SplitParagraphOperation,
  MergeParagraphOperation,
  InsertBlockOperation,
  DeleteBlockOperation,
  MoveBlockOperation,
  DuplicateBlockOperation,
  InsertImageOperation,
  InsertTableOperation,
  ChangeBlockTypeOperation,
  SetBlockStyleOperation,
  SetInlineStyleOperation,
  CompositeOperation,
} from "./operations/index.ts";
export type { DocumentOperation } from "./operations/DocumentOperation.ts";
export type { Transaction } from "./transaction/Transaction.ts";
export type { ExecutionResult, CommittedTransaction, ValidationError, InvalidationScope } from "../types.ts";
