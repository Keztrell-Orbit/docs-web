import { useState, useEffect, useRef } from "react";
import type { InputCommand, NormalizedEvent, CompositionState, ModifierState } from "../InputTypes.ts";
import type { InputEngine } from "../InputEngine.ts";

const PANEL_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 8,
  right: 8,
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
  minWidth: 320,
  pointerEvents: "auto",
};

interface InputDebuggerProps {
  engine: InputEngine;
  enabled?: boolean;
}

interface LogEntry {
  timestamp: number;
  command: InputCommand;
  normalizedEvent: NormalizedEvent | null;
  modifiers: ModifierState;
  composition: CompositionState;
  repeat: boolean;
  inputSource: string;
}

export function InputDebugger({ engine, enabled = true }: InputDebuggerProps) {
  const [log, setLog] = useState<LogEntry[]>([]);
  const logRef = useRef<LogEntry[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const sink = (command: InputCommand) => {
      const entry: LogEntry = {
        timestamp: Date.now(),
        command,
        normalizedEvent: null,
        modifiers: engine.context.modifiers,
        composition: engine.getCompositionState(),
        repeat: false,
        inputSource: "keyboard",
      };
      logRef.current = [entry, ...logRef.current].slice(0, 50);
      setLog([...logRef.current]);
    };

    engine.dispatcher.register(sink);
    return () => {
      engine.dispatcher.unregister(sink);
    };
  }, [engine, enabled]);

  if (!enabled) return null;

  return (
    <div style={PANEL_STYLE}>
      <div style={{ fontWeight: "bold", marginBottom: 4 }}>Input Debug</div>
      <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4, fontSize: 10 }}>
        <div>Platform: {engine.context.platform}</div>
        <div>Composition: {engine.getCompositionState().active ? `active ("${engine.getCompositionState().data}")` : "inactive"}</div>
        <div>Modifiers: {formatModifiers(engine.context.modifiers)}</div>
        <div>Focused: {engine.context.focusedBlockId ?? "—"}</div>
      </div>
      <div style={{ borderTop: "1px solid #333", margin: "4px 0", paddingTop: 4 }} />
      <div style={{ fontSize: 10, maxHeight: 300, overflowY: "auto" }}>
        {log.length === 0 && <div style={{ color: "#666" }}>No commands yet</div>}
        {log.map((entry, i) => (
          <div key={entry.timestamp + "-" + i} style={{ padding: "2px 0", borderBottom: "1px solid #222" }}>
            <span style={{ color: "#8af" }}>{entry.command.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatModifiers(mod: ModifierState): string {
  const parts: string[] = [];
  if (mod.ctrl) parts.push("Ctrl");
  if (mod.meta) parts.push("Meta");
  if (mod.alt) parts.push("Alt");
  if (mod.shift) parts.push("Shift");
  return parts.length ? parts.join("+") : "—";
}
