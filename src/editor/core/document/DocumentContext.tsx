import { createContext, useContext, useReducer, useMemo, type ReactNode, type Dispatch } from "react";
import type { Document } from "../types.ts";
import type { CommittedTransaction } from "../types.ts";
import { createSampleDocument } from "../../model.ts";

export interface DocumentState {
  document: Document;
  committedTransactions: CommittedTransaction[];
  lastTransaction: CommittedTransaction | null;
}

export type DocumentAction =
  | { type: "TRANSACTION_COMMITTED"; committed: CommittedTransaction }
  | { type: "DOCUMENT_REPLACED"; document: Document }
  | { type: "RESET" };

function documentReducer(state: DocumentState, action: DocumentAction): DocumentState {
  switch (action.type) {
    case "TRANSACTION_COMMITTED":
      return {
        ...state,
        document: action.committed.documentAfter,
        committedTransactions: [...state.committedTransactions, action.committed],
        lastTransaction: action.committed,
      };
    case "DOCUMENT_REPLACED":
      return {
        ...state,
        document: action.document,
        lastTransaction: null,
      };
    case "RESET":
      return createInitialDocumentState();
    default:
      return state;
  }
}

export function createInitialDocumentState(): DocumentState {
  return {
    document: createSampleDocument(),
    committedTransactions: [],
    lastTransaction: null,
  };
}

interface DocumentContextValue {
  state: DocumentState;
  dispatch: Dispatch<DocumentAction>;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

export function useDocumentContext(): DocumentContextValue {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error("useDocumentContext must be used within a DocumentProvider");
  }
  return ctx;
}

interface DocumentProviderProps {
  children: ReactNode;
  initialDocument?: Document;
}

export function DocumentProvider({ children, initialDocument }: DocumentProviderProps) {
  const [state, dispatch] = useReducer(
    documentReducer,
    initialDocument
      ? { document: initialDocument, committedTransactions: [], lastTransaction: null }
      : createInitialDocumentState(),
  );

  const value = useMemo<DocumentContextValue>(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}
