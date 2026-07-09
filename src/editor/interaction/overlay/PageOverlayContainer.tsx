import { useInteractionContext } from "../core/InteractionContext.tsx";
import { SelectionOverlay } from "../selection/SelectionOverlay.tsx";
import { CaretOverlay } from "../caret/CaretOverlay.tsx";
import { InteractionDebugger } from "../debug/InteractionDebugger.tsx";
import { TransactionDebugger } from "../../core/document/debug/TransactionDebugger.tsx";
import { InputDebugger } from "../../core/input/debug/InputDebugger.tsx";
import { CoordinateDebugger } from "../../core/coordinates/CoordinateDebugger.tsx";
import { InsertionPointOverlay } from "../caret/InsertionPointOverlay.tsx";

interface PageOverlayContainerProps {
  debugInteraction?: boolean;
  lastCommand?: string;
}

export function PageOverlayContainer({ debugInteraction = false, lastCommand = "" }: PageOverlayContainerProps) {
  const { state, mapper, engine, registryVersion, caretAddress, inputEngine, textLayoutRegistry } = useInteractionContext();

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 5000 }}>
      <SelectionOverlay state={state} mapper={mapper} layout={engine} registryVersion={registryVersion} />
      <CaretOverlay
        caretAddress={caretAddress}
        mapper={mapper}
        layout={engine}
        registryVersion={registryVersion}
        focused={state.caret.focused}
        visible={state.caret.visible}
      />
      <TransactionDebugger lastCommand={lastCommand} />
      <InsertionPointOverlay
        focusedBlockId={state.focusedBlockId}
        mapper={mapper}
        layout={engine}
        caretAddress={caretAddress}
        enabled={debugInteraction}
      />
      {debugInteraction && <InputDebugger engine={inputEngine} enabled />}
      {debugInteraction && <InteractionDebugger enabled />}
      {debugInteraction && (
        <CoordinateDebugger
          mapper={mapper}
          caretAddress={caretAddress}
          selectionAnchor={state.selection.anchor ? { __address: "character", ...state.selection.anchor } as any : null}
          selectionFocus={state.selection.focus ? { __address: "character", ...state.selection.focus } as any : null}
          textLayoutRegistry={textLayoutRegistry}
          focusedBlockId={state.focusedBlockId}
          enabled
        />
      )}
    </div>
  );
}
