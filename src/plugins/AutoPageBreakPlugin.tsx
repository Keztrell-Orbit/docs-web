import { useEffect, useRef, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $getSelection, $isRangeSelection } from "lexical";
import { $isPageBreakNode, $createPageBreakNode, PAGE_BREAK_HEIGHT } from "../extensions/PageBreak";
import { PAGE_DIMENSIONS } from "../types";

interface AutoPageBreakPluginProps {
  pageDimension: keyof typeof PAGE_DIMENSIONS;
  zoomLevel: number;
}

export function AutoPageBreakPlugin({ pageDimension, zoomLevel }: AutoPageBreakPluginProps) {
  const [editor] = useLexicalComposerContext();
  const isSyncing = useRef(false);
  const rafId = useRef<number | null>(null);

  const syncPageBreaks = useCallback(() => {
    if (isSyncing.current) return;

    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const pageH = parseInt(PAGE_DIMENSIONS[pageDimension].minHeight);
    const contentPadding = 208;
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
      if (breaksNeeded > existingCount) {
        const pageIdx = existingCount + 1;
        const insertAt = findInsertionPosition(rootEl, pageIdx, contentPerPage);
        if (insertAt !== -1) {
          editor.update(() => {
            const children = $getRoot().getChildren();
            let contentIndex = 0;
            for (let i = 0; i < children.length; i++) {
              if (!$isPageBreakNode(children[i])) {
                if (contentIndex === insertAt) {
                  children[i].insertBefore($createPageBreakNode());
                  break;
                }
                contentIndex++;
              }
            }
          });
        }
      } else {
        editor.update(() => {
          const children = $getRoot().getChildren();
          for (let i = children.length - 1; i >= 0; i--) {
            if ($isPageBreakNode(children[i])) {
              children[i].remove();
              break;
            }
          }
        });
      }
    } finally {
      isSyncing.current = false;
    }
  }, [editor, pageDimension]);

  const handleCursorOverflow = useCallback(() => {
    if (isSyncing.current) return;

    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const domSel = window.getSelection();
    if (!domSel || !domSel.rangeCount) return;
    const range = domSel.getRangeAt(0);
    const cursorRect = range.getBoundingClientRect();
    const editorRect = rootEl.getBoundingClientRect();
    if (cursorRect.width === 0 && cursorRect.height === 0) return;

    const relativeY = (cursorRect.bottom - editorRect.top) / (zoomLevel / 100);

    const pageH = parseInt(PAGE_DIMENSIONS[pageDimension].minHeight);
    const contentPadding = 208;
    const contentPerPage = pageH - contentPadding;
    const pageCycle = contentPerPage + PAGE_BREAK_HEIGHT;

    const p = Math.floor((relativeY - 96) / pageCycle);
    const yLimit = 96 + p * pageCycle + contentPerPage;

    if (relativeY > yLimit) {
      isSyncing.current = true;
      try {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
          const anchorNode = selection.anchor.getNode();
          const block = anchorNode.getTopLevelElement();
          if (!block) return;
          const isCurrentBlockEmpty = block.getTextContent().trim().length === 0;

          if (isCurrentBlockEmpty) {
            const prevSibling = block.getPreviousSibling();
            if (prevSibling && $isPageBreakNode(prevSibling)) {
              return;
            }
            block.insertBefore($createPageBreakNode());
          } else {
            selection.insertParagraph();
            const newAnchor = $getSelection();
            if ($isRangeSelection(newAnchor)) {
              const newBlock = newAnchor.anchor.getNode().getTopLevelElement();
              if (newBlock) {
                newBlock.insertBefore($createPageBreakNode());
              }
            }
          }
        });
      } finally {
        isSyncing.current = false;
      }
    }
  }, [editor, pageDimension, zoomLevel]);

  useEffect(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const ro = new ResizeObserver(() => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(syncPageBreaks);
    });
    ro.observe(rootEl);

    syncPageBreaks();

    const unregisterUpdate = editor.registerUpdateListener(() => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(syncPageBreaks);
    });

    let lastSelectionStr = "";
    const unregisterSelection = editor.registerUpdateListener(({ tags }) => {
      if (tags.has("selection") && !isSyncing.current) {
        const selStr = JSON.stringify(editor.getEditorState().read(() => {
          const sel = $getSelection();
          if (!$isRangeSelection(sel)) return null;
          return { anchor: sel.anchor.key, offset: sel.anchor.offset };
        }));
        if (selStr !== lastSelectionStr) {
          lastSelectionStr = selStr;
          handleCursorOverflow();
        }
      }
    });

    return () => {
      ro.disconnect();
      unregisterUpdate();
      unregisterSelection();
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [editor, syncPageBreaks, handleCursorOverflow]);

  return null;
}

function findInsertionPosition(
  rootEl: HTMLElement,
  pageIndex: number,
  contentPerPage: number
): number {
  const children = Array.from(rootEl.children).filter(
    (el) => !el.hasAttribute("data-page-break")
  );

  let cumHeight = 0;
  for (let i = 0; i < children.length; i++) {
    const el = children[i] as HTMLElement;
    cumHeight += el.offsetHeight;

    if (cumHeight > pageIndex * contentPerPage) {
      return i;
    }
  }

  return -1;
}
