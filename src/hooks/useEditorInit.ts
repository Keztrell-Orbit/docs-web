import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { PageBreak } from "../extensions/PageBreak";
import { db } from "../db";

function stripPageBreaks(html: string): string {
  return html.replace(/<div data-page-break[^>]*><\/div>/g, "");
}

export function useEditorInit() {
  const editor = useEditor({
    extensions: [StarterKit, PageBreak],
    content: "",
    onUpdate: ({ editor }) => {
      const html = stripPageBreaks(editor.getHTML());
      db.documents.update("doc-default", {
        content: html,
        updatedAt: Date.now(),
      });
    },
  });

  return editor;
}
