import { useCallback } from "react";
import type { OutlineChapter } from "../../../types";
import { OutlineTree } from "./OutlineTree";

interface OutlinePanelProps {
  outlineData: OutlineChapter[];
  expandedChapters: Record<string, boolean>;
  setExpandedChapters: (chapters: Record<string, boolean>) => void;
  selectedPartId: string;
  setSelectedPartId: (id: string) => void;
  handleHeadingClick: (title: string) => void;
}

export function OutlinePanel({
  outlineData, expandedChapters, setExpandedChapters,
  selectedPartId, setSelectedPartId, handleHeadingClick,
}: OutlinePanelProps) {
  const toggleChapter = useCallback((id: string) => {
    setExpandedChapters({
      ...expandedChapters,
      [id]: expandedChapters[id] === false ? true : false,
    });
  }, [expandedChapters, setExpandedChapters]);

  return (
    <div className="w-[200px] flex-shrink-0 bg-transparent select-none overflow-y-auto h-full p-2" id="document-tree-view">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E1DFD5]/60" id="tree-view-header">
        <span className="text-[11px] font-mono tracking-wider font-semibold uppercase text-stone-600">Document Outline</span>
        <span className="text-[10px] text-gray-400 font-mono">Interactive</span>
      </div>
      <OutlineTree
        chapters={outlineData}
        expandedChapters={expandedChapters}
        toggleChapter={toggleChapter}
        selectedPartId={selectedPartId}
        setSelectedPartId={setSelectedPartId}
        onHeadingClick={handleHeadingClick}
      />
    </div>
  );
}
