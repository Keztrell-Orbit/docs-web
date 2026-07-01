import { useState, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { motion } from "motion/react";
import { $getRoot } from "lexical";
import { PAGE_DIMENSIONS } from "../../../types";
import { $isPageBreakNode } from "../../../extensions/PageBreak";
import { AutoPageBreakPlugin } from "../../../plugins/AutoPageBreakPlugin";

interface DocumentEditorProps {
  pageDimension: keyof typeof PAGE_DIMENSIONS;
  zoomLevel: number;
  fontFamily: string;
  fontSize: number;
}

function PageBreakCounter({ onPageCount }: { onPageCount: (count: number) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const updateCount = () => {
      editor.getEditorState().read(() => {
        let count = 1;
        const children = $getRoot().getChildren();
        for (const child of children) {
          if ($isPageBreakNode(child)) count++;
        }
        onPageCount(count);
      });
    };
    updateCount();
    const unregister = editor.registerUpdateListener(updateCount);
    return () => unregister();
  }, [editor, onPageCount]);

  return null;
}

export function DocumentEditor({
  pageDimension, zoomLevel, fontFamily, fontSize,
}: DocumentEditorProps) {
  const dim = PAGE_DIMENSIONS[pageDimension];
  const pageH = parseInt(dim.minHeight);
  const [pageCount, setPageCount] = useState(1);

  const pageBreakCount = pageCount - 1;
  const totalPageBgHeight = pageCount * pageH + pageBreakCount * 10;
  const editorMinHeight = Math.max(0, totalPageBgHeight - 192);

  return (
    <div
      className="flex-1 overflow-auto flex flex-col items-start pt-8 pb-8 pl-4 pr-4 md:pt-8 md:pb-8 md:pl-6 md:pr-6 bg-[#F1F0EA] rounded-none border border-transparent min-w-0 h-full scrollbar-thin"
      id="document-column-container"
    >
      <div
        className="flex-shrink-0 relative"
        style={{ width: `calc(${dim.width} * ${zoomLevel / 100})`, marginBottom: "2rem" }}
        id="zoom-scaling-layout-wrapper"
      >
        <motion.div
          style={{ zoom: zoomLevel / 100, width: dim.width }}
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
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: dim.width,
            minHeight: `${editorMinHeight}px`,
            padding: "112px 96px 96px 112px",
            zIndex: 1,
            fontFamily: fontFamily === 'Inter' ? 'var(--font-sans)' : fontFamily === 'Playfair Display' ? 'var(--font-serif)' : fontFamily === 'JetBrains Mono' ? 'var(--font-mono)' : 'sans-serif',
            fontSize: `${fontSize}px`,
            zoom: zoomLevel / 100,
          }}
          id="multi-page-editor-background"
        >
          <div className="w-full prose max-w-none prose-slate" id="lexical-text-editor-container">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="outline-none"
                  id="lexical-editor-input"
                />
              }
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
          </div>
        </motion.div>
      </div>

      <PageBreakCounter onPageCount={setPageCount} />
      <AutoPageBreakPlugin
        pageDimension={pageDimension}
        zoomLevel={zoomLevel}
      />
    </div>
  );
}
