import type { LayoutTree } from "../../../layout/types.ts";
import type { TextLayout } from "../../interaction/types.ts";
import { TextLayoutService } from "../../interaction/services/TextLayoutService.ts";
import { TextLayoutRegistry } from "./TextLayoutRegistry.ts";

export function computeTextLayouts(
  tree: LayoutTree,
  documentVersion: number,
  service?: TextLayoutService,
): TextLayoutRegistry {
  const textLayoutService = service ?? new TextLayoutService();
  const registry = new TextLayoutRegistry();

  for (const page of tree.pages) {
    for (const block of page.blocks) {
      const text = block.snapshot.text;
      if (!text) continue;

      const fontSize = textLayoutService.getFontSizeForBlock(
        block.snapshot.type,
        "level" in block.snapshot ? (block.snapshot as any).level : undefined,
      );
      const lineHeight = textLayoutService.getLineHeightMultiplier(block.snapshot.type);
      const fontFamily = textLayoutService.getFontFamily();

      const layout = textLayoutService.compute(
        block.blockId,
        text,
        fontSize,
        fontFamily,
        block.width,
        lineHeight,
        documentVersion,
      );

      registry.register(block.blockId, layout);
    }
  }

  return registry;
}
