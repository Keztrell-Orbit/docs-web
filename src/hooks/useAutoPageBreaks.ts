import { useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { PAGE_DIMENSIONS } from "../types";

function getBreakPositions(editor: Editor): number[] {
  const positions: number[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "pageBreak") {
      positions.push(pos);
    }
  });
  return positions;
}

function findInsertionPos(
  editor: Editor,
  pageIndex: number,
  contentPerPage: number
): number | null {
  const editorEl = editor.view.dom;
  const children = Array.from(editorEl.children).filter(
    (el) => !el.hasAttribute("data-page-break")
  );

  let cumHeight = 0;
  for (const child of children) {
    const el = child as HTMLElement;
    cumHeight += el.offsetHeight;

    if (cumHeight > pageIndex * contentPerPage) {
      const domPos = editor.view.posAtDOM(el, 0);
      if (domPos !== null) return domPos;
    }
  }

  return null;
}

export function useAutoPageBreaks(
  editor: Editor | null,
  pageDimension: keyof typeof PAGE_DIMENSIONS
) {
  const isSyncing = useRef(false);

  const syncPageBreaks = useCallback(() => {
    if (!editor || isSyncing.current) return;

    const pageH = parseInt(PAGE_DIMENSIONS[pageDimension].minHeight);
    const contentPadding = 96;
    const contentPerPage = pageH - contentPadding;

    if (contentPerPage <= 0) return;

    const existingBreaks = getBreakPositions(editor);
    const contentHeight = editor.view.dom.scrollHeight;
    const pagesNeeded = Math.max(1, Math.ceil(contentHeight / contentPerPage));
    const breaksNeeded = pagesNeeded - 1;

    if (existingBreaks.length === breaksNeeded) return;

    isSyncing.current = true;

    try {
      if (breaksNeeded > existingBreaks.length) {
        const pageIdx = existingBreaks.length + 1;
        const pos = findInsertionPos(editor, pageIdx, contentPerPage);
        if (pos !== null) {
          const node = editor.state.schema.nodes.pageBreak.create();
          editor.chain().insertContentAt(pos, node).run();
        }
      } else {
        const lastPos = existingBreaks[existingBreaks.length - 1];
        const node = editor.state.doc.nodeAt(lastPos);
        if (node) {
          editor.chain().deleteRange({ from: lastPos, to: lastPos + node.nodeSize }).run();
        }
      }
    } finally {
      isSyncing.current = false;
    }
  }, [editor, pageDimension]);

  useEffect(() => {
    if (!editor) return;

    const editorEl = editor.view.dom;
    const ro = new ResizeObserver(() => {
      syncPageBreaks();
    });
    ro.observe(editorEl);

    syncPageBreaks();

    return () => ro.disconnect();
  }, [editor, syncPageBreaks]);
}
