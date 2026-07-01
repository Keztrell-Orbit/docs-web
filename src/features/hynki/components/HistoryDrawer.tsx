import { X, ChevronRight } from "lucide-react";
import type { DocSnapshot } from "../../../types";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DocSnapshot[];
  onRestore: (snapshot: DocSnapshot) => void;
}

export function HistoryDrawer({ isOpen, onClose, versions, onRestore }: HistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="bg-[#FAF9F5]/95 border-b border-[#E1DFD5] p-4 animate-slide-up flex flex-col space-y-3 z-10 max-h-[300px] overflow-y-auto" id="document-history-drawer">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase text-stone-500 tracking-wider">Document Revision History</span>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
          <X size={14} />
        </button>
      </div>
      <p className="text-[11px] text-stone-500 leading-normal">
        Restore specific milestones offline from IndexedDB to experiment with the document structure:
      </p>
      <div className="space-y-1.5">
        {versions.map((v, i) => (
          <button
            key={i}
            onClick={() => onRestore(v)}
            className="w-full text-left text-xs p-2.5 rounded-md bg-white hover:bg-[#F1F0EA] transition-colors flex items-center justify-between border border-[#E1DFD5] hover:border-stone-300 shadow-xs"
          >
            <div className="truncate pr-2">
              <div className="font-medium text-stone-700 truncate">{v.label}</div>
              <div className="text-[10px] text-stone-400 font-mono mt-0.5">{v.timestamp}</div>
            </div>
            <ChevronRight size={14} className="text-stone-400 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
