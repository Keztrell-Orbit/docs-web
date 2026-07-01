import { useMemo } from "react";
import type { OutlineChapter } from "../types";

export function useOutline(html: string | undefined): OutlineChapter[] {
  return useMemo(() => {
    if (!html || typeof window === "undefined") return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headers = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const outline: OutlineChapter[] = [];
    let currentChapter: OutlineChapter | null = null;
    let index = 0;

    headers.forEach((header) => {
      const text = header.textContent?.trim() || "";
      if (!text) return;
      const tagName = header.tagName.toLowerCase();
      const id = `heading-${index++}`;
      if (tagName === "h1" || tagName === "h2") {
        currentChapter = { id, title: text, parts: [] };
        outline.push(currentChapter);
      } else {
        if (!currentChapter) {
          currentChapter = { id: `root-chapter-${index++}`, title: "General", parts: [] };
          outline.push(currentChapter);
        }
        currentChapter.parts?.push({ id, title: text });
      }
    });
    return outline;
  }, [html]);
}
