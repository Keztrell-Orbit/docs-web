export { InteractionEngine } from "./core/InteractionEngine.ts";
export { InteractionProvider, useInteractionContext } from "./core/InteractionContext.tsx";
export { InteractionDispatcher } from "./core/InteractionDispatcher.ts";
export { interactionReducer, createInitialInteractionState } from "./core/interactionReducer.ts";
export { TextLayoutService } from "./services/TextLayoutService.ts";
export { HitTestEngine } from "./hit-testing/HitTestEngine.ts";
export { NavigationEngine } from "./navigation/NavigationEngine.ts";
export { CaretOverlay } from "./caret/CaretOverlay.tsx";
export { useCaretBlink } from "./caret/CaretBlink.ts";
export { CaretController } from "./caret/CaretController.ts";
export { SelectionModel } from "./selection/SelectionModel.ts";
export { SelectionController } from "./selection/SelectionController.ts";
export { SelectionOverlay } from "./selection/SelectionOverlay.tsx";
export { PageOverlayContainer } from "./overlay/PageOverlayContainer.tsx";
export { InteractionDebugger } from "./debug/InteractionDebugger.tsx";
export { InteractiveWorkspace } from "./components/InteractiveWorkspace.tsx";
export { InteractivePage } from "./components/InteractivePage.tsx";

export type {
  InteractionState,
  InteractionAction,
  CharacterPosition,
  CaretState,
  SelectionState,
  PointerState,
  HoverState,
  HitTestResult,
  TextLayout,
  LineLayout,
  CharacterBox,
  WordBoundary,
} from "./types.ts";
