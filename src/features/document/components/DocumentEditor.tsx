import { useState, useEffect } from "react";
import { EditorContent, type Editor } from "@tiptap/react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { PAGE_DIMENSIONS } from "../../../types";

interface DocumentEditorProps {
  editor: Editor | null;
  pageDimension: keyof typeof PAGE_DIMENSIONS;
  zoomLevel: number;
  fontFamily: string;
  fontSize: number;
}

export function DocumentEditor({
  editor, pageDimension, zoomLevel, fontFamily, fontSize,
}: DocumentEditorProps) {
  const dim = PAGE_DIMENSIONS[pageDimension];
  const pageH = parseInt(dim.minHeight);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      let count = 1;
      editor.state.doc.descendants((node) => {
        if (node.type.name === "pageBreak") count++;
      });
      setPageCount(count);
    };
    handler();
    editor.on("update", handler);
    return () => { editor.off("update", handler); };
  }, [editor]);

  const pageBreakCount = pageCount - 1;
  const totalPageBgHeight = pageCount * pageH + pageBreakCount * 10;
  const editorMinHeight = Math.max(0, totalPageBgHeight - 192);

  return (
    <div
      className="flex-1 overflow-auto flex flex-col items-center pt-8 pb-8 pl-4 pr-4 md:pt-8 md:pb-8 md:pl-6 md:pr-6 bg-[#F1F0EA] rounded-none border border-transparent min-w-0 h-full scrollbar-thin"
      id="document-column-container"
    >
      <motion.div
        className="flex-shrink-0 ml-0 relative"
        style={{
          marginBottom: "2rem",
        }}
        animate={{
          width: `calc(${dim.width} * ${zoomLevel / 100})`,
        }}
        transition={{
          type: "spring",
          stiffness: 180,
          damping: 25,
        }}
        id="zoom-scaling-layout-wrapper"
      >
        <motion.div
          animate={{
            scale: zoomLevel / 100,
          }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 25,
          }}
          style={{
            transformOrigin: "top left",
            width: dim.width,
          }}
        >
          {Array.from({ length: pageCount }).map((_, i) => (
            <div
              key={i}
              style={{
                width: dim.width,
                height: dim.minHeight,
                background: "white",
                marginBottom: i < pageCount - 1 ? "10px" : "0",
                boxShadow:
                  i < pageCount - 1
                    ? "0 1px 3px rgba(0,0,0,0.08)"
                    : "0 8px 24px -8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.08)",
                border: "1px solid #E5E4E0",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  bottom: "20px",
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: "11px",
                  color: "#9CA3AF",
                  fontFamily: "var(--font-sans)",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              >
                {i + 1}
              </span>
            </div>
          ))}
        </motion.div>

        <motion.div
          animate={{
            scale: zoomLevel / 100,
          }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 25,
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: dim.width,
            minHeight: `${editorMinHeight}px`,
            padding: "96px",
            zIndex: 1,
            fontFamily: fontFamily === 'Inter' ? 'var(--font-sans)' : fontFamily === 'Playfair Display' ? 'var(--font-serif)' : fontFamily === 'JetBrains Mono' ? 'var(--font-mono)' : 'sans-serif',
            fontSize: `${fontSize}px`,
            transformOrigin: "top left",
          }}
          id="multi-page-editor-background"
        >
          <div className="w-full prose max-w-none prose-slate" id="tiptap-text-editor-container">
            {editor ? (
              <EditorContent editor={editor} className="outline-none" />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400" id="editor-loading-placeholder">
                <Loader2 className="animate-spin text-gray-300 mb-2" size={32} />
                <p className="text-sm font-mono tracking-wider">Mounting ProseMirror...</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
