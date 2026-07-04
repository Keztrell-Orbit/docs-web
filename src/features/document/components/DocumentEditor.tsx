import { useState, useCallback } from "react";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { motion } from "motion/react";
import { PAGE_DIMENSIONS } from "../../../types";
import { LayoutPlugin } from "../../../editor/layout-plugin";
import type { LayoutData } from "../../../editor/layout-plugin";
import { PageBackground } from "../../../renderer/page-background";
import { PageBreakIndicator } from "../../../renderer/page-break-indicator";
import { SelectAllPlugin } from "../../../plugins/SelectAllPlugin";
import { FloatingFormatToolbar } from "../../toolbar/components/FloatingFormatToolbar";
import { PendingChangesBar } from "./PendingChangesBar";
import { InlineSkeletonPlugin } from "./InlineSkeletonPlugin";
import type { PageConfig } from "../../../layout/types";

interface DocumentEditorProps {
  pageDimension: keyof typeof PAGE_DIMENSIONS;
  zoomLevel: number;
  fontFamily: string;
  fontSize: number;
  isGenerating?: boolean;
  pendingChanges?: boolean;
  onAcceptChanges?: () => void;
  onRejectChanges?: () => void;
}

const MARGIN = 96;
const GAP = 24;

const PAPER_MAP: Record<keyof typeof PAGE_DIMENSIONS, PageConfig> = {
  A4: { paper: "A4", marginTop: MARGIN, marginBottom: MARGIN, marginLeft: 80, marginRight: 80, pageGap: GAP },
  A5: { paper: "A4", marginTop: MARGIN, marginBottom: MARGIN, marginLeft: 80, marginRight: 80, pageGap: GAP },
  A6: { paper: "A4", marginTop: MARGIN, marginBottom: MARGIN, marginLeft: 80, marginRight: 80, pageGap: GAP },
  Letter: { paper: "Letter", marginTop: MARGIN, marginBottom: MARGIN, marginLeft: 80, marginRight: 80, pageGap: GAP },
};

export function DocumentEditor({
  pageDimension, zoomLevel, fontFamily, fontSize, isGenerating,
  pendingChanges, onAcceptChanges, onRejectChanges,
}: DocumentEditorProps) {
  const dim = PAGE_DIMENSIONS[pageDimension];
  const pageConfig = PAPER_MAP[pageDimension];

  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
  const handleLayoutUpdate = useCallback((data: LayoutData) => {
    setLayoutData(data);
  }, []);

  return (
    <div
      className={`flex-1 overflow-auto flex flex-col items-start pt-8 pb-8 pl-4 pr-4 md:pt-8 md:pb-8 md:pl-6 md:pr-6 bg-[#F1F0EA] rounded-none border border-transparent min-w-0 h-full scrollbar-thin ${pendingChanges && !isGenerating ? "pending-changes" : ""} ${isGenerating ? "is-generating" : ""}`}
      id="document-column-container"
    >
      <div
        className="flex-shrink-0 relative"
        style={{ width: `calc(${dim.width} * ${zoomLevel / 100})`, marginBottom: "2rem" }}
        id="zoom-scaling-layout-wrapper"
      >
        <div
          id="page-backgrounds-container"
          style={{
            zoom: zoomLevel / 100,
            width: dim.width,
            position: "relative",
            pointerEvents: "none",
          }}
        >
          {layoutData && (
            <div
              style={{
                position: "relative",
                width: layoutData.paperWidth,
                height: layoutData.totalHeight,
                pointerEvents: "none",
                userSelect: "none",
                boxSizing: "border-box",
              }}
            >
              {layoutData.pages.map((page) => (
                <PageBackground
                  key={page.pageIndex}
                  pageIndex={page.pageIndex}
                  top={page.top}
                  paperWidth={layoutData.paperWidth}
                  paperHeight={layoutData.paperHeight}
                />
              ))}
              {layoutData.pages.map((page, i) =>
                i < layoutData.pages.length - 1 ? (
                  <PageBreakIndicator
                    key={`break-${page.pageIndex}`}
                    top={page.top + layoutData.paperHeight}
                    width={layoutData.paperWidth}
                  />
                ) : null
              )}
            </div>
          )}
        </div>

        <motion.div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: dim.width,
            minHeight: "100%",
            padding: "96px",
            boxSizing: "border-box",
            fontFamily: fontFamily === 'Inter' ? 'var(--font-sans)' : fontFamily === 'Playfair Display' ? 'var(--font-serif)' : fontFamily === 'JetBrains Mono' ? 'var(--font-mono)' : 'sans-serif',
            fontSize: `${fontSize}px`,
            zoom: zoomLevel / 100,
          }}
          id="multi-page-editor-background"
        >
          <div className="w-full prose max-w-none prose-slate" id="lexical-text-editor-container" onContextMenu={(e) => e.preventDefault()}>
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
            <LinkPlugin />
            <SelectAllPlugin />
            <FloatingFormatToolbar />
            <InlineSkeletonPlugin isGenerating={isGenerating ?? false} />
          </div>
        </motion.div>

        {pendingChanges && !isGenerating && onAcceptChanges && onRejectChanges && (
          <div
            className="absolute z-20"
            style={{
              top: "96px",
              left: "96px",
            }}
          >
            <PendingChangesBar
              onAccept={onAcceptChanges}
              onReject={onRejectChanges}
            />
          </div>
        )}
      </div>

      <LayoutPlugin
        pageConfig={pageConfig}
        zoomLevel={zoomLevel}
        onLayoutUpdate={handleLayoutUpdate}
      />
    </div>
  );
}
