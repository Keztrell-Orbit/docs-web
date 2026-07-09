import { createContext, useContext, useMemo, useRef, useCallback, type ReactNode } from "react";
import { useDocumentContext } from "./DocumentContext.tsx";
import { DocumentController } from "./DocumentController.ts";

export interface DocumentControllerContextValue {
  controller: DocumentController;
}

const DocumentControllerContext = createContext<DocumentControllerContextValue | null>(null);

export function useDocumentController(): DocumentControllerContextValue {
  const ctx = useContext(DocumentControllerContext);
  if (!ctx) {
    throw new Error("useDocumentController must be used within a DocumentControllerProvider");
  }
  return ctx;
}

interface DocumentControllerProviderProps {
  children: ReactNode;
}

export function DocumentControllerProvider({ children }: DocumentControllerProviderProps) {
  const { state, dispatch } = useDocumentContext();
  const stateRef = useRef(state);
  stateRef.current = state;

  const getDocument = useCallback(() => stateRef.current.document, []);

  const controller = useMemo(
    () => new DocumentController(dispatch, getDocument),
    [dispatch, getDocument],
  );

  const value = useMemo<DocumentControllerContextValue>(
    () => ({ controller }),
    [controller],
  );

  return (
    <DocumentControllerContext.Provider value={value}>
      {children}
    </DocumentControllerContext.Provider>
  );
}
