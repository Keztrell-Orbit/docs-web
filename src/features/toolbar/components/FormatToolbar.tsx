import { useState, useEffect, useCallback } from "react";
import {
  Search, Undo2, Redo2, Printer, Paintbrush, Bold, Italic,
  Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Baseline, Highlighter, Link as LinkIcon,
  Image as ImageIcon, ChevronDown,
} from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $createParagraphNode,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from "@lexical/list";
import { $createHeadingNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";

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
  strike: boolean;
  bulletList: boolean;
  orderedList: boolean;
}

export function FormatToolbar({
  zoomLevel, setZoomLevel, fontFamily, setFontFamily,
  fontSize, setFontSize, menuSearchQuery, setMenuSearchQuery,
  isMenubarCollapsed, setIsMenubarCollapsed,
}: FormatToolbarProps) {
  const [editor] = useLexicalComposerContext();
  const [active, setActive] = useState<ActiveFormats>({
    bold: false,
    italic: false,
    strike: false,
    bulletList: false,
    orderedList: false,
  });

  useEffect(() => {
    const update = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        setActive({
          bold: selection.hasFormat("bold"),
          italic: selection.hasFormat("italic"),
          strike: selection.hasFormat("strikethrough"),
          bulletList: false,
          orderedList: false,
        });
      });
    };
    const unregister = editor.registerUpdateListener(update);
    return () => unregister();
  }, [editor]);

  const toggleFormat = useCallback((format: "bold" | "italic" | "strikethrough") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
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

  return (
    <div className="w-full px-4 pt-0 pb-1.5 md:px-8 md:pt-0 md:pb-2 flex-shrink-0 z-20 flex items-center justify-between gap-2 bg-[#F1F0EA]" id="toolbar-floating-wrapper" style={{ marginTop: "6px" }}>
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
            onChange={(e) => {
              const val = e.target.value;
              if (val === "p") setParagraph();
              else if (val === "h2") setHeading(2);
              else if (val === "h3") setHeading(3);
            }}
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
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
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
          <button onClick={() => setFontSize(Math.max(8, fontSize - 1))} className="px-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors" id="toolbar-fontsize-dec">-</button>
          <span className="text-xs font-semibold text-gray-700 min-w-[16px] text-center select-none">{fontSize}</span>
          <button onClick={() => setFontSize(Math.min(72, fontSize + 1))} className="px-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors" id="toolbar-fontsize-inc">+</button>
        </div>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <button onClick={() => toggleFormat("bold")} className={`p-1.5 rounded transition-colors cursor-pointer ${active.bold ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Bold" id="toolbar-style-bold"><Bold size={14} /></button>
        <button onClick={() => toggleFormat("italic")} className={`p-1.5 rounded transition-colors cursor-pointer ${active.italic ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Italic" id="toolbar-style-italic"><Italic size={14} /></button>
        <button onClick={() => toggleFormat("strikethrough")} className={`p-1.5 rounded transition-colors cursor-pointer ${active.strike ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`} title="Strikethrough" id="toolbar-style-strikethrough"><Underline size={14} /></button>
        <button onClick={() => alert("Text Color set to: Charcoal Slate")} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer" title="Text Color" id="toolbar-style-color"><Baseline size={14} /></button>
        <button onClick={() => alert("Highlight marker set to: Amber Yellow")} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer" title="Highlight Marker" id="toolbar-style-highlight"><Highlighter size={14} /></button>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <button onClick={() => { const link = prompt("Insert link address:"); if (link) alert("Link format inserted."); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer" title="Insert link" id="toolbar-action-link"><LinkIcon size={14} /></button>
        <button onClick={() => alert("Select a picture from drive to embed.")} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer" title="Insert image" id="toolbar-action-image"><ImageIcon size={14} /></button>

        <div className="w-px h-5 bg-gray-300 self-center mx-1" />

        <button onClick={() => alert("Text aligned: Left")} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer" title="Align Left" id="toolbar-align-left"><AlignLeft size={14} /></button>
        <button onClick={() => alert("Text aligned: Center")} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer" title="Align Center" id="toolbar-align-center"><AlignCenter size={14} /></button>
        <button onClick={() => alert("Text aligned: Right")} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer" title="Align Right" id="toolbar-align-right"><AlignRight size={14} /></button>
        <button onClick={() => alert("Text aligned: Justified")} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer" title="Justify" id="toolbar-align-justify"><AlignJustify size={14} /></button>

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
