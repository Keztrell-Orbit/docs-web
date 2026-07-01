import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { PAGE_DIMENSIONS } from "../types";

export function usePagination(editor: Editor | null, pageDimension: keyof typeof PAGE_DIMENSIONS) {
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    if (!editor) return;
    const editorEl = editor.view.dom;
    const ro = new ResizeObserver(([entry]) => {
      const contentH = entry.contentRect.height;
      const pageH = parseInt(PAGE_DIMENSIONS[pageDimension].minHeight);
      const paddingTotal = 96;
      setPageCount(Math.max(1, Math.ceil((contentH + paddingTotal) / pageH)));
    });
    ro.observe(editorEl);
    return () => ro.disconnect();
  }, [editor, pageDimension]);

  return pageCount;
}
