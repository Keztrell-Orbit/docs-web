import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Undo2, Redo2, Printer, Paintbrush, Bold, Italic,
  Underline, Strikethrough as StrikethroughIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Baseline, Highlighter, Link as LinkIcon,
  Image as ImageIcon, ChevronDown,
} from "lucide-react";
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
  zoomLevel, setZoomLevel, fontFamily, setFontFamily,
  fontSize, setFontSize, menuSearchQuery, setMenuSearchQuery,
  isMenubarCollapsed, setIsMenubarCollapsed,
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
  const [activePicker, setActivePicker] = useState<"color" | "highlight" | null>(null);

  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);

  useClickOutside(colorPickerRef, () => {
    if (activePicker === "color") setActivePicker(null);
  });
  useClickOutside(highlightPickerRef, () => {
    if (activePicker === "highlight") setActivePicker(null);
  });

  useEffect(() => {
    const update = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchorNode = selection.anchor.getNode();

        const block = $findMatchingParent(anchorNode, (n) =>
          $isElementNode(n) && !n.isInline()
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

        const textNode = $isTextNode(anchorNode) ? anchorNode : anchorNode.getFirstChild();
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

  const toggleFormat = useCallback((format: "bold" | "italic" | "underline" | "strikethrough") => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      selection.formatText(format);
    });
  }, [editor]);

  const setParagraph = useCallback(() => {
    editor.update(() => {
      $setBlocksType($getSelection(), () => $createParagraphNode());
    });
  }, [editor]);

  const setHeading = useCallback((level: 1 | 2 | 3 | 4 | 5 | 6) => {
    editor.update(() => {
      $setBlocksType($getSelection(), () => $createHeadingNode(`h${level}`));
    });
  }, [editor]);

  const alignText = useCallback((alignment: "left" | "center" | "right" | "justify") => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const nodes = selection.getNodes();
      const seen = new Set<string>();
      for (const node of nodes) {
        const block = $findMatchingParent(node, (n) =>
          $isElementNode(n) && !n.isInline()
        );
        if (block && $isElementNode(block) && !seen.has(block.getKey())) {
          seen.add(block.getKey());
          block.setFormat(alignment);
        }
      }
    });
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
    setActivePicker(null);
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
    setActivePicker(null);
  }, [editor]);

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

  const handleFontFamilyChange = useCallback((family: string) => {
    setFontFamily(family);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        $patchStyleText(selection, { "font-family": family });
      }
    });
  }, [editor, setFontFamily]);

  const handleFontSizeChange = useCallback((delta: number) => {
    let newSize = fontSize;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      let currentSize = fontSize;
      const anchorNode = selection.anchor.getNode();
      const textNode = $isTextNode(anchorNode) ? anchorNode : anchorNode.getFirstChild();
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
  }, [editor, fontSize, setFontSize]);

  const handleStyleChange = useCallback((val: string) => {
    if (val === "p") setParagraph();
    else if (val.startsWith("h")) {
      const level = parseInt(val[1], 10);
      setHeading(level as 1 | 2 | 3 | 4 | 5 | 6);
    }
  }, [setParagraph, setHeading]);

  const displayFontFamily = active.fontFamily || fontFamily;
  const displayFontSize = active.fontSize || fontSize;

  return (
    <div className="w-full px-4 pt-0 pb-1.5 md:px-8 md:pt-0 md:pb-2 flex-shrink-0 z-20 flex items-center justify-between gap-2 bg-[#F1F0EA] mt-1.5" id="toolbar-floating-wrapper">
      <div
        className="flex-1 bg-[#FAF9F5] border border-[#E1DFD5] rounded-lg shadow-md px-4 py-2.5 flex flex-nowrap items-center gap-1.5 select-none overflow-x-auto scrollbar-none [&>*]:shrink-0 min-w-0"
        id="formatting-toolbar"
      >
        <div className="relative flex items-center bg-[#F1F0EA]/60 border border-[#E1DFD5] hover:border-stone-400 rounded-md px-2.5 py-1 text-stone-600 focus-within:ring-1 focus-within:ring-stone-400 max-w-[120px] transition-all">
          <Search size={13} className="text-stone-400 mr-1 flex-shrink-0" />
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

        <button onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer" title="Undo" id="toolbar-action-undo"><Undo2 size={14} /></button>
        <button onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer" title="Redo" id="toolbar-action-redo"><Redo2 size={14} /></button>
        <button onClick={() => window.print()} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer" title="Print" id="toolbar-action-print"><Printer size={14} /></button>
        <button onClick={() => alert("Format painter active. Click a section to apply styles.")} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer" title="Format Painter" id="toolbar-action-paintbrush"><Paintbrush size={14} /></button>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <div className="flex items-center bg-transparent hover:bg-gray-100 rounded px-1 py-0.5" title="Scale Zoom level">
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

        <div className="flex items-center bg-transparent hover:bg-gray-100 rounded px-1 py-0.5" title="Style template">
          <select
            value={active.blockType}
            onChange={(e) => handleStyleChange(e.target.value)}
            className="bg-transparent text-xs text-gray-700 font-medium border-none outline-none focus:ring-0 cursor-pointer"
            id="toolbar-style-dropdown"
          >
            <option value="p">Normal text</option>
            <option value="h2">Heading 1</option>
            <option value="h3">Heading 2</option>
          </select>
        </div>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <div className="flex items-center bg-transparent hover:bg-gray-100 rounded px-1 py-0.5" title="Font Family">
          <select
            value={displayFontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            className="bg-transparent text-xs text-gray-700 font-medium border-none outline-none focus:ring-0 cursor-pointer"
            id="toolbar-font-dropdown"
          >
            <option value="Inter">Inter (Sans)</option>
            <option value="Playfair Display">Playfair (Serif)</option>
            <option value="JetBrains Mono">JetBrains Mono</option>
          </select>
        </div>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <div className="flex items-center bg-gray-100/80 hover:bg-gray-200 rounded px-1 py-0.5 space-x-1" title="Font size">
          <button onClick={() => handleFontSizeChange(-1)} className="px-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors" id="toolbar-fontsize-dec">-</button>
          <span className="text-xs font-semibold text-gray-700 min-w-[16px] text-center select-none">{displayFontSize}</span>
          <button onClick={() => handleFontSizeChange(1)} className="px-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors" id="toolbar-fontsize-inc">+</button>
        </div>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <button onClick={() => toggleFormat("bold")} className={`p-1.5 rounded transition-colors cursor-pointer ${active.bold ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Bold" id="toolbar-style-bold"><Bold size={14} /></button>
        <button onClick={() => toggleFormat("italic")} className={`p-1.5 rounded transition-colors cursor-pointer ${active.italic ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Italic" id="toolbar-style-italic"><Italic size={14} /></button>
        <button onClick={() => toggleFormat("underline")} className={`p-1.5 rounded transition-colors cursor-pointer ${active.underline ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Underline" id="toolbar-style-underline"><Underline size={14} /></button>
        <button onClick={() => toggleFormat("strikethrough")} className={`p-1.5 rounded transition-colors cursor-pointer ${active.strike ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Strikethrough" id="toolbar-style-strikethrough"><StrikethroughIcon size={14} /></button>

        <div className="relative">
          <button onClick={() => setActivePicker(activePicker === "color" ? null : "color")} className={`p-1.5 rounded transition-colors cursor-pointer ${active.textColor ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Text Color" id="toolbar-style-color"><Baseline size={14} /></button>
          {activePicker === "color" && (
            <div ref={colorPickerRef} className="absolute top-full left-0 mt-1 bg-white border border-[#E1DFD5] rounded-lg shadow-lg p-2 z-50 grid grid-cols-4 gap-1.5 min-w-[160px]">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => applyColor(c.value)}
                  className="w-7 h-7 rounded border border-gray-200 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: c.value || "#ffffff" }}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setActivePicker(activePicker === "highlight" ? null : "highlight")} className={`p-1.5 rounded transition-colors cursor-pointer ${active.highlightColor ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Highlight Marker" id="toolbar-style-highlight"><Highlighter size={14} /></button>
          {activePicker === "highlight" && (
            <div ref={highlightPickerRef} className="absolute top-full left-0 mt-1 bg-white border border-[#E1DFD5] rounded-lg shadow-lg p-2 z-50 grid grid-cols-4 gap-1.5 min-w-[160px]">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => applyHighlight(c.value)}
                  className="w-7 h-7 rounded border border-gray-200 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: c.value || "#ffffff" }}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <button onClick={insertLink} className={`p-1.5 rounded transition-colors cursor-pointer ${active.isLink ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title={active.isLink ? "Remove link" : "Insert link"} id="toolbar-action-link"><LinkIcon size={14} /></button>
        <button onClick={insertImage} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer" title="Insert image" id="toolbar-action-image"><ImageIcon size={14} /></button>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <button onClick={() => alignText("left")} className={`p-1.5 rounded transition-colors cursor-pointer ${active.alignment === "left" ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Align Left" id="toolbar-align-left"><AlignLeft size={14} /></button>
        <button onClick={() => alignText("center")} className={`p-1.5 rounded transition-colors cursor-pointer ${active.alignment === "center" ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Align Center" id="toolbar-align-center"><AlignCenter size={14} /></button>
        <button onClick={() => alignText("right")} className={`p-1.5 rounded transition-colors cursor-pointer ${active.alignment === "right" ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Align Right" id="toolbar-align-right"><AlignRight size={14} /></button>
        <button onClick={() => alignText("justify")} className={`p-1.5 rounded transition-colors cursor-pointer ${active.alignment === "justify" ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Justify" id="toolbar-align-justify"><AlignJustify size={14} /></button>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <button onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)} className={`p-1.5 rounded transition-colors cursor-pointer ${active.bulletList ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Bulleted List" id="toolbar-action-bullet"><List size={14} /></button>
        <button onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)} className={`p-1.5 rounded transition-colors cursor-pointer ${active.orderedList ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Numbered List" id="toolbar-action-numbered"><ListOrdered size={14} /></button>
      </div>

      {isMenubarCollapsed && (
        <button
          onClick={() => setIsMenubarCollapsed(false)}
          className="p-2 rounded-lg hover:bg-stone-200 text-stone-600 cursor-pointer flex items-center justify-center transition-all bg-white border border-[#E1DFD5] shadow-md shrink-0 ml-1"
          title="Expand Menubar"
          id="expand-menubar-toolbar-btn"
        >
          <ChevronDown size={14} className="animate-bounce" />
        </button>
      )}
    </div>
  );
}
