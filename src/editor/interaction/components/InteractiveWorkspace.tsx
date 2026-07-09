import { useRef, useCallback, useEffect, useState } from "react";
import { InteractionProvider, useInteractionContext } from "../core/InteractionContext.tsx";
import type { LayoutTree } from "../../../layout/types.ts";
import type { DomBlockMeasurement } from "../../../renderer/hooks/useDomMeasurements.ts";
import type { TextLayoutRegistry } from "../../core/layout/TextLayoutRegistry.ts";
import { InteractivePage } from "./InteractivePage.tsx";
import { PageOverlayContainer } from "../overlay/PageOverlayContainer.tsx";
import { useDocumentController } from "../../core/document/DocumentControllerContext.tsx";
import { useDocumentContext } from "../../core/document/DocumentContext.tsx";
import { EditingService } from "../../core/editing/EditingService.ts";

interface InteractiveWorkspaceProps {
  tree: LayoutTree;
  textLayoutRegistry: TextLayoutRegistry;
  debugLayout?: boolean;
  domMeasurements?: DomBlockMeasurement[];
  debugInteraction?: boolean;
}

export function InteractiveWorkspace({
  tree,
  textLayoutRegistry,
  debugLayout,
  domMeasurements,
  debugInteraction = false,
}: InteractiveWorkspaceProps) {
  return (
    <InteractionProvider layoutTree={tree} textLayoutRegistry={textLayoutRegistry}>
      <WorkspaceContent
        tree={tree}
        textLayoutRegistry={textLayoutRegistry}
        debugLayout={debugLayout}
        domMeasurements={domMeasurements}
        debugInteraction={debugInteraction}
      />
    </InteractionProvider>
  );
}

function WorkspaceContent({
  tree,
  debugLayout,
  domMeasurements,
  debugInteraction,
}: InteractiveWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { engine, inputEngine, state: interactionState, dispatch: dispatchInteraction, textLayoutRegistry } = useInteractionContext();
  const { controller } = useDocumentController();

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    engine.dispatcher.handleKeyDown(e);
    inputEngine.handleEvent(e.nativeEvent);
  }, [engine.dispatcher, inputEngine]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    engine.dispatcher.handleKeyUp(e);
    inputEngine.handleEvent(e.nativeEvent);
  }, [engine.dispatcher, inputEngine]);

  const handleBeforeInput = useCallback((e: React.FormEvent) => {
    const native = e.nativeEvent as InputEvent;
    if (native.inputType === "insertCompositionText") return;
    inputEngine.handleEvent(native);
  }, [inputEngine]);

  const handleCompositionStart = useCallback((e: React.CompositionEvent) => {
    inputEngine.handleEvent(e.nativeEvent);
  }, [inputEngine]);

  const handleCompositionUpdate = useCallback((e: React.CompositionEvent) => {
    inputEngine.handleEvent(e.nativeEvent);
  }, [inputEngine]);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent) => {
    inputEngine.handleEvent(e.nativeEvent);
  }, [inputEngine]);

  const handleCopy = useCallback((e: React.ClipboardEvent) => {
    inputEngine.handleEvent(e.nativeEvent);
  }, [inputEngine]);

  const handleCut = useCallback((e: React.ClipboardEvent) => {
    inputEngine.handleEvent(e.nativeEvent);
  }, [inputEngine]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    inputEngine.handleEvent(e.nativeEvent);
  }, [inputEngine]);

  const { state: docState } = useDocumentContext();
  const editingServiceRef = useRef<EditingService | null>(null);
  const [lastCommand, setLastCommand] = useState("");

  useEffect(() => {
    const service = new EditingService({
      inputDispatcher: inputEngine.dispatcher,
      controller,
      getInteractionState: () => interactionState,
      getDocument: () => docState.document,
      dispatchInteraction,
      onCommand: (cmd: string) => setLastCommand(cmd),
      textLayoutRegistry,
    });
    service.start();
    editingServiceRef.current = service;

    return () => {
      service.destroy();
      editingServiceRef.current = null;
    };
  }, [inputEngine.dispatcher, controller, dispatchInteraction, docState.document, textLayoutRegistry]);

  return (
    <>
      <div
        ref={containerRef}
        className="w-screen h-screen bg-[#e1e3e5] overflow-y-auto"
        tabIndex={0}
        onPointerDown={(e) => engine.dispatcher.handlePointerDown(e)}
        onPointerMove={(e) => engine.dispatcher.handlePointerMove(e)}
        onPointerUp={(e) => engine.dispatcher.handlePointerUp(e)}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBeforeInput={handleBeforeInput}
        onCompositionStart={handleCompositionStart}
        onCompositionUpdate={handleCompositionUpdate}
        onCompositionEnd={handleCompositionEnd}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        style={{ outline: "none" }}
      >
        <div className="flex flex-col items-center gap-8 py-8">
          {tree.pages.map((page) => (
            <InteractivePage
              key={page.id}
              page={page}
              debugLayout={debugLayout}
              domMeasurements={domMeasurements}
            />
          ))}
        </div>
      </div>
      <PageOverlayContainer debugInteraction={debugInteraction} lastCommand={lastCommand} />
    </>
  );
}
