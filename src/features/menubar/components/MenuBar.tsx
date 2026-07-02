import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import {
  CaretRight, FileText, Star, Folder, Cloud, ClockCounterClockwise, ChatDots,
  Lock, CaretDown, CaretUp,
} from "@phosphor-icons/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { DocSnapshot } from "../../../types";
import { createMenuList } from "../constants";
import { MenuDropdown } from "./MenuDropdown";
import { TagsBar } from "./TagsBar";

interface MenuBarProps {
  docTitle: string;
  handleTitleChange: (title: string) => void;
  isStarred: boolean;
  setIsStarred: (starred: boolean) => void;
  isMenubarCollapsed: boolean;
  setIsMenubarCollapsed: (collapsed: boolean) => void;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setIsShareModalOpen: (open: boolean) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  isAddingTag: boolean;
  setIsAddingTag: (adding: boolean) => void;
  newTagVal: string;
  setNewTagVal: (val: string) => void;
  restoreSnapshot: (snapshot: DocSnapshot) => void;
  resetWorkspace: () => void;
  setInputText: (text: string) => void;
  setZoomLevel: (level: number) => void;
  highlightDocumentSection: (keyword: string) => void;
  isOfflineSaved: boolean;
}

export function MenuBar(props: MenuBarProps) {
  const [lexicalEditor] = useLexicalComposerContext();
  const {
    docTitle, handleTitleChange, isStarred, setIsStarred,
    isMenubarCollapsed, setIsMenubarCollapsed,
    isHistoryOpen, setIsHistoryOpen, isChatOpen, setIsChatOpen,
    setIsShareModalOpen,
    tags, setTags, isAddingTag, setIsAddingTag, newTagVal, setNewTagVal,
    restoreSnapshot, resetWorkspace, setInputText, setZoomLevel, highlightDocumentSection,
  } = props;

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const contentMeasureRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useEffect(() => {
    const el = contentMeasureRef.current;
    if (!el) return;
    const updateHeight = () => setMeasuredHeight(el.scrollHeight);
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleCloseMenu = useCallback(() => {
    setActiveMenu(null);
    setMenuCoords(null);
  }, []);

  type MenuKey = typeof menuKeys[number];
  const menuList = useMemo(
    () => createMenuList(
      lexicalEditor,
      restoreSnapshot,
      setInputText,
      setIsChatOpen,
      resetWorkspace,
      setIsHistoryOpen,
      setZoomLevel,
      highlightDocumentSection,
      isHistoryOpen,
      docTitle
    ),
    [lexicalEditor, restoreSnapshot, setInputText, setIsChatOpen, resetWorkspace, setIsHistoryOpen, setZoomLevel, highlightDocumentSection, isHistoryOpen, docTitle]
  );

  const menuKeys = ["File", "Edit", "View", "Insert", "Format", "Tools", "Hynki", "Extensions", "Help"] as const;

  return (
    <motion.div
      ref={menuRef}
      animate={{ height: isMenubarCollapsed ? 0 : measuredHeight }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 24,
        mass: 0.6,
      }}
      className="w-full flex-shrink-0 z-30 bg-[#F1F0EA] flex justify-start overflow-hidden"
    >
      <div
        ref={contentMeasureRef}
        className="w-full px-4 pt-2 pb-2 md:px-8 md:pt-3 md:pb-2.5"
      >
        <motion.div
          animate={{ opacity: isMenubarCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="w-full bg-white/95 border border-[#E1DFD5] px-4 py-1.5 md:px-6 md:py-1.5 rounded-none flex-shrink-0 z-30 select-none shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-visible"
          id="google-docs-menubar-container"
        >
            {/* Row 1 */}
            <div className="flex flex-nowrap items-center justify-between gap-3 w-full pb-1 overflow-x-auto scrollbar-none" id="menubar-row-1">
              <div className="flex items-center gap-2 md:gap-3 flex-nowrap shrink-0 animate-fade-in" id="menubar-left-section">
                <button
                  onClick={() => alert("Back to workspace directory (Simulated)")}
                  className="p-1.5 rounded-full hover:bg-stone-200/60 text-stone-600 transition-colors cursor-pointer flex items-center justify-center border border-[#E1DFD5]/40"
                  title="Back"
                >
                  <CaretRight className="rotate-180" size={16} />
                </button>

                <div className="w-8 h-8 rounded-none bg-blue-600 flex items-center justify-center text-white shadow-xs" title="Google Docs Document">
                  <FileText size={18} className="text-white fill-white/10" />
                </div>

                <div className="flex flex-col min-w-[150px] max-w-[280px]" id="menubar-title-container">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-blue-500 font-sans font-medium text-stone-800 text-sm md:text-base px-1 py-0.5 focus:outline-none w-full transition-colors rounded-none"
                      placeholder="Untitled document"
                      title="Rename document"
                    />
                    <button
                      onClick={() => setIsStarred(!isStarred)}
                      className={`p-1 rounded-none hover:bg-stone-200/60 transition-colors cursor-pointer ${isStarred ? "text-amber-500" : "text-stone-400"}`}
                      title={isStarred ? "Starred" : "Star document"}
                    >
                      <Star size={14} className={isStarred ? "fill-amber-500 text-amber-500" : ""} />
                    </button>
                    <button
                      onClick={() => alert("Move document to a custom Google Drive folder (Simulated)")}
                      className="p-1 rounded-none hover:bg-stone-200/60 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                      title="Move to folder"
                    >
                      <Folder size={14} />
                    </button>
                    <button
                      onClick={() => alert("Document auto-saved. All modifications are synchronized to your local browser storage.")}
                      className="p-1 rounded-none hover:bg-stone-200/60 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1"
                      title="Document Status"
                    >
                      <Cloud size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3 flex-nowrap shrink-0" id="menubar-right-section">
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className={`p-1.5 rounded-full hover:bg-stone-200/60 transition-all cursor-pointer border border-transparent ${isHistoryOpen ? "bg-stone-200 text-stone-800" : "text-stone-500 hover:text-stone-800"}`}
                  title="Version History Logs"
                >
                  <ClockCounterClockwise size={15} />
                </button>
                <button
                  onClick={() => setIsChatOpen(prev => !prev)}
                  className={`p-1.5 rounded-full hover:bg-stone-200/60 transition-all cursor-pointer border border-transparent ${isChatOpen ? "bg-stone-200 text-stone-800" : "text-stone-500 hover:text-stone-800"}`}
                  title="Toggle Comments & AI Chat"
                >
                  <ChatDots size={15} />
                </button>
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="bg-[#C2E7FF] hover:bg-[#B1DCF9] text-[#001D35] font-semibold text-xs py-1.5 px-3 md:px-4 rounded-full flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer border border-transparent"
                  title="Share document settings"
                >
                  <Lock size={12} className="text-[#001D35]" />
                  <span>Share</span>
                  <CaretDown size={11} className="text-[#001D35]" />
                </button>
                <div className="relative group cursor-pointer" title="Nilanjan Mridha (nilanjanmridha89@gmail.com)">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs border border-white">
                    NM
                  </div>
                </div>
                <button
                  onClick={() => setIsMenubarCollapsed(true)}
                  className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-all cursor-pointer border border-transparent ml-1"
                  title="Collapse Menubar"
                >
                  <CaretUp size={15} />
                </button>
              </div>
            </div>

            {/* Row 2 */}
            <div className="mt-1.5 flex flex-nowrap items-center justify-between gap-4 border-t border-[#E1DFD5]/60 pt-1.5 overflow-x-auto scrollbar-none" id="menubar-row-2">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0" id="menubar-links-list">
                {menuKeys.map((key: typeof menuKeys[number]) => {
                  const isMenuActive = activeMenu === key;
                  return (
                    <div key={key} className="relative">
                      <button
                        onClick={(e) => {
                          if (isMenuActive) {
                            handleCloseMenu();
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActiveMenu(key);
                            setMenuCoords({ top: rect.bottom, left: rect.left });
                          }
                        }}
                        className={`px-2.5 py-1 text-xs font-sans rounded-none text-stone-600 hover:bg-stone-200/50 hover:text-stone-800 transition-colors cursor-pointer ${
                          isMenuActive ? "bg-stone-200 text-stone-900 font-semibold" : ""
                        }`}
                        id={`menu-item-btn-${key}`}
                      >
                        {key}
                      </button>
                      {isMenuActive && menuCoords && (
                        <MenuDropdown
                          items={(menuList as Record<MenuKey, { label: string; action: () => void }[]>)[key] || []}
                          coords={menuCoords}
                          onClose={handleCloseMenu}
                          menuKey={key}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <TagsBar
                tags={tags}
                setTags={setTags}
                isAddingTag={isAddingTag}
                setIsAddingTag={setIsAddingTag}
                newTagVal={newTagVal}
                setNewTagVal={setNewTagVal}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
  );
}
