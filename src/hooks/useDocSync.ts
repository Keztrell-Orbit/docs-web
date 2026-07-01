import { useEffect } from "react";
import type { Editor } from "@tiptap/react";

interface DocData {
  content?: string;
  title?: string;
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
      if (currentDoc.content !== currentHTML) {
        editor.commands.setContent(currentDoc.content || "");
      }
    }
    if (currentDoc.title && !docTitle) {
      setDocTitle(currentDoc.title);
    }
  }, [currentDoc, editor, docTitle, setDocTitle]);
}
