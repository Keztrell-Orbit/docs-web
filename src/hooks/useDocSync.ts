import { useEffect } from "react";
import type { Editor } from "@tiptap/react";

interface DocData {
  content?: string;
  title?: string;
}

function stripPageBreaks(html: string): string {
  return html.replace(/<div data-page-break[^>]*><\/div>/g, "");
}

export function useDocSync(
  editor: Editor | null,
  currentDoc: DocData | undefined,
  docTitle: string | undefined,
  setDocTitle: (title: string) => void
) {
  useEffect(() => {
    if (!currentDoc) return;
    if (editor) {
      const currentHTML = editor.getHTML();
      const currentClean = stripPageBreaks(currentHTML);
      const cleanContent = stripPageBreaks(currentDoc.content || "");
      if (cleanContent !== currentClean) {
        editor.commands.setContent(cleanContent);
      }
    }
    if (currentDoc.title && !docTitle) {
      setDocTitle(currentDoc.title);
    }
  }, [currentDoc, editor, docTitle, setDocTitle]);
}
