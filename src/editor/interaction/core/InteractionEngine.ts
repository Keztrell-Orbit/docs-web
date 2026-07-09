import type { LayoutTree, LayoutPage, LayoutBlock } from "../../../layout/types.ts";
import type { TextLayout } from "../types.ts";
import type { LayoutState } from "../../core/coordinates/LayoutState.ts";
import type { TextLayoutRegistry } from "../../core/layout/TextLayoutRegistry.ts";
import { TextLayoutService } from "../services/TextLayoutService.ts";
import { HitTestEngine } from "../hit-testing/HitTestEngine.ts";
import { NavigationEngine } from "../navigation/NavigationEngine.ts";
import { InteractionDispatcher } from "./InteractionDispatcher.ts";
import type { InputEngine } from "../../core/input/InputEngine.ts";

export class InteractionEngine implements LayoutState {
  textLayoutService: TextLayoutService;
  hitTestEngine: HitTestEngine;
  navigationEngine: NavigationEngine;
  dispatcher: InteractionDispatcher;
  inputEngine?: InputEngine;

  #textLayoutRegistry: TextLayoutRegistry;
  #layoutTree: LayoutTree;

  constructor(
    layoutTree: LayoutTree,
    textLayoutRegistry: TextLayoutRegistry,
    dispatch: React.Dispatch<import("../types.ts").InteractionAction>,
    getState: () => import("../types.ts").InteractionState,
  ) {
    this.#layoutTree = layoutTree;
    this.#textLayoutRegistry = textLayoutRegistry;
    this.textLayoutService = new TextLayoutService();
    this.hitTestEngine = new HitTestEngine(
      layoutTree,
      this.textLayoutService,
      textLayoutRegistry,
      new Map(),
    );
    this.navigationEngine = new NavigationEngine(
      layoutTree,
      this.textLayoutService,
      textLayoutRegistry,
    );
    this.dispatcher = new InteractionDispatcher(
      dispatch,
      getState,
      this.hitTestEngine,
      this.navigationEngine,
    );
  }

  getPage(pageId: string): LayoutPage | null {
    return this.#layoutTree.pages.find((p) => p.id === pageId) ?? null;
  }

  getBlock(blockId: string): LayoutBlock | null {
    return this.hitTestEngine.getBlockById(blockId);
  }

  getTextLayout(blockId: string): TextLayout {
    return this.#textLayoutRegistry.get(blockId);
  }

  get textLayoutRegistry(): TextLayoutRegistry {
    return this.#textLayoutRegistry;
  }

  updateLayoutTree(tree: LayoutTree): void {
    this.#layoutTree = tree;
    this.hitTestEngine.setLayoutTree(tree);
    this.navigationEngine.setLayoutTree(tree);
  }

  setPageRegistry(registry: Map<string, HTMLDivElement>): void {
    this.hitTestEngine.setPageRegistry(registry);
  }

  destroy(): void {
    this.textLayoutService.clearCache();
  }
}
