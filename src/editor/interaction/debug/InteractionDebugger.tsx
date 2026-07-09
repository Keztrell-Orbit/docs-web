import { useMemo } from "react";
import { useInteractionContext } from "../core/InteractionContext.tsx";
import { SelectionModel } from "../selection/SelectionModel.ts";
import { characterAddress } from "../../core/coordinates/CoordinateTypes.ts";
import type { CharacterAddress, ViewportPoint } from "../../core/coordinates/CoordinateTypes.ts";

const PANEL_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 8,
  left: 8,
  zIndex: 10000,
  background: "rgba(0,0,0,0.85)",
  color: "#0f0",
  fontFamily: "monospace",
  fontSize: 11,
  padding: "8px 12px",
  borderRadius: 4,
  lineHeight: 1.5,
  maxHeight: "90vh",
  overflowY: "auto",
  minWidth: 280,
  pointerEvents: "auto",
};

const HIGHLIGHT_STYLE: React.CSSProperties = {
  position: "fixed",
  border: "2px solid rgba(255, 0, 0, 0.6)",
  background: "rgba(255, 0, 0, 0.1)",
  pointerEvents: "none",
  zIndex: 9999,
};

interface InteractionDebuggerProps {
  enabled?: boolean;
}

export function InteractionDebugger({ enabled = true }: InteractionDebuggerProps) {
  const { state, engine, mapper, registryVersion } = useInteractionContext();

  const caretViewport = useMemo(() => {
    try {
      const addr = characterAddress(
        state.caret.position.pageId,
        state.caret.position.blockId,
        state.caret.position.charIndex,
      );
      return mapper.documentToViewport(addr);
    } catch {
      return null;
    }
  }, [state.caret.position, mapper, registryVersion]);

  const caretPage = useMemo(() => {
    try {
      return mapper.documentToPage(
        characterAddress(
          state.caret.position.pageId,
          state.caret.position.blockId,
          state.caret.position.charIndex,
        ),
      );
    } catch {
      return null;
    }
  }, [state.caret.position, mapper, registryVersion]);

  const hoverViewport = useMemo<ViewportPoint | null>(() => {
    if (!state.hover.pageId || !state.hover.blockId) return null;
    try {
      const block = engine.getBlock(state.hover.blockId);
      if (!block) return null;
      const page = engine.getPage(state.hover.pageId);
      if (!page) return null;
      const addr = characterAddress(state.hover.pageId, state.hover.blockId, state.hover.charIndex ?? 0);
      return mapper.documentToViewport(addr);
    } catch {
      return null;
    }
  }, [state.hover, engine, mapper, registryVersion]);

  const hoverBlockSize = useMemo(() => {
    if (!state.hover.blockId) return null;
    return mapper.getBlockSize(state.hover.blockId);
  }, [state.hover.blockId, mapper]);

  if (!enabled) return null;

  const collapsed = SelectionModel.isCollapsed(state);
  const range = SelectionModel.getRange(state);
  const selectedText = range && !collapsed
    ? `"${range.start.blockId}" chars ${range.start.charIndex}-${range.end.charIndex}`
    : "none";

  const charInfo = state.caret.position.blockId
    ? `(${caretViewport?.x.toFixed(1) ?? "?"}, ${caretViewport?.y.toFixed(1) ?? "?"})`
    : "—";

  return (
    <>
      <div style={PANEL_STYLE}>
        <div><strong>Interaction Debug</strong></div>
        <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4 }} />
        <div>Page: {state.focusedPageId ?? "—"}</div>
        <div>Block: {state.focusedBlockId ?? "—"}</div>
        <div>Char Index: {state.caret.position.charIndex}</div>
        <div>Caret Viewport: {charInfo}</div>
        <div>Caret Page: {caretPage ? `(${caretPage.x.toFixed(1)}, ${caretPage.y.toFixed(1)})` : "—"}</div>
        <div>Caret Visible: {state.caret.visible ? "yes" : "no"}</div>
        <div>Caret Focused: {state.caret.focused ? "yes" : "no"}</div>
        <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4 }} />
        <div>Selection: {collapsed ? "collapsed" : `${range?.start.charIndex} → ${range?.end.charIndex}`}</div>
        <div>Anchor: {state.selection.anchor ? `${state.selection.anchor.blockId}@${state.selection.anchor.charIndex}` : "—"}</div>
        <div>Focus: {state.selection.focus ? `${state.selection.focus.blockId}@${state.selection.focus.charIndex}` : "—"}</div>
        <div>Selected: {selectedText}</div>
        <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4 }} />
        <div>Hover Page: {state.hover.pageId ?? "—"}</div>
        <div>Hover Block: {state.hover.blockId ?? "—"}</div>
        <div>Hover Line: {state.hover.lineIndex ?? "—"}</div>
        <div>Hover Char: {state.hover.charIndex ?? "—"}</div>
        <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4 }} />
        <div>Mouse: {state.pointer.clientX},{state.pointer.clientY}</div>
        <div>Pointer Down: {state.pointer.isDown ? "yes" : "no"}</div>
        <div>Click Count: {state.pointer.clickCount}</div>
        <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4 }} />
        <div>Keys: {state.pressedKeys.size > 0 ? [...state.pressedKeys].join(", ") : "—"}</div>
      </div>

      {hoverViewport && hoverBlockSize && (
        <div
          style={{
            ...HIGHLIGHT_STYLE,
            left: hoverViewport.x,
            top: hoverViewport.y,
            width: hoverBlockSize.width,
            height: hoverBlockSize.height,
          }}
        />
      )}
    </>
  );
}
