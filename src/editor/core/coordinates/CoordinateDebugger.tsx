import { useMemo } from "react";
import type { CoordinateMapper } from "./CoordinateMapper.ts";
import type { CharacterAddress } from "./CoordinateTypes.ts";
import { characterAddress } from "./CoordinateTypes.ts";
import { computeBreakdown } from "./CoordinateAssertions.ts";
import type { TextLayoutRegistry } from "../layout/TextLayoutRegistry.ts";

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

const ROW_STYLE: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
};

const LABEL_STYLE: React.CSSProperties = {
  color: "#888",
};

const VALUE_STYLE: React.CSSProperties = {
  color: "#0f0",
  textAlign: "right",
};

function fmt(v: number): string {
  return v.toFixed(1);
}

interface CoordinateDebuggerRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function CoordinateDebuggerRow({ label, value, highlight }: CoordinateDebuggerRowProps) {
  return (
    <div style={ROW_STYLE}>
      <span style={LABEL_STYLE}>{label}</span>
      <span style={{ ...VALUE_STYLE, color: highlight ? "#ff0" : "#0f0" }}>{value}</span>
    </div>
  );
}

interface CoordinateDebuggerProps {
  mapper: CoordinateMapper;
  caretAddress: CharacterAddress;
  selectionAnchor: CharacterAddress | null;
  selectionFocus: CharacterAddress | null;
  enabled?: boolean;
  textLayoutRegistry?: TextLayoutRegistry;
  focusedBlockId?: string | null;
  documentVersion?: number;
}

export function CoordinateDebugger({
  mapper,
  caretAddress,
  selectionAnchor,
  selectionFocus,
  enabled = true,
  textLayoutRegistry,
  focusedBlockId,
  documentVersion,
}: CoordinateDebuggerProps) {
  const caretBreakdown = useMemo(
    () => computeBreakdown(mapper, caretAddress),
    [mapper, caretAddress],
  );

  const anchorBreakdown = useMemo(
    () => (selectionAnchor ? computeBreakdown(mapper, selectionAnchor) : null),
    [mapper, selectionAnchor],
  );

  const focusBreakdown = useMemo(
    () => (selectionFocus && selectionFocus !== selectionAnchor ? computeBreakdown(mapper, selectionFocus) : null),
    [mapper, selectionFocus],
  );

  const focusedLayoutVersion = useMemo(() => {
    if (!textLayoutRegistry || !focusedBlockId) return null;
    if (!textLayoutRegistry.has(focusedBlockId)) return null;
    try {
      return textLayoutRegistry.get(focusedBlockId).documentVersion;
    } catch {
      return null;
    }
  }, [textLayoutRegistry, focusedBlockId]);

  const focusedCharsMeasured = useMemo(() => {
    if (!textLayoutRegistry || !focusedBlockId) return null;
    if (!textLayoutRegistry.has(focusedBlockId)) return null;
    try {
      const layout = textLayoutRegistry.get(focusedBlockId);
      return layout.lines.reduce((sum, l) => sum + l.chars.length, 0);
    } catch {
      return null;
    }
  }, [textLayoutRegistry, focusedBlockId]);

  if (!enabled) return null;

  const versionMatch = focusedLayoutVersion !== null && documentVersion !== undefined
    ? focusedLayoutVersion === documentVersion
    : null;

  return (
    <div style={PANEL_STYLE}>
      <div style={{ fontWeight: "bold", marginBottom: 4 }}>Coordinate Inspector</div>

      {/* TextLayout Registry */}
      <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4, fontWeight: "bold", color: "#ffa" }}>
        TextLayout Registry
      </div>
      <CoordinateDebuggerRow label="Registered layouts" value={String(textLayoutRegistry?.registeredCount ?? 0)} />
      <CoordinateDebuggerRow label="Registry version" value={String(textLayoutRegistry?.getVersion() ?? 0)} />
      {focusedBlockId && (
        <>
          <CoordinateDebuggerRow label="Focused block" value={focusedBlockId} />
          <CoordinateDebuggerRow
            label="Focused layout exists"
            value={textLayoutRegistry?.has(focusedBlockId) ? "✓" : "✗"}
            highlight={!textLayoutRegistry?.has(focusedBlockId)}
          />
          <CoordinateDebuggerRow
            label="Layout doc version"
            value={focusedLayoutVersion !== null ? String(focusedLayoutVersion) : "—"}
          />
          <CoordinateDebuggerRow
            label="Document version"
            value={documentVersion !== undefined ? String(documentVersion) : "—"}
          />
          <CoordinateDebuggerRow
            label="Version match"
            value={versionMatch === null ? "—" : versionMatch ? "✓" : "✗ MISMATCH"}
            highlight={versionMatch === false}
          />
          <CoordinateDebuggerRow
            label="Chars measured"
            value={focusedCharsMeasured !== null ? String(focusedCharsMeasured) : "—"}
          />
        </>
      )}

      {/* Caret */}
      <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4, fontWeight: "bold", color: "#aaf" }}>
        Caret
      </div>
      <CoordinateDebuggerRow label="Address" value={`${caretBreakdown.address.pageId} / ${caretBreakdown.address.blockId} / char ${caretBreakdown.address.charIndex}`} />
      <CoordinateDebuggerRow label="Character" value={
        caretBreakdown.character
          ? `line ${caretBreakdown.character.lineIndex} @ (${fmt(caretBreakdown.character.x)}, ${fmt(caretBreakdown.character.y)})`
          : caretBreakdown.error ?? "—"
      } />
      <CoordinateDebuggerRow label="Block origin" value={
        caretBreakdown.block
          ? `(${fmt(caretBreakdown.block.x)}, ${fmt(caretBreakdown.block.y)})`
          : "—"
      } />
      <CoordinateDebuggerRow label="Page" value={
        caretBreakdown.page
          ? `(${fmt(caretBreakdown.page.x)}, ${fmt(caretBreakdown.page.y)})`
          : "—"
      } />
      <CoordinateDebuggerRow label="Viewport" value={
        caretBreakdown.viewport
          ? `(${fmt(caretBreakdown.viewport.x)}, ${fmt(caretBreakdown.viewport.y)})`
          : "—"
      } />
      {caretBreakdown.viewportFromDom && (
        <CoordinateDebuggerRow
          label="Rendered"
          value={`left=${fmt(caretBreakdown.viewportFromDom.left)} top=${fmt(caretBreakdown.viewportFromDom.top)}`}
        />
      )}

      {/* Anchor */}
      {anchorBreakdown && (
        <>
          <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4, fontWeight: "bold", color: "#afa" }}>
            Selection Anchor
          </div>
          <CoordinateDebuggerRow label="Address" value={`${anchorBreakdown.address.pageId} / ${anchorBreakdown.address.blockId} / char ${anchorBreakdown.address.charIndex}`} />
          <CoordinateDebuggerRow label="Viewport" value={
            anchorBreakdown.viewport
              ? `(${fmt(anchorBreakdown.viewport.x)}, ${fmt(anchorBreakdown.viewport.y)})`
              : "—"
          } />
        </>
      )}

      {/* Focus */}
      {focusBreakdown && (
        <>
          <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4, fontWeight: "bold", color: "#faa" }}>
            Selection Focus
          </div>
          <CoordinateDebuggerRow label="Address" value={`${focusBreakdown.address.pageId} / ${focusBreakdown.address.blockId} / char ${focusBreakdown.address.charIndex}`} />
          <CoordinateDebuggerRow label="Viewport" value={
            focusBreakdown.viewport
              ? `(${fmt(focusBreakdown.viewport.x)}, ${fmt(focusBreakdown.viewport.y)})`
              : "—"
          } />
        </>
      )}
    </div>
  );
}
