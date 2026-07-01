import { useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { PAGE_DIMENSIONS } from "../types";
import { PAGE_BREAK_HEIGHT } from "../extensions/PageBreak";

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
  pageDimension: keyof typeof PAGE_DIMENSIONS,
  zoomLevel: number
) {
  const isSyncing = useRef(false);

  const syncPageBreaks = useCallback(() => {
    if (!editor || isSyncing.current) return;

    const pageH = parseInt(PAGE_DIMENSIONS[pageDimension].minHeight);
    const contentPadding = 192;
    const contentPerPage = pageH - contentPadding;

    if (contentPerPage <= 0) return;

    const existingBreaks = getBreakPositions(editor);
    const totalBreakHeight = existingBreaks.length * PAGE_BREAK_HEIGHT;
    const scrollHeight = editor.view.dom.scrollHeight;
    const realContentHeight = scrollHeight - totalBreakHeight;
    const pagesNeeded = Math.max(1, Math.ceil(realContentHeight / contentPerPage));
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

  const handleCursorOverflow = useCallback(() => {
    if (!editor || isSyncing.current) return;

    const { selection } = editor.state;
    if (!selection.empty) return;

    const pos = selection.from;
    try {
      const cursorCoords = editor.view.coordsAtPos(pos);
      if (!cursorCoords) return;

      const editorEl = editor.view.dom;
      const editorRect = editorEl.getBoundingClientRect();
      const relativeY = (cursorCoords.bottom - editorRect.top) / (zoomLevel / 100);

      const pageH = parseInt(PAGE_DIMENSIONS[pageDimension].minHeight);
      const contentPadding = 192;
      const contentPerPage = pageH - contentPadding;
      const pageBreakH = PAGE_BREAK_HEIGHT;
      const pageCycle = contentPerPage + pageBreakH;

      const p = Math.floor((relativeY - 96) / pageCycle);
      const yLimit = 96 + p * pageCycle + contentPerPage;

      if (relativeY > yLimit) {
        const $from = selection.$from;
        const nextNode = $from.nodeAfter;

        if (nextNode && nextNode.type.name === "pageBreak") {
          return;
        }

        const isCurrentBlockEmpty = $from.parent.content.size === 0;

        isSyncing.current = true;
        try {
          if (isCurrentBlockEmpty) {
            const posBefore = $from.before();
            editor.chain()
              .insertContentAt(posBefore, { type: "pageBreak" })
              .scrollIntoView()
              .run();
          } else {
            editor.chain()
              .splitBlock()
              .insertContent({ type: "pageBreak" })
              .scrollIntoView()
              .run();
          }
        } finally {
          isSyncing.current = false;
        }
      }
    } catch (e) {
      // Ignore coordsAtPos error when not fully rendered
    }
  }, [editor, pageDimension, zoomLevel]);

  useEffect(() => {
    if (!editor) return;

    const editorEl = editor.view.dom;
    const ro = new ResizeObserver(() => {
      syncPageBreaks();
    });
    ro.observe(editorEl);

    syncPageBreaks();

    const onSelectionOrUpdate = () => {
      handleCursorOverflow();
    };

    editor.on("selectionUpdate", onSelectionOrUpdate);
    editor.on("update", onSelectionOrUpdate);

    return () => {
      ro.disconnect();
      editor.off("selectionUpdate", onSelectionOrUpdate);
      editor.off("update", onSelectionOrUpdate);
    };
  }, [editor, syncPageBreaks, handleCursorOverflow]);
}
