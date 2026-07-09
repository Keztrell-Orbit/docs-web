import type { Document } from "../../../types.ts";
import type { ValidationError, CommittedTransaction } from "../../types.ts";
import type { Transaction } from "./Transaction.ts";
import { validateDocument } from "../validation/DocumentValidator.ts";

export function validateTransaction(
  transaction: Transaction,
  document: Document,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!transaction.id) {
    errors.push({ code: "MISSING_TX_ID", message: "Transaction has no ID" });
  }

  if (!transaction.operations || transaction.operations.length === 0) {
    errors.push({ code: "EMPTY_TRANSACTION", message: "Transaction has no operations" });
    return errors;
  }

  let currentDoc = document;
  for (let i = 0; i < transaction.operations.length; i++) {
    const op = transaction.operations[i];
    const error = op.validate(currentDoc);
    if (error) {
      errors.push({
        ...error,
        operationId: error.operationId ?? op.id,
        operationType: error.operationType ?? op.type,
      });
      return errors;
    }
    currentDoc = op.apply(currentDoc);
  }

  const docErrors = validateDocument(currentDoc);
  if (docErrors.length > 0) {
    errors.push({
      code: "INVALID_DOCUMENT_STATE",
      message: `Transaction produced invalid document: ${docErrors.map((e) => e.message).join("; ")}`,
    });
  }

  return errors;
}

export function validateUndoRedo(
  committed: CommittedTransaction,
  currentDocument: Document,
): ValidationError[] {
  const errors: ValidationError[] = [];

  const expectedCurrent = committed.documentAfter;
  if (currentDocument !== expectedCurrent) {
    errors.push({
      code: "HISTORY_MISMATCH",
      message: "Current document does not match expected state for undo/redo",
    });
  }

  return errors;
}
