import { EditorContent, type Editor } from "@tiptap/react";
import { Loader2 } from "lucide-react";
import { PAGE_DIMENSIONS } from "../../../types";

interface DocumentEditorProps {
  editor: Editor | null;
  pageDimension: keyof typeof PAGE_DIMENSIONS;
  pageCount: number;
  zoomLevel: number;
  fontFamily: string;
  fontSize: number;
}

export function DocumentEditor({
  editor, pageDimension, pageCount, zoomLevel, fontFamily, fontSize,
}: DocumentEditorProps) {
  const dim = PAGE_DIMENSIONS[pageDimension];

  return (
    <div
      className="flex-1 overflow-auto flex flex-col items-start pt-0 pb-4 pl-4 pr-4 md:pt-0 md:pb-8 md:pl-6 md:pr-6 bg-[#F1F0EA] rounded-none border border-transparent min-w-0 h-full scrollbar-thin"
      id="document-column-container"
    >
      <div
        className="transition-all duration-300 flex-shrink-0 ml-0 relative"
        style={{
          width: `calc(${dim.width} * ${zoomLevel / 100})`,
          marginBottom: "6rem",
        }}
        id="zoom-scaling-layout-wrapper"
      >
        <div
          className="rounded-none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: dim.width,
            minHeight: `${pageCount * parseInt(dim.minHeight)}px`,
            padding: "48px 64px",
            background: "transparent",
            fontFamily: fontFamily === 'Inter' ? 'var(--font-sans)' : fontFamily === 'Playfair Display' ? 'var(--font-serif)' : fontFamily === 'JetBrains Mono' ? 'var(--font-mono)' : 'sans-serif',
            fontSize: `${fontSize}px`,
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top left",
          }}
          id="multi-page-editor-background"
        >
          <div className="w-full prose max-w-none prose-slate" id="tiptap-text-editor-container">
            {editor ? (
              <EditorContent editor={editor} className="outline-none min-h-[400px]" />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400" id="editor-loading-placeholder">
                <Loader2 className="animate-spin text-gray-300 mb-2" size={32} />
                <p className="text-sm font-mono tracking-wider">Mounting ProseMirror...</p>
              </div>
            )}
          </div>
        </div>

        {Array.from({ length: pageCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-none"
            style={{
              width: dim.width,
              height: dim.minHeight,
              overflow: "hidden",
              position: "relative",
              zIndex: 1,
              pointerEvents: "none",
              marginBottom: i < pageCount - 1 ? "2rem" : "0",
              border: "1px solid #E1DFD5",
              boxShadow: "-16px 24px 32px -12px rgba(0,0,0,0.55), -6px 8px 16px -8px rgba(0,0,0,0.35)",
              background: "white",
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top left",
            }}
          />
        ))}
      </div>
    </div>
  );
}
