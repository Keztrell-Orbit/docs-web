import { createContext, useContext, useReducer, useMemo, useCallback, useRef, useLayoutEffect, useState, type ReactNode } from "react";
import type { InteractionState } from "../types.ts";
import type { LayoutTree } from "../../../layout/types.ts";
import type { TextLayoutRegistry } from "../../core/layout/TextLayoutRegistry.ts";
import { interactionReducer, createInitialInteractionState } from "./interactionReducer.ts";
import { InteractionEngine } from "./InteractionEngine.ts";
import { InputEngine } from "../../core/input/InputEngine.ts";
import { PageRegistry, CoordinateMapper } from "../../core/coordinates/index.ts";
import type { CharacterAddress } from "../../core/coordinates/index.ts";

export interface InteractionContextValue {
  state: InteractionState;
  dispatch: React.Dispatch<import("../types.ts").InteractionAction>;
  engine: InteractionEngine;
  inputEngine: InputEngine;
  mapper: CoordinateMapper;
  registryVersion: number;
  registerPage: (pageId: string) => (el: HTMLDivElement | null) => void;
  caretAddress: CharacterAddress;
  textLayoutRegistry: TextLayoutRegistry;
}

const InteractionContext = createContext<InteractionContextValue | null>(null);

export function useInteractionContext(): InteractionContextValue {
  const ctx = useContext(InteractionContext);
  if (!ctx) {
    throw new Error("useInteractionContext must be used within an InteractionProvider");
  }
  return ctx;
}

interface InteractionProviderProps {
  layoutTree: LayoutTree;
  textLayoutRegistry: TextLayoutRegistry;
  children: ReactNode;
}

export function InteractionProvider({ layoutTree, textLayoutRegistry, children }: InteractionProviderProps) {
  const [state, dispatch] = useReducer(interactionReducer, undefined, createInitialInteractionState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const getState = useCallback(() => stateRef.current, []);

  const pageRegistryRef = useRef<PageRegistry>(new PageRegistry());
  const elementRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [registryVersion, setRegistryVersion] = useState(0);

  // Stable engine ref - only created once
  const engineRef = useRef<InteractionEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new InteractionEngine(layoutTree, textLayoutRegistry, dispatch, getState);
  }
  const engine = engineRef.current;

  // Synchronously update tree when layout changes (runs during render, before children render)
  engine.updateLayoutTree(layoutTree);

  const inputEngine = useMemo(
    () => new InputEngine(getState),
    [getState],
  );

  // Mapper references the stable engine ref
  const mapper = useMemo(
    () => new CoordinateMapper(engine, pageRegistryRef.current),
    [engine],
  );

  // Force re-render after layout tree / registry change to ensure fresh coordinates
  const [, forceRender] = useState(0);
  const prevTreeRef = useRef(layoutTree);
  const prevRegistryRef = useRef(textLayoutRegistry);
  useLayoutEffect(() => {
    prevTreeRef.current = layoutTree;
    prevRegistryRef.current = textLayoutRegistry;
    forceRender((v) => v + 1);
  }, [layoutTree, textLayoutRegistry]);

  useLayoutEffect(() => {
    const pageRegistry = pageRegistryRef.current;
    const unsub = pageRegistry.subscribe(() => {
      setRegistryVersion((v) => v + 1);
    });

    const updatePositions = () => {
      const elements = elementRef.current;
      for (const [id, el] of elements) {
        const rect = el.getBoundingClientRect();
        pageRegistry.updatePosition(id, rect.left, rect.top);
      }
    };

    window.addEventListener("scroll", updatePositions, true);
    window.addEventListener("resize", updatePositions);

    return () => {
      unsub();
      window.removeEventListener("scroll", updatePositions, true);
      window.removeEventListener("resize", updatePositions);
    };
  }, []);

  useLayoutEffect(() => {
    engine.setPageRegistry(elementRef.current);
  }, [engine]);

  useLayoutEffect(() => {
    engine.inputEngine = inputEngine;
  }, [engine, inputEngine]);

  const refCallbacks = useRef<Map<string, (el: HTMLDivElement | null) => void>>(new Map());
  const registerPage = useCallback((pageId: string) => {
    let cb = refCallbacks.current.get(pageId);
    if (!cb) {
      cb = (el: HTMLDivElement | null) => {
        const registry = pageRegistryRef.current;
        const elements = elementRef.current;
        if (el) {
          elements.set(pageId, el);
          const rect = el.getBoundingClientRect();
          registry.register(pageId, rect.left, rect.top);
        } else {
          elements.delete(pageId);
          registry.unregister(pageId);
        }
      };
      refCallbacks.current.set(pageId, cb);
    }
    return cb;
  }, []);

  const caretAddress = useMemo<CharacterAddress>(
    () => ({
      __address: "character",
      pageId: state.caret.position.pageId,
      blockId: state.caret.position.blockId,
      charIndex: state.caret.position.charIndex,
    }),
    [state.caret.position.pageId, state.caret.position.blockId, state.caret.position.charIndex],
  );

  const value = useMemo<InteractionContextValue>(
    () => ({
      state,
      dispatch,
      engine,
      inputEngine,
      mapper,
      registryVersion,
      registerPage,
      caretAddress,
      textLayoutRegistry,
    }),
    [state, dispatch, engine, inputEngine, mapper, registryVersion, registerPage, caretAddress, textLayoutRegistry],
  );

  return (
    <InteractionContext.Provider value={value}>
      {children}
    </InteractionContext.Provider>
  );
}
