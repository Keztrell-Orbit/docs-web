import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { db } from "../db";

export function useEditorInit() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      db.documents.update("doc-default", {
        content: html,
        updatedAt: Date.now(),
      });
    },
  });

  return editor;
}
