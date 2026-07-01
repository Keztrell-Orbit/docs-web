import { useEffect, useRef, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import type { LexicalNode } from "lexical";
import { $isPageBreakNode, $createPageBreakNode, PAGE_BREAK_HEIGHT } from "../extensions/PageBreak";
import { PAGE_DIMENSIONS } from "../types";

interface AutoPageBreakPluginProps {
  pageDimension: keyof typeof PAGE_DIMENSIONS;
  zoomLevel: number;
}

export function AutoPageBreakPlugin({ pageDimension }: AutoPageBreakPluginProps) {
  const [editor] = useLexicalComposerContext();
  const isSyncing = useRef(false);

  const syncPageBreaks = useCallback(() => {
    if (isSyncing.current) return;

    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const pageH = parseInt(PAGE_DIMENSIONS[pageDimension].minHeight);
    const pageMargin = 96;
    const contentPadding = pageMargin * 2;
    const contentPerPage = pageH - contentPadding;
    if (contentPerPage <= 0) return;

    const existingBreakEls = Array.from(rootEl.children).filter(
      (el) => el.hasAttribute("data-page-break")
    );
    const existingCount = existingBreakEls.length;
    const totalBreakHeight = existingCount * PAGE_BREAK_HEIGHT;
    const scrollHeight = rootEl.scrollHeight;
    const realContentHeight = scrollHeight - totalBreakHeight;
    const pagesNeeded = Math.max(1, Math.ceil(realContentHeight / contentPerPage));
    const breaksNeeded = pagesNeeded - 1;

    if (existingCount === breaksNeeded) return;

    isSyncing.current = true;

    try {
      const positions = precalculateBreakPositions(
        rootEl, breaksNeeded, contentPerPage
      );

      editor.update(() => {
        const children = $getRoot().getChildren();
        const contentNodes: LexicalNode[] = [];
        for (const child of children) {
          if ($isPageBreakNode(child)) {
            child.remove();
          } else {
            contentNodes.push(child);
          }
        }

        for (const idx of positions) {
          if (idx >= 0 && idx < contentNodes.length) {
            contentNodes[idx].insertBefore($createPageBreakNode());
          }
        }
      });
    } finally {
      isSyncing.current = false;
    }
  }, [editor, pageDimension]);

  useEffect(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const ro = new ResizeObserver(() => {
      syncPageBreaks();
    });
    ro.observe(rootEl);

    syncPageBreaks();

    const unregisterUpdate = editor.registerUpdateListener(() => {
      syncPageBreaks();
    });

    return () => {
      ro.disconnect();
      unregisterUpdate();
    };
  }, [editor, syncPageBreaks]);

  return null;
}

function precalculateBreakPositions(
  rootEl: HTMLElement,
  breaksNeeded: number,
  contentPerPage: number
): number[] {
  const allChildren = Array.from(rootEl.children);
  const positions: number[] = [];
  let nextPage = 1;
  let breakCount = 0;
  let contentIndex = -1;

  for (const child of allChildren) {
    if (child.hasAttribute("data-page-break")) {
      breakCount++;
    } else {
      contentIndex++;
      const el = child as HTMLElement;
      const absoluteBottom = el.offsetTop + el.offsetHeight;
      const contentBottom = absoluteBottom - 96 - breakCount * PAGE_BREAK_HEIGHT;

      while (nextPage <= breaksNeeded && contentBottom > nextPage * contentPerPage) {
        positions.push(contentIndex);
        nextPage++;
      }
    }
  }

  return positions;
}
