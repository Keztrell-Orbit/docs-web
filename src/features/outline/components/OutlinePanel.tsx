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
  outlineData,
  expandedChapters,
  setExpandedChapters,
  selectedPartId,
  setSelectedPartId,
  handleHeadingClick,
}: OutlinePanelProps) {
  const toggleChapter = useCallback(
    (id: string) => {
      setExpandedChapters({
        ...expandedChapters,
        [id]: expandedChapters[id] === false ? true : false,
      });
    },
    [expandedChapters, setExpandedChapters],
  );

  return (
    <div
      className="w-[200px] flex-shrink-0 bg-transparent select-none overflow-y-auto h-full p-2"
      id="document-tree-view"
    >
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
