import type { LayoutPage, LayoutBlock } from "../../../layout/types.ts";
import type { TextLayout } from "../../interaction/types.ts";

export interface LayoutState {
  getPage(pageId: string): LayoutPage | null;
  getBlock(blockId: string): LayoutBlock | null;
  getTextLayout(blockId: string): TextLayout;
}
