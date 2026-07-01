import { ChevronDown } from "lucide-react";
import type { OutlineChapter } from "../../../types";

interface OutlineTreeProps {
  chapters: OutlineChapter[];
  expandedChapters: Record<string, boolean>;
  toggleChapter: (id: string) => void;
  selectedPartId: string;
  setSelectedPartId: (id: string) => void;
  onHeadingClick: (title: string) => void;
}

export function OutlineTree({
  chapters, expandedChapters, toggleChapter,
  selectedPartId, setSelectedPartId, onHeadingClick,
}: OutlineTreeProps) {
  if (chapters.length === 0) {
    return (
      <div className="text-[11px] text-gray-400 font-mono text-center py-4">No headings found</div>
    );
  }

  return (
    <div className="space-y-1" id="tree-view-list">
      {chapters.map((chapter) => {
        const isExpanded = expandedChapters[chapter.id] !== false;
        return (
          <div key={chapter.id} className="flex flex-col" id={`tree-chapter-group-${chapter.id}`}>
            <div
              onClick={() => {
                toggleChapter(chapter.id);
                onHeadingClick(chapter.title);
              }}
              className="flex items-center justify-between py-2 px-1.5 rounded-lg hover:bg-[#F1F0EA]/50 cursor-pointer transition-colors group"
              id={`tree-chapter-row-${chapter.id}`}
            >
              <div className="flex items-center min-w-0">
                <span className="w-3.5 h-[1.5px] bg-gray-500 mr-2 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-800 truncate group-hover:text-stone-800 transition-colors">
                  {chapter.title}
                </span>
              </div>
              {chapter.parts && chapter.parts.length > 0 && (
                <ChevronDown
                  size={14}
                  className={`text-gray-400 group-hover:text-gray-600 transition-transform duration-200 flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                />
              )}
            </div>

            {isExpanded && chapter.parts && chapter.parts.length > 0 && (
              <div className="pl-4 mt-0.5 space-y-0.5 border-l border-[#E1DFD5]/60 ml-3" id={`tree-chapter-parts-${chapter.id}`}>
                {chapter.parts.map((part) => {
                  const isSelected = selectedPartId === part.id;
                  return (
                    <div
                      key={part.id}
                      onClick={() => {
                        setSelectedPartId(part.id);
                        onHeadingClick(part.title);
                      }}
                      className={`flex items-center py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#EAE8DD] text-stone-800 font-semibold"
                          : "hover:bg-[#F1F0EA]/30 text-gray-500 hover:text-gray-800"
                      }`}
                      id={`tree-part-row-${part.id}`}
                    >
                      <span className={`w-3.5 h-[1.5px] mr-2 flex-shrink-0 ${isSelected ? "bg-stone-700" : "bg-gray-400"}`} />
                      <span className="text-xs truncate">{part.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
