import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough as StrikethroughIcon,
  TextT,
  Highlighter,
  Sparkle,
  CaretDown,
} from "@phosphor-icons/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
} from "lexical";
import { $patchStyleText } from "@lexical/selection";
import { AIRewritePopup } from "./AIRewritePopup";
import { useClickOutside } from "../../../hooks";
import { TEXT_COLORS, HIGHLIGHT_COLORS, FONT_SIZES, FONT_FAMILIES } from "../formatting.constants";

const CARET_SIZE = 6;
const GAP = 4;

export function FloatingFormatToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showBelow, setShowBelow] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => { console.log("[FloatingToolbar] mounted"); }, []);

  const [activeFormats, setActiveFormats] = useState({
    bold: false, italic: false, underline: false, strike: false,
  });
  const [currentFontFamily, setCurrentFontFamily] = useState("Inter");
  const [currentFontSize, setCurrentFontSize] = useState(14);
  const [, setCurrentColor] = useState<string | null>(null);
  const [, setCurrentHighlight] = useState<string | null>(null);

  const [activePopup, setActivePopup] = useState<"color" | "highlight" | "font-size" | "ai" | null>(null);
  const [isFontSizeEditing, setIsFontSizeEditing] = useState(false);
  const [fontSizeInputValue, setFontSizeInputValue] = useState("14");

  const [colorPickerPos, setColorPickerPos] = useState({ top: 0, left: 0 });
  const [highlightPickerPos, setHighlightPickerPos] = useState({ top: 0, left: 0 });
  const [fontSizeDropdownPos, setFontSizeDropdownPos] = useState({ top: 0, left: 0 });
  const [aiPopupPos, setAiPopupPos] = useState({ top: 0, left: 0 });

  const colorTriggerRef = useRef<HTMLDivElement>(null);
  const highlightTriggerRef = useRef<HTMLDivElement>(null);
  const fontSizeTriggerRef = useRef<HTMLDivElement>(null);
  const fontFamilyTriggerRef = useRef<HTMLDivElement>(null);

  const [isFontFamilyOpen, setIsFontFamilyOpen] = useState(false);
  const [fontFamilyDropdownPos, setFontFamilyDropdownPos] = useState({ top: 0, left: 0 });
  const fontFamilyDropdownRef = useRef<HTMLDivElement>(null);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);

  useClickOutside(fontFamilyDropdownRef, () => setIsFontFamilyOpen(false), [fontFamilyTriggerRef]);
  useClickOutside(fontSizeDropdownRef, () => setActivePopup(null), [fontSizeTriggerRef]);
  useClickOutside(colorPickerRef, () => setActivePopup(null), [colorTriggerRef]);
  useClickOutside(highlightPickerRef, () => setActivePopup(null), [highlightTriggerRef]);

  const [selectedText, setSelectedText] = useState("");

  const isEditingRef = useRef(false);
  const activePopupRef = useRef<"color" | "highlight" | "font-size" | "ai" | null>(null);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    isVisibleRef.current = isVisible;
    isEditingRef.current = isFontSizeEditing;
    activePopupRef.current = activePopup;
  }, [isVisible, isFontSizeEditing, activePopup]);

  useEffect(() => {
    if (!isVisible) {
      setActivePopup(null);
      setIsFontSizeEditing(false);
      activePopupRef.current = null;
      isEditingRef.current = false;
    }
  }, [isVisible]);

  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        setActiveFormats({
          bold: selection.hasFormat("bold"),
          italic: selection.hasFormat("italic"),
          underline: selection.hasFormat("underline"),
          strike: selection.hasFormat("strikethrough"),
        });
        const anchorNode = selection.anchor.getNode();
        const textNode = $isTextNode(anchorNode)
          ? anchorNode
          : anchorNode.getFirstChild();
        if ($isTextNode(textNode)) {
          const style = textNode.getStyle();
          const ffMatch = style.match(/font-family:\s*([^;]+)/);
          if (ffMatch) setCurrentFontFamily(ffMatch[1].trim().replace(/['"]/g, ""));
          const fsMatch = style.match(/font-size:\s*([\d.]+)/);
          if (fsMatch) {
            const parsed = parseFloat(fsMatch[1]);
            if (!isNaN(parsed)) setCurrentFontSize(parsed);
          }
          const colorMatch = style.match(/color:\s*([^;]+)/);
          if (colorMatch) setCurrentColor(colorMatch[1].trim());
          else setCurrentColor(null);
          const bgMatch = style.match(/background-color:\s*([^;]+)/);
          if (bgMatch) setCurrentHighlight(bgMatch[1].trim());
          else setCurrentHighlight(null);
        } else {
          setCurrentColor(null);
          setCurrentHighlight(null);
        }
      });
    });
    return () => unregister();
  }, [editor]);

  useEffect(() => {
    function computePosition() {
      try {
        const root = editor.getRootElement();
        if (!root) return false;
        const domSelection = window.getSelection();
        if (!domSelection || domSelection.rangeCount === 0) return false;
        const anchor = domSelection.anchorNode;
        if (!root.contains(anchor)) return false;
        const range = domSelection.getRangeAt(0);
        if (range.collapsed) return false;
        const rect = range.getBoundingClientRect();
        const toolbarHeight = 32;
        const posLeft = Math.min(rect.left, window.innerWidth - 300);
        if (rect.top > toolbarHeight + CARET_SIZE + GAP + 4) {
          setShowBelow(false);
          setPosition({
            top: rect.top - toolbarHeight - CARET_SIZE - GAP,
            left: posLeft,
          });
        } else {
          setShowBelow(true);
          setPosition({
            top: rect.bottom + GAP + CARET_SIZE,
            left: posLeft,
          });
        }
        return true;
      } catch {
        return false;
      }
    }
    function handleSelectionChange() {
      const hasSelection = computePosition();
      if (hasSelection) {
        if (!isVisibleRef.current) setIsVisible(true);
      } else if (!isEditingRef.current && !activePopupRef.current) {
        if (isVisibleRef.current) setIsVisible(false);
      }
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    window.addEventListener("resize", handleSelectionChange);
    handleSelectionChange();

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("resize", handleSelectionChange);
    };
  }, [editor]);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      if (e.target !== document && e.target !== document.documentElement && e.target !== document.body) return;
      if (isVisibleRef.current) setIsVisible(false);
      setIsFontFamilyOpen(false);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFontFamilyOpen) { setIsFontFamilyOpen(false); return; }
        if (isVisibleRef.current) setIsVisible(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const toggleFormat = useCallback((format: "bold" | "italic" | "underline" | "strikethrough") => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      selection.formatText(format);
    });
  }, [editor]);

  const handleFontFamilyChange = useCallback((family: string) => {
    setCurrentFontFamily(family);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        $patchStyleText(selection, { "font-family": family });
      }
    });
  }, [editor]);

  const applyFontSize = useCallback((size: number) => {
    const clamped = Math.max(8, Math.min(72, Math.round(size)));
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { "font-size": `${clamped}px` });
      }
    });
    setCurrentFontSize(clamped);
    setActivePopup(null);
    setIsFontSizeEditing(false);
    activePopupRef.current = null;
    isEditingRef.current = false;
  }, [editor]);

  const applyColor = useCallback((color: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (color === "") {
        $patchStyleText(selection, { color: null });
      } else {
        $patchStyleText(selection, { color });
      }
    });
    setActivePopup(null);
    activePopupRef.current = null;
  }, [editor]);

  const applyHighlight = useCallback((color: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (color === "") {
        $patchStyleText(selection, { "background-color": null });
      } else {
        $patchStyleText(selection, { "background-color": color });
      }
    });
    setActivePopup(null);
    activePopupRef.current = null;
  }, [editor]);

  const focusEditor = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    editor.focus();
  }, [editor]);

  const togglePopup = useCallback((popup: "color" | "highlight" | "font-size" | "ai") => {
    const next = activePopup === popup ? null : popup;
    setActivePopup(next);
    activePopupRef.current = next;
    if (popup === "ai" && next === "ai") {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          setSelectedText(selection.getTextContent());
        }
      });
    }
  }, [editor, activePopup]);

  useEffect(() => {
    if (activePopup === "color" && colorTriggerRef.current) {
      const rect = colorTriggerRef.current.getBoundingClientRect();
      setColorPickerPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [activePopup]);

  useEffect(() => {
    if (activePopup === "highlight" && highlightTriggerRef.current) {
      const rect = highlightTriggerRef.current.getBoundingClientRect();
      setHighlightPickerPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [activePopup]);

  useEffect(() => {
    if (activePopup === "font-size" && fontSizeTriggerRef.current) {
      const rect = fontSizeTriggerRef.current.getBoundingClientRect();
      setFontSizeDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [activePopup]);

  useEffect(() => {
    if (isFontFamilyOpen && fontFamilyTriggerRef.current) {
      const rect = fontFamilyTriggerRef.current.getBoundingClientRect();
      setFontFamilyDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [isFontFamilyOpen]);

  useEffect(() => {
    if (activePopup === "ai") {
      setAiPopupPos({
        top: position.top + 48,
        left: position.left,
      });
    }
  }, [activePopup, position]);

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              ref={toolbarRef}
              initial={{ opacity: 0, y: showBelow ? -8 : 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: showBelow ? -8 : 8, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.25, bounce: 0.15 }}
              className="flex items-center gap-0.5 px-2 py-1 bg-[#FAF9F5] rounded-none shadow-lg border border-[#E1DFD5]"
              style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 99999 }}
            >
                <div
                  ref={fontFamilyTriggerRef}
                  className="flex items-center cursor-pointer gap-0.5"
                  onClick={() => setIsFontFamilyOpen(!isFontFamilyOpen)}
                >
                  <span className="text-stone-700 text-[11px] font-medium px-0.5 max-w-[65px] truncate">
                    {currentFontFamily === "Playfair Display" ? "Playfair" : currentFontFamily === "JetBrains Mono" ? "JetBrains" : currentFontFamily}
                  </span>
                  <CaretDown size={8} className="text-stone-400" />
                </div>

                <div className="w-px h-4 bg-gray-300 mx-0.5" />

                <div ref={fontSizeTriggerRef} className="flex items-center gap-0.5">
                  {isFontSizeEditing ? (
                    <input
                      type="number"
                      min={8}
                      max={72}
                      value={fontSizeInputValue}
                      onChange={(e) => setFontSizeInputValue(e.target.value)}
                      onBlur={() => {
                        const val = parseInt(fontSizeInputValue, 10);
                        if (!isNaN(val)) applyFontSize(val);
                        setIsFontSizeEditing(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = parseInt(fontSizeInputValue, 10);
                          if (!isNaN(val)) applyFontSize(val);
                          setIsFontSizeEditing(false);
                        }
                        if (e.key === "Escape") {
                          setIsFontSizeEditing(false);
                        }
                      }}
                      onMouseDown={focusEditor}
                      autoFocus
                      className="w-7 text-xs font-semibold text-stone-700 text-center bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    <span
                      className="text-xs font-semibold text-stone-700 min-w-[14px] text-center select-none cursor-pointer"
                      onClick={() => {
                        setFontSizeInputValue(String(currentFontSize));
                        setIsFontSizeEditing(true);
                      }}
                    >
                      {currentFontSize}
                    </span>
                  )}
                  <button
                    onMouseDown={focusEditor}
                    onClick={() => togglePopup("font-size")}
                    className={`p-0.5 rounded ${activePopup === "font-size" ? 'text-stone-700' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    <CaretDown size={10} />
                  </button>
                </div>

                <div className="w-px h-4 bg-gray-300 mx-0.5" />

                <button
                  onMouseDown={focusEditor}
                  onClick={() => toggleFormat("bold")}
                  className={`p-1 rounded transition-colors ${activeFormats.bold ? 'bg-stone-200 text-stone-800' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                  title="Bold"
                >
                  <TextB size={13} />
                </button>
                <button
                  onMouseDown={focusEditor}
                  onClick={() => toggleFormat("italic")}
                  className={`p-1 rounded transition-colors ${activeFormats.italic ? 'bg-stone-200 text-stone-800' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                  title="Italic"
                >
                  <TextItalic size={13} />
                </button>
                <button
                  onMouseDown={focusEditor}
                  onClick={() => toggleFormat("underline")}
                  className={`p-1 rounded transition-colors ${activeFormats.underline ? 'bg-stone-200 text-stone-800' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                  title="Underline"
                >
                  <TextUnderline size={13} />
                </button>
                <button
                  onMouseDown={focusEditor}
                  onClick={() => toggleFormat("strikethrough")}
                  className={`p-1 rounded transition-colors ${activeFormats.strike ? 'bg-stone-200 text-stone-800' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                  title="Strikethrough"
                >
                  <StrikethroughIcon size={13} />
                </button>

                <div className="w-px h-4 bg-gray-300 mx-0.5" />

                <div ref={colorTriggerRef}>
                  <button
                    onMouseDown={focusEditor}
                    onClick={() => togglePopup("color")}
                    className={`p-1 rounded transition-colors ${activePopup === "color" ? 'bg-stone-200 text-stone-800' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                    title="Text Color"
                  >
                    <TextT size={13} />
                  </button>
                </div>

                <div ref={highlightTriggerRef}>
                  <button
                    onMouseDown={focusEditor}
                    onClick={() => togglePopup("highlight")}
                    className={`p-1 rounded transition-colors ${activePopup === "highlight" ? 'bg-stone-200 text-stone-800' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                    title="Highlight Color"
                  >
                    <Highlighter size={13} />
                  </button>
                </div>

                <div className="w-px h-4 bg-gray-300 mx-0.5" />

                <button
                  onMouseDown={focusEditor}
                  onClick={() => togglePopup("ai")}
                  className={`p-1 rounded transition-colors ${activePopup === "ai" ? 'bg-stone-200 text-amber-600' : 'text-amber-600/70 hover:text-amber-600 hover:bg-gray-100'}`}
                  title="AI Rewrite"
                >
                  <Sparkle size={14} />
                </button>

                {!showBelow && (
                  <div className="absolute -bottom-[6px] left-0 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-stone-400" />
                )}
                {showBelow && (
                  <div className="absolute -top-[6px] left-0 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-stone-400" />
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {createPortal(
        <AnimatePresence>
          {activePopup === "font-size" && (
            <motion.div
              ref={fontSizeDropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.6 }}
              className="bg-white border border-[#E1DFD5] rounded-none shadow-lg z-[100] max-h-40 overflow-y-auto w-[36px] py-1"
              style={{ position: 'fixed', top: fontSizeDropdownPos.top, left: fontSizeDropdownPos.left }}
            >
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  onMouseDown={(e) => { e.preventDefault(); editor.focus(); }}
                  onClick={() => applyFontSize(size)}
                  className={`w-full text-center px-0 py-1 text-xs hover:bg-gray-100 transition-colors ${
                    size === currentFontSize
                      ? "bg-gray-100 font-semibold text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  {size}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {activePopup === "color" && (
            <motion.div
              ref={colorPickerRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.6 }}
              className="bg-white border border-[#E1DFD5] rounded-none shadow-lg p-2 z-[100] grid grid-cols-4 gap-1.5 min-w-[152px]"
              style={{ position: 'fixed', top: colorPickerPos.top, left: colorPickerPos.left }}
            >
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onMouseDown={(e) => { e.preventDefault(); editor.focus(); }}
                  onClick={() => applyColor(c.value)}
                  className="w-7 h-7 rounded border border-gray-200 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: c.value || "#ffffff" }}
                  title={c.label}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {activePopup === "highlight" && (
            <motion.div
              ref={highlightPickerRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.6 }}
              className="bg-white border border-[#E1DFD5] rounded-none shadow-lg p-2 z-[100] grid grid-cols-4 gap-1.5 min-w-[152px]"
              style={{ position: 'fixed', top: highlightPickerPos.top, left: highlightPickerPos.left }}
            >
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onMouseDown={(e) => { e.preventDefault(); editor.focus(); }}
                  onClick={() => applyHighlight(c.value)}
                  className="w-7 h-7 rounded border border-gray-200 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: c.value || "#ffffff" }}
                  title={c.label}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {isFontFamilyOpen && (
            <motion.div
              ref={fontFamilyDropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.6 }}
              className="bg-white border border-[#E1DFD5] rounded-none shadow-lg z-[100] py-1 w-[90px]"
              style={{ position: 'fixed', top: fontFamilyDropdownPos.top, left: fontFamilyDropdownPos.left }}
            >
              {FONT_FAMILIES.map((f) => (
                <button
                  key={f}
                  onMouseDown={(e) => { e.preventDefault(); editor.focus(); }}
                  onClick={() => {
                    handleFontFamilyChange(f);
                    setIsFontFamilyOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1 text-xs hover:bg-gray-100 transition-colors ${
                    currentFontFamily === f
                      ? "bg-gray-100 font-semibold text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  {f === "Playfair Display" ? "Playfair (Serif)" : f === "JetBrains Mono" ? "JetBrains Mono" : `${f} (Sans)`}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <AnimatePresence>
        {activePopup === "ai" && (
          <AIRewritePopup
            position={aiPopupPos}
            selectedText={selectedText}
            onClose={() => {
              setActivePopup(null);
              activePopupRef.current = null;
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
