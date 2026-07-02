import { useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Sparkle } from "@phosphor-icons/react";
import { useClickOutside } from "../../../hooks";

interface AIRewritePopupProps {
  position: { top: number; left: number };
  selectedText: string;
  onClose: () => void;
}

const PRESETS = [
  { label: "Improve Writing" },
  { label: "Make Shorter" },
  { label: "Make Longer" },
];

export function AIRewritePopup({ position, selectedText, onClose }: AIRewritePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useClickOutside(popupRef, onClose);

  return createPortal(
    <motion.div
      ref={popupRef}
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ type: "spring", duration: 0.25, bounce: 0.15 }}
      className="bg-white border border-[#E1DFD5] rounded-none shadow-xl z-[100] p-3 min-w-[260px] max-w-[320px]"
      style={{ position: 'fixed', top: position.top, left: position.left, transform: 'translateX(-50%)' }}
    >
      <div className="text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
        <Sparkle size={14} className="text-amber-500" />
        AI Rewrite
      </div>

      {selectedText && (
        <div className="text-[11px] text-stone-500 mb-2 italic leading-relaxed bg-stone-50 p-1.5 rounded border border-stone-200">
          &ldquo;{selectedText.slice(0, 120)}{selectedText.length > 120 ? "..." : ""}&rdquo;
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {}}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-50 border border-stone-200 rounded-none transition-colors"
          >
            <Sparkle size={12} className="text-amber-500" />
            {preset.label}
          </button>
        ))}
      </div>

      <div className="border-t border-stone-200 pt-2">
        <textarea
          placeholder="Custom instruction..."
          className="w-full text-xs text-stone-700 border border-stone-200 rounded-none p-1.5 resize-none h-16 outline-none focus:ring-1 focus:ring-stone-300 bg-stone-50"
        />
        <button
          onClick={() => {}}
          className="mt-1.5 w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-stone-700 rounded-none"
        >
          <Sparkle size={12} />
          Rewrite
        </button>
      </div>
    </motion.div>,
    document.body
  );
}
