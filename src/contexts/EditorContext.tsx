import { useCallback, useEffect, useMemo, useRef } from "react";
import type { LexicalEditor } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { HeadingNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot } from "lexical";
import { ImageNode } from "../extensions/ImageNode";
import { PageBreakNode } from "../extensions/PageBreak";
import { db } from "../db";

interface EditorContextProps {
  children: React.ReactNode;
  initialContent?: string;
  onEditorReady?: (editor: LexicalEditor) => void;
}

function stripPageBreaks(html: string): string {
  return html.replace(/<div data-page-break[^>]*><\/div>/g, "");
}

function EditorContentHandler({
  initialContent,
  onEditorReady,
}: {
  initialContent?: string;
  onEditorReady?: (editor: LexicalEditor) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const loadedRef = useRef(false);

  useEffect(() => {
    (window as any).__lexicalEditor = editor;
    onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!initialContent || loadedRef.current) return;
    loadedRef.current = true;
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialContent, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      root.append(...nodes);
    });
  }, [editor, initialContent]);

  return null;
}

export function EditorProvider({
  children,
  initialContent,
  onEditorReady,
}: EditorContextProps) {
  const handleChange = useCallback((_editorState: any, editor: LexicalEditor) => {
    editor.getEditorState().read(() => {
      const html = $generateHtmlFromNodes(editor, null);
      const clean = stripPageBreaks(html);
      db.documents.update("doc-default", {
        content: clean,
        updatedAt: Date.now(),
      });
    });
  }, []);

  const config = useMemo(() => ({
    namespace: "KreztellDocs",
    nodes: [
      HeadingNode,
      ImageNode,
      LinkNode,
      ListNode,
      ListItemNode,
      PageBreakNode,
    ],
    onError: (error: Error) => {
      console.error("Lexical editor error:", error);
    },
    theme: {
      text: {
        underline: "underline",
        strikethrough: "line-through",
        underlineStrikethrough: "underline line-through",
      },
    },
  }), []);

  return (
    <LexicalComposer initialConfig={config}>
      <EditorContentHandler
        initialContent={initialContent}
        onEditorReady={onEditorReady}
      />
      <OnChangePlugin
        ignoreSelectionChange
        onChange={handleChange}
      />
      <ListPlugin />
      {children}
    </LexicalComposer>
  );
}
