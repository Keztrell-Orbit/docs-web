import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  MagnifyingGlass,
  ArrowUUpLeft,
  ArrowUUpRight,
  Printer,
  PaintBrush,
   TextB,
   TextItalic,
   TextUnderline,
   TextStrikethrough as StrikethroughIcon,
   TextAlignLeft,
   TextAlignCenter,
   TextAlignRight,
   TextAlignJustify,
   ListBullets,
   ListNumbers,
   TextT,
   Highlighter,
   Link as LinkIcon,
   Image as ImageIcon,
   CaretDown,
} from "@phosphor-icons/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  $isTextNode,
  UNDO_COMMAND,
  REDO_COMMAND,
  $createParagraphNode,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { $setBlocksType, $patchStyleText } from "@lexical/selection";
import { $findMatchingParent } from "@lexical/utils";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $createImageNode } from "../../../extensions/ImageNode";
import { useClickOutside } from "../../../hooks";

interface FormatToolbarProps {
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  fontFamily: string;
  setFontFamily: (family: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  menuSearchQuery: string;
  setMenuSearchQuery: (query: string) => void;
  isMenubarCollapsed: boolean;
  setIsMenubarCollapsed: (collapsed: boolean) => void;
}

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  bulletList: boolean;
  orderedList: boolean;
  alignment: string | null;
  isLink: boolean;
  textColor: string | null;
  highlightColor: string | null;
  blockType: string;
  fontFamily: string | null;
  fontSize: number | null;
}

const TEXT_COLORS = [
  { label: "Charcoal Slate", value: "#36454F" },
  { label: "Crimson Red", value: "#DC143C" },
  { label: "Forest Green", value: "#228B22" },
  { label: "Navy Blue", value: "#000080" },
  { label: "Royal Purple", value: "#7851A9" },
  { label: "Teal", value: "#008080" },
  { label: "Maroon", value: "#800000" },
  { label: "Olive", value: "#808000" },
  { label: "Steel Blue", value: "#4682B4" },
  { label: "Dark Orange", value: "#FF8C00" },
  { label: "Black", value: "#000000" },
  { label: "Gray", value: "#808080" },
];

const HIGHLIGHT_COLORS = [
  { label: "Amber Yellow", value: "#FFD700" },
  { label: "Soft Pink", value: "#FFB6C1" },
  { label: "Mint Green", value: "#98FB98" },
  { label: "Sky Blue", value: "#87CEEB" },
  { label: "Lavender", value: "#E6E6FA" },
  { label: "Peach", value: "#FFDAB9" },
  { label: "Coral", value: "#FF7F50" },
  { label: "None", value: "" },
];

export function FormatToolbar({
  zoomLevel,
  setZoomLevel,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  menuSearchQuery,
  setMenuSearchQuery,
  isMenubarCollapsed,
  setIsMenubarCollapsed,
}: FormatToolbarProps) {
  const [editor] = useLexicalComposerContext();
  const [active, setActive] = useState<ActiveFormats>({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    bulletList: false,
    orderedList: false,
    alignment: null,
    isLink: false,
    textColor: null,
    highlightColor: null,
    blockType: "p",
    fontFamily: null,
    fontSize: null,
  });
  const [activePicker, setActivePicker] = useState<
    "color" | "highlight" | null
  >(null);

  const colorTriggerRef = useRef<HTMLDivElement>(null);
  const highlightTriggerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);

  useClickOutside(colorPickerRef, () => {
    if (activePicker === "color") setActivePicker(null);
  }, [colorTriggerRef]);
  useClickOutside(highlightPickerRef, () => {
    if (activePicker === "highlight") setActivePicker(null);
  }, [highlightTriggerRef]);

  const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];

  const [isFontSizeDropdownOpen, setIsFontSizeDropdownOpen] = useState(false);
  const [isFontSizeEditing, setIsFontSizeEditing] = useState(false);
  const [fontSizeInputValue, setFontSizeInputValue] = useState("");
  const [fontSizeDropdownPos, setFontSizeDropdownPos] = useState({ top: 0, left: 0 });
  const fontSizeTriggerRef = useRef<HTMLDivElement>(null);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);

  const [isFontFamilyOpen, setIsFontFamilyOpen] = useState(false);
  const [fontFamilyPos, setFontFamilyPos] = useState({ top: 0, left: 0 });
  const fontFamilyTriggerRef = useRef<HTMLDivElement>(null);
  const fontFamilyDropdownRef = useRef<HTMLDivElement>(null);

  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [stylePos, setStylePos] = useState({ top: 0, left: 0 });
  const styleTriggerRef = useRef<HTMLDivElement>(null);
  const styleDropdownRef = useRef<HTMLDivElement>(null);

  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useClickOutside(fontSizeDropdownRef, () => {
    setIsFontSizeDropdownOpen(false);
    setIsFontSizeEditing(false);
  }, [fontSizeTriggerRef]);
  useClickOutside(fontFamilyDropdownRef, () => setIsFontFamilyOpen(false), [fontFamilyTriggerRef]);
  useClickOutside(styleDropdownRef, () => setIsStyleOpen(false), [styleTriggerRef]);

  useEffect(() => {
    if (isFontSizeDropdownOpen && fontSizeTriggerRef.current) {
      const rect = fontSizeTriggerRef.current.getBoundingClientRect();
      setFontSizeDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [isFontSizeDropdownOpen]);

  useEffect(() => {
    if ((activePicker === "color" || activePicker === "highlight") && (activePicker === "color" ? colorTriggerRef.current : highlightTriggerRef.current)) {
      const ref = activePicker === "color" ? colorTriggerRef.current : highlightTriggerRef.current;
      if (ref) {
        const rect = ref.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 4, left: rect.left });
      }
    }
  }, [activePicker]);

  useEffect(() => {
    if (isFontFamilyOpen && fontFamilyTriggerRef.current) {
      const rect = fontFamilyTriggerRef.current.getBoundingClientRect();
      setFontFamilyPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [isFontFamilyOpen]);

  useEffect(() => {
    if (isStyleOpen && styleTriggerRef.current) {
      const rect = styleTriggerRef.current.getBoundingClientRect();
      setStylePos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [isStyleOpen]);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      if (e.target !== document && e.target !== document.documentElement && e.target !== document.body) return;
      if (isFontSizeDropdownOpen) {
        setIsFontSizeDropdownOpen(false);
        setIsFontSizeEditing(false);
      }
      if (isFontFamilyOpen) setIsFontFamilyOpen(false);
      if (isStyleOpen) setIsStyleOpen(false);
      if (activePicker) {
        setActivePicker(null);
      }
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isFontSizeDropdownOpen, isFontFamilyOpen, isStyleOpen, activePicker, setActivePicker]);

  const applyFontSize = useCallback(
    (size: number) => {
      const clamped = Math.max(8, Math.min(72, Math.round(size)));
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, { "font-size": `${clamped}px` });
        }
      });
      setFontSize(clamped);
    },
    [editor, setFontSize],
  );

  useEffect(() => {
    const update = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchorNode = selection.anchor.getNode();

        const block = $findMatchingParent(
          anchorNode,
          (n) => $isElementNode(n) && !n.isInline(),
        );

        let bulletList = false;
        let orderedList = false;
        const listParent = $findMatchingParent(anchorNode, $isListNode);
        if ($isListNode(listParent)) {
          if (listParent.getListType() === "bullet") bulletList = true;
          else orderedList = true;
        }

        let alignment: string | null = null;
        if (block && $isElementNode(block)) {
          const fmt = block.getFormatType();
          if (fmt && fmt !== "start" && fmt !== "end") alignment = fmt;
        }

        let blockType = "p";
        if (block && $isHeadingNode(block)) {
          blockType = block.getTag();
        }

        const linkParent = $findMatchingParent(anchorNode, $isLinkNode);
        const isLink = linkParent !== null;

        const textNode = $isTextNode(anchorNode)
          ? anchorNode
          : anchorNode.getFirstChild();
        let textColor: string | null = null;
        let highlightColor: string | null = null;
        let selFontFamily: string | null = null;
        let selFontSize: number | null = null;
        if ($isTextNode(textNode)) {
          const style = textNode.getStyle();
          const colorMatch = style.match(/color:\s*([^;]+)/);
          if (colorMatch) textColor = colorMatch[1].trim();
          const bgMatch = style.match(/background-color:\s*([^;]+)/);
          if (bgMatch) highlightColor = bgMatch[1].trim();
          const ffMatch = style.match(/font-family:\s*([^;]+)/);
          if (ffMatch) {
            selFontFamily = ffMatch[1].trim().replace(/['"]/g, "");
          }
          const fsMatch = style.match(/font-size:\s*([\d.]+)/);
          if (fsMatch) {
            const parsed = parseFloat(fsMatch[1]);
            if (!isNaN(parsed)) selFontSize = parsed;
          }
        }

        setActive({
          bold: selection.hasFormat("bold"),
          italic: selection.hasFormat("italic"),
          underline: selection.hasFormat("underline"),
          strike: selection.hasFormat("strikethrough"),
          bulletList,
          orderedList,
          alignment,
          isLink,
          textColor,
          highlightColor,
          blockType,
          fontFamily: selFontFamily,
          fontSize: selFontSize,
        });
      });
    };
    const unregister = editor.registerUpdateListener(update);
    return () => unregister();
  }, [editor]);

  const toggleFormat = useCallback(
    (format: "bold" | "italic" | "underline" | "strikethrough") => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        selection.formatText(format);
      });
    },
    [editor],
  );

  const setParagraph = useCallback(() => {
    editor.update(() => {
      $setBlocksType($getSelection(), () => $createParagraphNode());
    });
  }, [editor]);

  const setHeading = useCallback(
    (level: 1 | 2 | 3 | 4 | 5 | 6) => {
      editor.update(() => {
        $setBlocksType($getSelection(), () => $createHeadingNode(`h${level}`));
      });
    },
    [editor],
  );

  const alignText = useCallback(
    (alignment: "left" | "center" | "right" | "justify") => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        const nodes = selection.getNodes();
        const seen = new Set<string>();
        for (const node of nodes) {
          const block = $findMatchingParent(
            node,
            (n) => $isElementNode(n) && !n.isInline(),
          );
          if (block && $isElementNode(block) && !seen.has(block.getKey())) {
            seen.add(block.getKey());
            block.setFormat(alignment);
          }
        }
      });
    },
    [editor],
  );

  const applyColor = useCallback(
    (color: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        if (color === "") {
          $patchStyleText(selection, { color: null });
        } else {
          $patchStyleText(selection, { color });
        }
      });
      setActivePicker(null);
    },
    [editor],
  );

  const applyHighlight = useCallback(
    (color: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        if (color === "") {
          $patchStyleText(selection, { "background-color": null });
        } else {
          $patchStyleText(selection, { "background-color": color });
        }
      });
      setActivePicker(null);
    },
    [editor],
  );

  const insertLink = useCallback(() => {
    if (active.isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      const url = prompt("Insert link address:");
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    }
  }, [editor, active.isLink]);

  const insertImage = useCallback(() => {
    const url = prompt("Enter image URL:");
    if (url) {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        const imageNode = $createImageNode(url, "Image");
        selection.insertNodes([imageNode]);
      });
    }
  }, [editor]);

  const handleFontFamilyChange = useCallback(
    (family: string) => {
      setFontFamily(family);
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          $patchStyleText(selection, { "font-family": family });
        }
      });
    },
    [editor, setFontFamily],
  );

  const handleFontSizeChange = useCallback(
    (delta: number) => {
      let newSize = fontSize;
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        let currentSize = fontSize;
        const anchorNode = selection.anchor.getNode();
        const textNode = $isTextNode(anchorNode)
          ? anchorNode
          : anchorNode.getFirstChild();
        if ($isTextNode(textNode)) {
          const style = textNode.getStyle();
          const match = style.match(/font-size:\s*([\d.]+)/);
          if (match) {
            currentSize = parseFloat(match[1]);
          }
        }

        newSize = Math.max(8, Math.min(72, currentSize + delta));
        $patchStyleText(selection, { "font-size": `${newSize}px` });
      });
      setFontSize(newSize);
    },
    [editor, fontSize, setFontSize],
  );

  const handleStyleChange = useCallback(
    (val: string) => {
      if (val === "p") setParagraph();
      else if (val.startsWith("h")) {
        const level = parseInt(val[1], 10);
        setHeading(level as 1 | 2 | 3 | 4 | 5 | 6);
      }
    },
    [setParagraph, setHeading],
  );

  const displayFontFamily = active.fontFamily || fontFamily;
  const displayFontSize = active.fontSize || fontSize;

  return (
    <div
      className="w-full px-4 pt-0 pb-1.5 md:px-8 md:pt-0 md:pb-2 flex-shrink-0 z-40 flex items-center justify-between gap-2 bg-[#F1F0EA] mt-1.5"
      id="toolbar-floating-wrapper"
    >
      <div
        className="flex-1 bg-[#FAF9F5] border border-[#E1DFD5] rounded-none shadow-md px-4 py-1 flex flex-nowrap items-center gap-1.5 select-none overflow-x-auto scrollbar-none [&>*]:shrink-0 min-w-0"
        id="formatting-toolbar"
      >
        <div className="relative flex items-center bg-[#F1F0EA]/60 border border-[#E1DFD5] hover:border-stone-400 rounded-none px-2.5 py-1 text-stone-600 focus-within:ring-1 focus-within:ring-stone-400 max-w-[120px] transition-all">
          <MagnifyingGlass size={13} className="text-stone-400 mr-1 flex-shrink-0" />
          <input
            type="text"
            placeholder="Menus"
            value={menuSearchQuery}
            onChange={(e) => setMenuSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs focus:outline-none w-full text-gray-700 font-medium placeholder-gray-400"
            title="Search menu commands"
            id="menus-search-input"
          />
        </div>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <button
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
          title="Undo"
          id="toolbar-action-undo"
        >
          <ArrowUUpLeft size={14} />
        </button>
        <button
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
          title="Redo"
          id="toolbar-action-redo"
        >
          <ArrowUUpRight size={14} />
        </button>
        <button
          onClick={() => window.print()}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
          title="Print"
          id="toolbar-action-print"
        >
          <Printer size={14} />
        </button>
        <button
          onClick={() =>
            alert("Format painter active. Click a section to apply styles.")
          }
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
          title="Format Painter"
          id="toolbar-action-paintbrush"
        >
          <PaintBrush size={14} />
        </button>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <div
          className="flex items-center bg-transparent hover:bg-gray-100 rounded px-1 py-0.5"
          title="Scale Zoom level"
        >
          <select
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="bg-transparent text-xs text-gray-700 font-medium border-none outline-none focus:ring-0 cursor-pointer"
            id="toolbar-zoom-dropdown"
          >
            <option value={50}>50%</option>
            <option value={75}>75%</option>
            <option value={100}>100%</option>
            <option value={125}>125%</option>
            <option value={150}>150%</option>
          </select>
        </div>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <div
          ref={styleTriggerRef}
          className="flex items-center bg-transparent hover:bg-gray-100 rounded px-1 py-0.5 cursor-pointer"
          title="Style template"
          onClick={() => setIsStyleOpen(!isStyleOpen)}
        >
          <span className="text-xs text-gray-700 font-medium min-w-[60px]">
            {active.blockType === "p" ? "Normal text" : active.blockType === "h2" ? "Heading 1" : "Heading 2"}
          </span>
          <CaretDown size={10} className="text-gray-400 ml-0.5" />
        </div>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <div
          ref={fontFamilyTriggerRef}
          className="flex items-center bg-transparent hover:bg-gray-100 rounded px-1 py-0.5 cursor-pointer"
          title="Font Family"
          onClick={() => setIsFontFamilyOpen(!isFontFamilyOpen)}
        >
          <span className="text-xs text-gray-700 font-medium min-w-[60px]">
            {displayFontFamily === "Playfair Display" ? "Playfair" : displayFontFamily === "JetBrains Mono" ? "JetBrains" : displayFontFamily}
          </span>
          <CaretDown size={10} className="text-gray-400 ml-0.5" />
        </div>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <div ref={fontSizeTriggerRef}>
          <div
            className="flex items-center bg-gray-100/80 hover:bg-gray-200 rounded px-1 py-0.5 space-x-1"
            title="Font size"
          >
            <button
              onClick={() => handleFontSizeChange(-1)}
              className="px-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
              id="toolbar-fontsize-dec"
            >
              -
            </button>
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
                autoFocus
                className="w-9 text-xs font-semibold text-gray-700 text-center bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            ) : (
              <span
                className="text-xs font-semibold text-gray-700 min-w-[16px] text-center select-none cursor-pointer"
                onClick={() => {
                  setFontSizeInputValue(String(displayFontSize));
                  setIsFontSizeEditing(true);
                  setIsFontSizeDropdownOpen(false);
                }}
              >
                {displayFontSize}
              </span>
            )}
            <button
              onClick={() => handleFontSizeChange(1)}
              className="px-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
              id="toolbar-fontsize-inc"
            >
              +
            </button>
            <button
              onClick={() => {
                setIsFontSizeDropdownOpen(!isFontSizeDropdownOpen);
                setIsFontSizeEditing(false);
              }}
              className="px-0.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <CaretDown size={12} />
            </button>
          </div>
        </div>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <button
          onClick={() => toggleFormat("bold")}
          className={`p-1.5 rounded transition-colors cursor-pointer ${active.bold ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
          title="Bold"
          id="toolbar-style-bold"
        >
          <TextB size={14} />
        </button>
        <button
          onClick={() => toggleFormat("italic")}
          className={`p-1.5 rounded transition-colors cursor-pointer ${active.italic ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
          title="Italic"
          id="toolbar-style-italic"
        >
          <TextItalic size={14} />
        </button>
        <button
          onClick={() => toggleFormat("underline")}
          className={`p-1.5 rounded transition-colors cursor-pointer ${active.underline ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
          title="Underline"
          id="toolbar-style-underline"
        >
          <TextUnderline size={14} />
        </button>
        <button
          onClick={() => toggleFormat("strikethrough")}
          className={`p-1.5 rounded transition-colors cursor-pointer ${active.strike ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
          title="Strikethrough"
          id="toolbar-style-strikethrough"
        >
          <StrikethroughIcon size={14} />
        </button>

        <div ref={colorTriggerRef}>
          <button
            onClick={() =>
              setActivePicker(activePicker === "color" ? null : "color")
            }
            className={`p-1.5 rounded transition-colors cursor-pointer ${active.textColor ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
            title="Text Color"
            id="toolbar-style-color"
          >
            <TextT size={14} />
          </button>
        </div>

        <div ref={highlightTriggerRef}>
          <button
            onClick={() =>
              setActivePicker(activePicker === "highlight" ? null : "highlight")
            }
            className={`p-1.5 rounded transition-colors cursor-pointer ${active.highlightColor ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
            title="Highlight Marker"
            id="toolbar-style-highlight"
          >
            <Highlighter size={14} />
          </button>
        </div>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <button
          onClick={insertLink}
          className={`p-1.5 rounded transition-colors cursor-pointer ${active.isLink ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
          title={active.isLink ? "Remove link" : "Insert link"}
          id="toolbar-action-link"
        >
          <LinkIcon size={14} />
        </button>
        <button
          onClick={insertImage}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
          title="Insert image"
          id="toolbar-action-image"
        >
          <ImageIcon size={14} />
        </button>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <button
          onClick={() => alignText("left")}
          className={`p-1.5 rounded transition-colors cursor-pointer ${active.alignment === "left" ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
          title="Align Left"
          id="toolbar-align-left"
        >
          <TextAlignLeft size={14} />
        </button>
        <button
          onClick={() => alignText("center")}
          className={`p-1.5 rounded transition-colors cursor-pointer ${active.alignment === "center" ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
          title="Align Center"
          id="toolbar-align-center"
        >
          <TextAlignCenter size={14} />
        </button>
        <button
          onClick={() => alignText("right")}
          className={`p-1.5 rounded transition-colors cursor-pointer ${active.alignment === "right" ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
          title="Align Right"
          id="toolbar-align-right"
        >
          <TextAlignRight size={14} />
        </button>
        <button
          onClick={() => alignText("justify")}
          className={`p-1.5 rounded transition-colors cursor-pointer ${active.alignment === "justify" ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
          title="Justify"
          id="toolbar-align-justify"
        >
          <TextAlignJustify size={14} />
        </button>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <button
          onClick={() =>
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
          }
          className={`p-1.5 rounded transition-colors cursor-pointer ${active.bulletList ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
          title="Bulleted List"
          id="toolbar-action-bullet"
        >
          <ListBullets size={14} />
        </button>
        <button
          onClick={() =>
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
          }
          className={`p-1.5 rounded transition-colors cursor-pointer ${active.orderedList ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
          title="Numbered List"
          id="toolbar-action-numbered"
        >
          <ListNumbers size={14} />
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {isFontSizeDropdownOpen && (
            <motion.div
              ref={fontSizeDropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.6 }}
              className="bg-white border border-[#E1DFD5] rounded-none shadow-lg z-[100] max-h-48 overflow-y-auto w-[36px] py-1"
              style={{ position: 'fixed', top: fontSizeDropdownPos.top, left: fontSizeDropdownPos.left }}
            >
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    applyFontSize(size);
                    setIsFontSizeDropdownOpen(false);
                  }}
                  className={`w-full text-center px-0 py-1 text-xs hover:bg-gray-100 transition-colors ${
                    size === displayFontSize
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
          {activePicker === "color" && (
            <motion.div
              ref={colorPickerRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.6 }}
              className="bg-white border border-[#E1DFD5] rounded-none shadow-lg p-2 z-[100] grid grid-cols-4 gap-1.5 min-w-[160px]"
              style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left }}
            >
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
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
          {activePicker === "highlight" && (
            <motion.div
              ref={highlightPickerRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.6 }}
              className="bg-white border border-[#E1DFD5] rounded-none shadow-lg p-2 z-[100] grid grid-cols-4 gap-1.5 min-w-[160px]"
              style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left + 40 }}
            >
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.value}
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
              className="bg-white border border-[#E1DFD5] rounded-none shadow-lg z-[100] py-1 w-[100px]"
              style={{ position: 'fixed', top: fontFamilyPos.top, left: fontFamilyPos.left }}
            >
              {[
                { label: "Inter (Sans)", value: "Inter" },
                { label: "Playfair (Serif)", value: "Playfair Display" },
                { label: "JetBrains Mono", value: "JetBrains Mono" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    handleFontFamilyChange(opt.value);
                    setIsFontFamilyOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1 text-xs hover:bg-gray-100 transition-colors ${
                    displayFontFamily === opt.value
                      ? "bg-gray-100 font-semibold text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {isStyleOpen && (
            <motion.div
              ref={styleDropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.6 }}
              className="bg-white border border-[#E1DFD5] rounded-none shadow-lg z-[100] py-1 w-[80px]"
              style={{ position: 'fixed', top: stylePos.top, left: stylePos.left }}
            >
              {[
                { label: "Normal text", value: "p" },
                { label: "Heading 1", value: "h2" },
                { label: "Heading 2", value: "h3" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    handleStyleChange(opt.value);
                    setIsStyleOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1 text-xs hover:bg-gray-100 transition-colors ${
                    active.blockType === opt.value
                      ? "bg-gray-100 font-semibold text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {isMenubarCollapsed && (
        <button
          onClick={() => setIsMenubarCollapsed(false)}
          className="p-2 rounded-none hover:bg-stone-200 text-stone-600 cursor-pointer flex items-center justify-center transition-all bg-white border border-[#E1DFD5] shadow-md shrink-0 ml-1"
          title="Expand Menubar"
          id="expand-menubar-toolbar-btn"
        >
          <CaretDown size={14} className="animate-bounce" />
        </button>
      )}
    </div>
  );
}
