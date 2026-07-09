import { useMemo, useEffect } from "react";
import type { LayoutTree } from "../../../layout/types.ts";
import type { TextLayoutRegistry } from "../../core/layout/TextLayoutRegistry.ts";
import type { InteractionState } from "../types.ts";
import { InteractionEngine } from "../core/InteractionEngine.ts";

export function useInteractionEngine(
  layoutTree: LayoutTree,
  textLayoutRegistry: TextLayoutRegistry,
  dispatch: React.Dispatch<import("../types.ts").InteractionAction>,
  getState: () => InteractionState,
): InteractionEngine {
  const engine = useMemo(
    () => new InteractionEngine(layoutTree, textLayoutRegistry, dispatch, getState),
    [layoutTree, textLayoutRegistry, dispatch, getState],
  );

  useEffect(() => {
    engine.updateLayoutTree(layoutTree);
  }, [layoutTree, engine]);

  useEffect(() => {
    return () => {
      engine.destroy();
    };
  }, [engine]);

  return engine;
}
