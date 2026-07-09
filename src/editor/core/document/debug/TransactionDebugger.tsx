import { useInteractionContext } from "../../../interaction/core/InteractionContext.tsx";
import { useDocumentContext } from "../DocumentContext.tsx";
import { useDocumentController } from "../DocumentControllerContext.tsx";

const PANEL_STYLE: React.CSSProperties = {
  position: "fixed",
  bottom: 8,
  left: 8,
  zIndex: 10000,
  background: "rgba(0,0,0,0.85)",
  color: "#0f0",
  fontFamily: "monospace",
  fontSize: 11,
  padding: "8px 12px",
  borderRadius: 4,
  lineHeight: 1.5,
  maxHeight: "40vh",
  overflowY: "auto",
  minWidth: 320,
  pointerEvents: "auto",
};

interface TransactionDebuggerProps {
  enabled?: boolean;
  lastCommand?: string;
}

export function TransactionDebugger({ enabled = true, lastCommand = "" }: TransactionDebuggerProps) {
  const { state: docState } = useDocumentContext();
  const { state: interactionState } = useInteractionContext();
  const { controller } = useDocumentController();

  if (!enabled) return null;

  const lastTx = docState.lastTransaction;
  const blockCount = docState.document.blocks.length;
  const blockIds = docState.document.blocks.map((b: any) => `${b.id.slice(0, 8)} (${b.type})`);

  const undoDepth = controller.history.undoDepth;
  const redoDepth = controller.history.redoDepth;

  const affectedBlocks = lastTx
    ? [...new Set(lastTx.operations.flatMap((op: any) => {
        if (op.blockId) return [op.blockId];
        if (op.operations) return op.operations.flatMap((o: any) => o.blockId ? [o.blockId] : []);
        return [];
      }))]
    : [];

  const docVersion = docState.committedTransactions.length;

  return (
    <div style={PANEL_STYLE}>
      <div><strong>Transaction Debugger</strong></div>
      <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4 }} />

      <div>Doc ID: {docState.document.id}</div>
      <div>Doc Version: {docVersion}</div>
      <div>Blocks: {blockCount}</div>
      <div>Block List: [{blockIds.join(", ")}]</div>

      <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4 }} />
      <div><strong>Last Command</strong></div>
      <div style={{ color: "#ff0" }}>{lastCommand || "—"}</div>

      <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4 }} />
      <div><strong>Last Transaction</strong></div>
      {lastTx ? (
        <>
          <div>ID: {lastTx.id}</div>
          <div>Duration: {lastTx.duration.toFixed(1)}ms</div>
          <div>Valid: {lastTx.valid ? "yes" : "no"}</div>
          <div>Operations ({lastTx.operations.length}):</div>
          {lastTx.operations.map((op: any, i: number) => (
            <div key={i} style={{ paddingLeft: 8, color: "#8f8" }}>
              {i + 1}. {op.describe()}
            </div>
          ))}
          <div>Inverses ({lastTx.inverseOperations.length}):</div>
          {lastTx.inverseOperations.map((op: any, i: number) => (
            <div key={i} style={{ paddingLeft: 8, color: "#f88" }}>
              {i + 1}. {op.describe()}
            </div>
          ))}
        </>
      ) : (
        <div style={{ color: "#888" }}>No transactions yet</div>
      )}

      <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4 }} />
      <div>History Depth: {docState.committedTransactions.length}</div>
      <div>Undo Depth: {undoDepth}</div>
      <div>Redo Depth: {redoDepth}</div>

      {affectedBlocks.length > 0 && (
        <>
          <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4 }} />
          <div><strong>Affected Blocks</strong></div>
          <div>{affectedBlocks.map((id: string) => id.slice(0, 8)).join(", ")}</div>
        </>
      )}

      <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4 }} />
      <div><strong>Selection State</strong></div>
      <div>Focused Page: {interactionState.focusedPageId ?? "—"}</div>
      <div>Focused Block: {interactionState.focusedBlockId ?? "—"}</div>
      <div>Caret: block={interactionState.caret.position.blockId.slice(0, 8)}, char={interactionState.caret.position.charIndex}</div>
    </div>
  );
}
