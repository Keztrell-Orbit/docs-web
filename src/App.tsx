import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { motion, AnimatePresence } from "motion/react";
import {
  History,
  FileText,
  Check,
  Loader2,
  Paperclip,
  Mic,
  SendHorizontal,
  RefreshCcw,
  X,
  Sparkles,
  ChevronRight,
  Info,
  Star,
  Folder,
  Cloud,
  Printer,
  Paintbrush,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  Plus,
  Tag,
  Lock,
  MessageSquare,
  Search,
  Link as LinkIcon,
  Image as ImageIcon,
  Baseline,
  Highlighter,
  Undo2,
  Redo2,
} from "lucide-react";
import { db, seedDatabase } from "./db";

// Standard historical versions that the user can restore via the History Panel
interface DocSnapshot {
  label: string;
  timestamp: string;
  showLogo: boolean;
  content: string;
}

const HISTORICAL_VERSIONS: DocSnapshot[] = [
  {
    label: "Original Draft (Before AI)",
    timestamp: "25/05/2025 10:00 AM",
    showLogo: false,
    content: `
<h2>Intellectual Property Assignment Agreement</h2>
<p>This Intellectual Property Assignment Agreement (the "Agreement") is entered into as of 25/05/2025, by and between: <strong>John Smith</strong>, an individual residing at 123 Innovation Drive, Suite 400, San Francisco, CA 94105 (the "Assignor"), and <strong>QuantumNova Technologies, Inc</strong> (the "Company").</p>

<h3>1. Assignment of Intellectual Property</h3>
<p>(a) Assignment. For good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Assignor hereby irrevocably assigns, transfers, and conveys to the Company, its successors and assigns, all right, title, and interest worldwide in and to any and all Intellectual Property (as defined below) that the Assignor has conceived, developed, authored, reduced to practice, or otherwise created, in whole or in part, (i) in the course of performing services for or on behalf of the Company, whether as an employee, consultant, or independent contractor, or (ii) using the Company's resources, confidential information, or facilities (collectively, the "Assigned IP").</p>

<h3>2. Further Assurances</h3>
<p>The Assignor agrees to assist the Company, or its designee, in every proper way to secure the Company's rights in the Assigned IP and any copyrights, patents, or other intellectual property rights relating thereto in any and all countries, including the disclosure to the Company of all pertinent information and data with respect thereto, the execution of all applications, specifications, oaths, assignments, and all other instruments which the Company shall deem necessary in order to apply for and obtain such rights.</p>
`
  },
  {
    label: "Added Logo",
    timestamp: "25/05/2025 10:15 AM",
    showLogo: true,
    content: `
<h2>Intellectual Property Assignment Agreement</h2>
<p>This Intellectual Property Assignment Agreement (the "Agreement") is entered into as of 25/05/2025, by and between: <strong>John Smith</strong>, an individual residing at 123 Innovation Drive, Suite 400, San Francisco, CA 94105 (the "Assignor"), and <strong>QuantumNova Technologies, Inc</strong> (the "Company").</p>

<h3>1. Assignment of Intellectual Property</h3>
<p>(a) Assignment. For good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Assignor hereby irrevocably assigns, transfers, and conveys to the Company, its successors and assigns, all right, title, and interest worldwide in and to any and all Intellectual Property (as defined below) that the Assignor has conceived, developed, authored, reduced to practice, or otherwise created, in whole or in part, (i) in the course of performing services for or on behalf of the Company, whether as an employee, consultant, or independent contractor, or (ii) using the Company's resources, confidential information, or facilities (collectively, the "Assigned IP").</p>

<h3>2. Further Assurances</h3>
<p>The Assignor agrees to assist the Company, or its designee, in every proper way to secure the Company's rights in the Assigned IP and any copyrights, patents, or other intellectual property rights relating thereto in any and all countries, including the disclosure to the Company of all pertinent information and data with respect thereto, the execution of all applications, specifications, oaths, assignments, and all other instruments which the Company shall deem necessary in order to apply for and obtain such rights.</p>
`
  },
  {
    label: "Added Governing Law Section",
    timestamp: "25/05/2025 10:20 AM",
    showLogo: true,
    content: `
<h2>Intellectual Property Assignment Agreement</h2>
<p>This Intellectual Property Assignment Agreement (the "Agreement") is entered into as of 25/05/2025, by and between: <strong>John Smith</strong>, an individual residing at 123 Innovation Drive, Suite 400, San Francisco, CA 94105 (the "Assignor"), and <strong>QuantumNova Technologies, Inc</strong> (the "Company").</p>

<h3>1. Assignment of Intellectual Property</h3>
<p>(a) Assignment. For good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Assignor hereby irrevocably assigns, transfers, and conveys to the Company, its successors and assigns, all right, title, and interest worldwide in and to any and all Intellectual Property (as defined below) that the Assignor has conceived, developed, authored, reduced to practice, or otherwise created, in whole or in part, (i) in the course of performing services for or on behalf of the Company, whether as an employee, consultant, or independent contractor, or (ii) using the Company's resources, confidential information, or facilities (collectively, the "Assigned IP").</p>

<h3>2. Governing Law</h3>
<p>This Agreement, and all claims or causes of action (whether in contract, tort or statute) that may be based upon, arise out of or relate to this Agreement, shall be governed by, and enforced in accordance with, the internal laws of the State of California, without regard to its conflict of laws principles.</p>

<h3>3. Further Assurances</h3>
<p>The Assignor agrees to assist the Company, or its designee, in every proper way to secure the Company's rights in the Assigned IP and any copyrights, patents, or other intellectual property rights relating thereto in any and all countries, including the disclosure to the Company of all pertinent information and data with respect thereto, the execution of all applications, specifications, oaths, assignments, and all other instruments which the Company shall deem necessary in order to apply for and obtain such rights.</p>
`
  },
  {
    label: "Updated Assignor (Sebastian Cornelius) [Current]",
    timestamp: "25/05/2025 10:22 AM",
    showLogo: true,
    content: `
<h2>Intellectual Property Assignment Agreement</h2>
<p>This Intellectual Property Assignment Agreement (the "Agreement") is entered into as of 25/05/2025, by and between: <strong>Sebastian Cornelius</strong>, an individual residing at 123 Innovation Drive, Suite 400, San Francisco, CA 94105 (the "Assignor"), and <strong>QuantumNova Technologies, Inc</strong> (the "Company").</p>

<h3>1. Assignment of Intellectual Property</h3>
<p>(a) Assignment. For good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Assignor hereby irrevocably assigns, transfers, and conveys to the Company, its successors and assigns, all right, title, and interest worldwide in and to any and all Intellectual Property (as defined below) that the Assignor has conceived, developed, authored, reduced to practice, or otherwise created, in whole or in part, (i) in the course of performing services for or on behalf of the Company, whether as an employee, consultant, or independent contractor, or (ii) using the Company's resources, confidential information, or facilities (collectively, the "Assigned IP").</p>

<h3>2. Governing Law</h3>
<p>This Agreement, and all claims or causes of action (whether in contract, tort or statute) that may be based upon, arise out of or relate to this Agreement, shall be governed by, and enforced in accordance with, the internal laws of the State of California, without regard to its conflict of laws principles.</p>

<h3>3. Further Assurances</h3>
<p>The Assignor agrees to assist the Company, or its designee, in every proper way to secure the Company's rights in the Assigned IP and any copyrights, patents, or other intellectual property rights relating thereto in any and all countries, including the disclosure to the Company of all pertinent information and data with respect thereto, the execution of all applications, specifications, oaths, assignments, and all other instruments which the Company shall deem necessary in order to apply for and obtain such rights.</p>
`
  }
];

const PAGE_DIMENSIONS = {
  A4: { width: "794px", minHeight: "1123px" },
  A5: { width: "560px", minHeight: "792px" },
  A6: { width: "397px", minHeight: "561px" },
  Letter: { width: "816px", minHeight: "1056px" },
};

interface OutlinePart {
  id: string;
  title: string;
}

interface OutlineChapter {
  id: string;
  title: string;
  parts?: OutlinePart[];
}

export default function App() {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isOfflineSaved, setIsOfflineSaved] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Document components tree view states
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [selectedPartId, setSelectedPartId] = useState<string>("");

  // New Google Docs state variables for multiple dimensions and formatting
  const [pageDimension, setPageDimension] = useState<"A4" | "A5" | "A6" | "Letter">("A4");
  const [zoomLevel, setZoomLevel] = useState<number>(75);
  const [isStarred, setIsStarred] = useState<boolean>(false);
  const [fontFamily, setFontFamily] = useState<string>("Inter");
  const [fontSize, setFontSize] = useState<number>(14);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [menuSearchQuery, setMenuSearchQuery] = useState("");

  // Menubar, tag management, and sharing states
  const [isMenubarCollapsed, setIsMenubarCollapsed] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>(["Marketing", "Q1 2024"]);
  const [isAddingTag, setIsAddingTag] = useState<boolean>(false);
  const [newTagVal, setNewTagVal] = useState<string>("");
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareEmail, setShareEmail] = useState<string>("");
  const [shareRole, setShareRole] = useState<"viewer" | "commenter" | "editor">("editor");
  const [shareLinkCopied, setShareLinkCopied] = useState<boolean>(false);

  // Bind to Dexie IndexedDB using Live Queries
  const currentDoc = useLiveQuery(() => db.documents.get("doc-default"));
  const chatMessages = useLiveQuery(() => db.chats.orderBy("timestamp").toArray());

  // Extract outline dynamically from the HTML content of the editor / document
  const outlineData = useMemo(() => {
    const html = currentDoc?.content || "";
    if (typeof window === "undefined" || !html) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headers = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");

    const outline: OutlineChapter[] = [];
    let currentChapter: OutlineChapter | null = null;
    let index = 0;

    headers.forEach((header) => {
      const text = header.textContent?.trim() || "";
      if (!text) return;

      const tagName = header.tagName.toLowerCase();
      const id = `heading-${index++}`;

      if (tagName === "h1" || tagName === "h2") {
        currentChapter = {
          id,
          title: text,
          parts: []
        };
        outline.push(currentChapter);
      } else {
        if (!currentChapter) {
          currentChapter = {
            id: `root-chapter-${index++}`,
            title: "General",
            parts: []
          };
          outline.push(currentChapter);
        }
        currentChapter.parts?.push({
          id,
          title: text
        });
      }
    });

    return outline;
  }, [currentDoc?.content]);

  // Handle scrolling of outline item into editor view with visual highlight flash
  const handleHeadingClick = (title: string) => {
    const editorEl = document.querySelector(".ProseMirror");
    if (!editorEl) return;
    const elements = Array.from(editorEl.querySelectorAll("h1, h2, h3, h4, h5, h6"));
    const target = elements.find((el) => el.textContent?.trim() === title.trim());
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("bg-sky-200/40", "rounded", "px-1", "transition-all", "duration-500");
      setTimeout(() => {
        target.classList.remove("bg-sky-200/40");
      }, 1500);
    }
  };

  // Seed DB on mount
  useEffect(() => {
    seedDatabase();
  }, []);

  // Initialize TipTap Editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    onUpdate: ({ editor }) => {
      setIsOfflineSaved(false);
      const html = editor.getHTML();
      // Auto-save to Dexie IndexedDB
      db.documents.update("doc-default", {
        content: html,
        updatedAt: Date.now()
      }).then(() => {
        // Mock a brief network/disk latency for visual feedback
        setTimeout(() => setIsOfflineSaved(true), 400);
      });
    }
  });

  // Watch currentDoc and keep TipTap synchronized + sync document title
  useEffect(() => {
    if (currentDoc) {
      if (editor) {
        const currentHTML = editor.getHTML();
        if (currentDoc.content !== currentHTML) {
          editor.commands.setContent(currentDoc.content);
        }
      }
      if (currentDoc.title && !docTitle) {
        setDocTitle(currentDoc.title);
      }
    }
  }, [currentDoc, editor, docTitle]);

  const handleTitleChange = async (newTitle: string) => {
    setDocTitle(newTitle);
    setIsOfflineSaved(false);
    await db.documents.update("doc-default", {
      title: newTitle,
      updatedAt: Date.now()
    });
    setTimeout(() => setIsOfflineSaved(true), 400);
  };

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isGenerating]);

  // Document Section Highlighting Interaction
  const highlightDocumentSection = (keyword: string) => {
    const editorEl = document.querySelector(".ProseMirror");
    if (!editorEl) return;

    // Search for headings or paragraphs containing the keyword
    const elements = Array.from(editorEl.querySelectorAll("h2, h3, p, strong, li"));
    const target = elements.find((el) =>
      el.textContent?.toLowerCase().includes(keyword.toLowerCase())
    );

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("bg-sky-200/50", "rounded", "px-1", "transition-all", "duration-500");
      setTimeout(() => {
        target.classList.remove("bg-sky-200/50");
      }, 2500);
    }
  };

  // Chat message sending & server invocation
  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || inputText;
    if (!promptToSend.trim() || isGenerating) return;

    if (!customPrompt) {
      setInputText("");
    }

    const userMessageId = `msg-user-${Date.now()}`;
    const assistantMessageId = `msg-assistant-${Date.now()}`;

    // Add User Message to IndexedDB
    await db.chats.add({
      id: userMessageId,
      sender: "user",
      text: promptToSend,
      timestamp: Date.now()
    });

    setIsGenerating(true);

    try {
      const docHtml = editor?.getHTML() || currentDoc?.content || "";
      const docTitle = currentDoc?.title || "Document";
      const hasLogo = currentDoc?.showLogo || false;

      // Pass conversation history
      const history = chatMessages?.map((m) => ({
        sender: m.sender,
        text: m.text
      })) || [];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptToSend,
          history,
          currentContent: docHtml,
          currentTitle: docTitle,
          showLogo: hasLogo
        })
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI Assistant.");
      }

      const data = await response.json();

      // Update document content and logo status in DB
      await db.documents.update("doc-default", {
        content: data.updatedContent,
        showLogo: data.updatedShowLogo,
        updatedAt: Date.now()
      });

      // Add Assistant Message & Widget to DB
      await db.chats.add({
        id: assistantMessageId,
        sender: "assistant",
        text: data.text,
        widget: data.widget,
        timestamp: Date.now()
      });

    } catch (err: any) {
      console.error(err);
      await db.chats.add({
        id: assistantMessageId,
        sender: "assistant",
        text: `Error: ${err.message || "Something went wrong while applying edits."}`,
        timestamp: Date.now()
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Restore document state from predefined snapshots
  const restoreSnapshot = async (snapshot: DocSnapshot) => {
    setIsOfflineSaved(false);
    await db.documents.update("doc-default", {
      content: snapshot.content,
      showLogo: snapshot.showLogo,
      updatedAt: Date.now()
    });
    // Add a notice chat bubble about restoring
    await db.chats.add({
      id: `restore-${Date.now()}`,
      sender: "assistant",
      text: `Restored document to: "${snapshot.label}".`,
      timestamp: Date.now()
    });
    setIsHistoryOpen(false);
    setTimeout(() => setIsOfflineSaved(true), 400);
  };

  // Reset/Clear Chat History to seed values
  const resetWorkspace = async () => {
    if (confirm("Would you like to reset the workspace document and chat back to original state?")) {
      await db.chats.clear();
      await db.documents.clear();
      await seedDatabase();
      // Reload page to re-render neatly
      window.location.reload();
    }
  };

  const menuList: { [key: string]: { label: string; action: () => void }[] } = {
    File: [
      { label: "📄 New document", action: () => alert("Created a new blank Hynki template document.") },
      { label: "⏳ Restore initial draft", action: () => restoreSnapshot(HISTORICAL_VERSIONS[0]) },
      {
        label: "📥 Download as TXT file", action: () => {
          const text = editor?.getText() || "";
          const blob = new Blob([text], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${docTitle || "document"}.txt`;
          a.click();
        }
      },
      { label: "⚠️ Reset whole workspace", action: resetWorkspace }
    ],
    Edit: [
      { label: "↩️ Undo change (Ctrl+Z)", action: () => editor?.chain().focus().undo().run() },
      { label: "↪️ Redo change (Ctrl+Y)", action: () => editor?.chain().focus().redo().run() },
      { label: "❌ Clear document content", action: () => { if (confirm("Clear document content?")) editor?.chain().focus().clearContent().run(); } }
    ],
    View: [
      { label: "📂 Toggle revision logs", action: () => setIsHistoryOpen(!isHistoryOpen) },
      { label: "🔍 Reset Zoom to 100%", action: () => setZoomLevel(100) },
      { label: "💬 Toggle Hynki", action: () => setIsChatOpen(prev => !prev) }
    ],
    Insert: [
      { label: "➖ Insert horizontal divider", action: () => editor?.chain().focus().setHorizontalRule().run() },
      { label: "⚫ Insert bullet list", action: () => editor?.chain().focus().toggleBulletList().run() },
      { label: "🔢 Insert numbered list", action: () => editor?.chain().focus().toggleOrderedList().run() }
    ],
    Format: [
      { label: "Bold text", action: () => editor?.chain().focus().toggleBold().run() },
      { label: "Italic text", action: () => editor?.chain().focus().toggleItalic().run() },
      { label: "Strikethrough text", action: () => editor?.chain().focus().toggleStrike().run() }
    ],
    Tools: [
      {
        label: "📊 Word statistics", action: () => {
          const words = editor?.getText().split(/\s+/).filter(Boolean).length || 0;
          alert(`This document has: ${words} words.`);
        }
      },
      { label: "🔍 Find 'Sebastian Cornelius'", action: () => highlightDocumentSection("Sebastian Cornelius") },
      { label: "🔍 Find 'Governing Law'", action: () => highlightDocumentSection("Governing Law") }
    ],
    Hynki: [
      {
        label: "✨ Summarize current document", action: () => {
          setInputText("Please summarize the current document for me.");
          setIsChatOpen(true);
        }
      },
      {
        label: "✍️ Suggest 3 key improvements", action: () => {
          setInputText("Identify 3 potential improvements for this agreement.");
          setIsChatOpen(true);
        }
      },
      {
        label: "🔄 Rewrite in formal tone", action: () => {
          setInputText("Rewrite the selected or current document text in a highly formal legal tone.");
          setIsChatOpen(true);
        }
      }
    ],
    Extensions: [
      { label: "⚙️ IndexedDB Storage sync", action: () => alert("Offline sync engine (Dexie IndexedDB) is currently active.") }
    ],
    Help: [
      { label: "⌨️ Keyboard commands", action: () => alert("Use Ctrl+B for bold, Ctrl+I for Italic, Ctrl+Z for undo.") },
      { label: "ℹ️ About build workspace", action: () => alert("A majestic Google Docs high-fidelity workspace with real-time responsive states.") }
    ]
  };

  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
        setMenuCoords(null);
      }
    }
    function handleScrollOrResize() {
      setActiveMenu(null);
      setMenuCoords(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-[#F1F0EA] flex flex-col md:flex-row font-sans text-stone-800 antialiased overflow-hidden" id="editor-workspace-container">

      {/* LEFT COLUMN: Clean Document Canvas with Google Docs Sticky Header & Toolbar */}
      <div
        className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 mr-0"
        id="left-document-pane"
      >

        {/* Google Docs Style Header & Menubar */}
        <div
          ref={menuRef}
          className={`w-full flex-shrink-0 z-30 bg-[#F1F0EA] flex justify-start transition-all duration-300 ${isMenubarCollapsed
            ? "h-0 overflow-hidden py-0 px-0"
            : "px-4 pt-2 pb-2 md:px-8 md:pt-3 md:pb-2.5"
            }`}
        >
          <AnimatePresence initial={false}>
            {!isMenubarCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0, scale: 0.96 }}
                animate={{ height: "auto", opacity: 1, scale: 1 }}
                exit={{ height: 0, opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="w-full bg-white/95 border border-[#E1DFD5] px-4 py-1.5 md:px-6 md:py-1.5 rounded-xl flex-shrink-0 z-30 select-none shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-visible"
                id="google-docs-menubar-container"
              >
                {/* Row 1: Document Logo, Title, Star, Folder, Cloud Status & Right Workspace Tools */}
                <div className="flex flex-nowrap items-center justify-between gap-3 w-full pb-1 overflow-x-auto scrollbar-none" id="menubar-row-1">

                  {/* Left section: Logo, Back Button, Title, Actions */}
                  <div className="flex items-center gap-2 md:gap-3 flex-nowrap shrink-0 animate-fade-in" id="menubar-left-section">
                    <button
                      onClick={() => alert("Back to workspace directory (Simulated)")}
                      className="p-1.5 rounded-full hover:bg-stone-200/60 text-stone-600 transition-colors cursor-pointer flex items-center justify-center border border-[#E1DFD5]/40"
                      title="Back"
                    >
                      <ChevronRight className="rotate-180" size={16} />
                    </button>

                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white shadow-xs" title="Google Docs Document">
                      <FileText size={18} className="text-white fill-white/10" />
                    </div>

                    <div className="flex flex-col min-w-[150px] max-w-[280px]" id="menubar-title-container">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={docTitle}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-blue-500 font-sans font-medium text-stone-800 text-sm md:text-base px-1 py-0.5 focus:outline-none w-full transition-colors rounded-sm"
                          placeholder="Untitled document"
                          title="Rename document"
                        />

                        {/* Star Button */}
                        <button
                          onClick={() => setIsStarred(!isStarred)}
                          className={`p-1 rounded-md hover:bg-stone-200/60 transition-colors cursor-pointer ${isStarred ? "text-amber-500" : "text-stone-400"}`}
                          title={isStarred ? "Starred" : "Star document"}
                        >
                          <Star size={14} className={isStarred ? "fill-amber-500 text-amber-500" : ""} />
                        </button>

                        {/* Move to Folder Button */}
                        <button
                          onClick={() => alert("Move document to a custom Google Drive folder (Simulated)")}
                          className="p-1 rounded-md hover:bg-stone-200/60 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                          title="Move to folder"
                        >
                          <Folder size={14} />
                        </button>

                        {/* Cloud Saved Status Icon */}
                        <button
                          onClick={() => alert("Document auto-saved. All modifications are synchronized to your local browser storage.")}
                          className="p-1 rounded-md hover:bg-stone-200/60 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1"
                          title="Document Status"
                        >
                          <Cloud size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Interactive workspace actions, user profile, share, and collapse arrow */}
                  <div className="flex items-center gap-2 md:gap-3 flex-nowrap shrink-0" id="menubar-right-section">
                    <button
                      onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                      className={`p-1.5 rounded-full hover:bg-stone-200/60 transition-all cursor-pointer border border-transparent ${isHistoryOpen ? "bg-stone-200 text-stone-800" : "text-stone-500 hover:text-stone-800"}`}
                      title="Version History Logs"
                    >
                      <History size={15} />
                    </button>

                    <button
                      onClick={() => setIsChatOpen(!isChatOpen)}
                      className={`p-1.5 rounded-full hover:bg-stone-200/60 transition-all cursor-pointer border border-transparent ${isChatOpen ? "bg-stone-200 text-stone-800" : "text-stone-500 hover:text-stone-800"}`}
                      title="Toggle Comments & AI Chat"
                    >
                      <MessageSquare size={15} />
                    </button>

                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="bg-[#C2E7FF] hover:bg-[#B1DCF9] text-[#001D35] font-semibold text-xs py-1.5 px-3 md:px-4 rounded-full flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer border border-transparent"
                      title="Share document settings"
                    >
                      <Lock size={12} className="text-[#001D35]" />
                      <span>Share</span>
                      <ChevronDown size={11} className="text-[#001D35]" />
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
                      <ChevronUp size={15} />
                    </button>
                  </div>

                </div>

                {/* Row 2: Menu Items Row & Interactive Tags Row */}
                <div className="mt-1.5 flex flex-nowrap items-center justify-between gap-4 border-t border-[#E1DFD5]/60 pt-1.5 overflow-x-auto scrollbar-none" id="menubar-row-2">

                  {/* Left side: Row of Menu buttons (File, Edit, etc) */}
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0" id="menubar-links-list">
                    {["File", "Edit", "View", "Insert", "Format", "Tools", "Hynki", "Extensions", "Help"].map((key) => {
                      const isMenuCurrentlyActive = activeMenu === key;
                      return (
                        <div key={key} className="relative">
                          <button
                            onClick={(e) => {
                              if (isMenuCurrentlyActive) {
                                setActiveMenu(null);
                                setMenuCoords(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActiveMenu(key);
                                setMenuCoords({ top: rect.bottom, left: rect.left });
                              }
                            }}
                            className={`px-2.5 py-1 text-xs font-sans rounded-md text-stone-600 hover:bg-stone-200/50 hover:text-stone-800 transition-colors cursor-pointer ${isMenuCurrentlyActive ? "bg-stone-200 text-stone-900 font-semibold" : ""}`}
                            id={`menu-item-btn-${key}`}
                          >
                            {key}
                          </button>

                          {/* Floating Google Docs dropdown */}
                          {isMenuCurrentlyActive && (
                            <div
                              className="fixed w-56 bg-white border border-[#E1DFD5] rounded-lg shadow-xl py-1.5 z-50 animate-fade-in"
                              style={{
                                top: menuCoords ? `${menuCoords.top + 4}px` : "100%",
                                left: menuCoords ? `${menuCoords.left}px` : "0px",
                              }}
                              id={`menu-dropdown-${key}`}
                            >
                              {menuList[key] ? (
                                menuList[key].map((item, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      item.action();
                                      setActiveMenu(null);
                                      setMenuCoords(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-sans text-stone-700 hover:bg-stone-200/50 hover:text-stone-900 flex items-center justify-between transition-colors cursor-pointer"
                                  >
                                    <span>{item.label}</span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-xs font-sans text-stone-400 italic">No actions defined</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Right side/Middle: Tags Bar styled exactly like Image 1 */}
                  <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto scrollbar-none shrink-0" id="menubar-tags-bar">
                    <div className="p-1 text-stone-400 bg-stone-200/30 rounded-md" title="Interactive Document Tags">
                      <Tag size={13} />
                    </div>

                    {/* List of tags */}
                    {tags.map((tag) => {
                      let barColor = "bg-blue-600";
                      if (tag === "Marketing") barColor = "bg-blue-600";
                      else if (tag === "Q1 2024") barColor = "bg-cyan-500";
                      else {
                        const colors = ["bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-pink-500", "bg-rose-500", "bg-teal-500"];
                        const index = Math.abs(tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
                        barColor = colors[index];
                      }

                      return (
                        <div
                          key={tag}
                          className="flex items-center bg-white hover:bg-stone-100 border border-[#E1DFD5]/70 rounded px-2 py-0.5 text-stone-700 text-[11px] font-sans transition-colors"
                          id={`document-tag-${tag}`}
                        >
                          <span className={`w-1 h-3.5 rounded-sm ${barColor} mr-1.5`} />
                          <span className="font-medium mr-1.5">{tag}</span>
                          <button
                            onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                            className="hover:bg-stone-200 text-stone-400 hover:text-stone-700 rounded-full p-0.5 transition-colors cursor-pointer flex items-center justify-center"
                            title={`Remove ${tag}`}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}

                    {/* Plus Add Tag Button */}
                    {isAddingTag ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (newTagVal.trim() && !tags.includes(newTagVal.trim())) {
                            setTags(prev => [...prev, newTagVal.trim()]);
                            setNewTagVal("");
                            setIsAddingTag(false);
                          }
                        }}
                        className="flex items-center gap-1 bg-white border border-blue-400 rounded px-1.5 py-0.5"
                      >
                        <input
                          type="text"
                          value={newTagVal}
                          onChange={(e) => setNewTagVal(e.target.value)}
                          placeholder="New tag..."
                          className="border-none text-[11px] text-stone-700 font-sans focus:outline-none w-20 p-0"
                          autoFocus
                        />
                        <button type="submit" className="text-blue-500 hover:text-blue-700 font-bold text-xs">✓</button>
                        <button type="button" onClick={() => setIsAddingTag(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">×</button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setIsAddingTag(true)}
                        className="p-1 rounded-full text-[#b03060] hover:bg-[#b03060]/10 transition-colors cursor-pointer flex items-center justify-center border border-dashed border-[#b03060]/30 ml-1"
                        title="Add a tag to document"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    )}

                  </div>

                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky Toolbar shifted above the document page */}
        <div className="w-full px-4 pt-0 pb-1.5 md:px-8 md:pt-0 md:pb-2 flex-shrink-0 z-20 flex items-center justify-between gap-2 bg-[#F1F0EA]" id="toolbar-floating-wrapper">
          <div
            className="flex-1 bg-[#FAF9F5] border border-[#E1DFD5] rounded-lg shadow-md px-4 py-2.5 flex flex-nowrap items-center gap-1.5 select-none overflow-x-auto scrollbar-none [&>*]:shrink-0 min-w-0"
            id="formatting-toolbar"
          >

            {/* Magnifier Menus search */}
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

            {/* Undo/Redo */}
            <button
              onClick={() => editor?.chain().focus().undo().run()}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
              title="Undo"
              id="toolbar-action-undo"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={() => editor?.chain().focus().redo().run()}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
              title="Redo"
              id="toolbar-action-redo"
            >
              <Redo2 size={14} />
            </button>

            {/* Print */}
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
              title="Print"
              id="toolbar-action-print"
            >
              <Printer size={14} />
            </button>

            {/* Paintbrush */}
            <button
              onClick={() => alert("Format painter active. Click a section to apply styles.")}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
              title="Format Painter"
              id="toolbar-action-paintbrush"
            >
              <Paintbrush size={14} />
            </button>

            <div className="w-px h-5 bg-gray-300 self-center mx-1" />

            {/* Zoom Selector dropdown */}
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

            {/* Normal text dropdown */}
            <div className="flex items-center bg-transparent hover:bg-gray-100 rounded px-1 py-0.5" title="Style template">
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "p") editor?.chain().focus().setParagraph().run();
                  else if (val === "h2") editor?.chain().focus().toggleHeading({ level: 2 }).run();
                  else if (val === "h3") editor?.chain().focus().toggleHeading({ level: 3 }).run();
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

            {/* Font dropdown */}
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

            {/* Font size selectors */}
            <div className="flex items-center bg-gray-100/80 hover:bg-gray-200 rounded px-1 py-0.5 space-x-1" title="Font size">
              <button
                onClick={() => setFontSize(Math.max(8, fontSize - 1))}
                className="px-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
                id="toolbar-fontsize-dec"
              >
                -
              </button>
              <span className="text-xs font-semibold text-gray-700 min-w-[16px] text-center select-none">{fontSize}</span>
              <button
                onClick={() => setFontSize(Math.min(72, fontSize + 1))}
                className="px-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
                id="toolbar-fontsize-inc"
              >
                +
              </button>
            </div>

            <div className="w-px h-5 bg-gray-300 self-center mx-1" />

            {/* Text decoration styles */}
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded transition-colors cursor-pointer ${editor?.isActive("bold") ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
              title="Bold"
              id="toolbar-style-bold"
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded transition-colors cursor-pointer ${editor?.isActive("italic") ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
              title="Italic"
              id="toolbar-style-italic"
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded transition-colors cursor-pointer ${editor?.isActive("strike") ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
              title="Strikethrough"
              id="toolbar-style-strikethrough"
            >
              <Underline size={14} />
            </button>

            <button
              onClick={() => alert("Text Color set to: Charcoal Slate")}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
              title="Text Color"
              id="toolbar-style-color"
            >
              <Baseline size={14} />
            </button>
            <button
              onClick={() => alert("Highlight marker set to: Amber Yellow")}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
              title="Highlight Marker"
              id="toolbar-style-highlight"
            >
              <Highlighter size={14} />
            </button>

            <div className="w-px h-5 bg-gray-300 self-center mx-1" />

            {/* Link / Image insertion */}
            <button
              onClick={() => { const link = prompt("Insert link address:"); if (link) alert("Link format inserted."); }}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
              title="Insert link"
              id="toolbar-action-link"
            >
              <LinkIcon size={14} />
            </button>
            <button
              onClick={() => alert("Select a picture from drive to embed.")}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
              title="Insert image"
              id="toolbar-action-image"
            >
              <ImageIcon size={14} />
            </button>

            <div className="w-px h-5 bg-gray-300 self-center mx-1" />

            {/* Alignment controls */}
            <button
              onClick={() => alert("Text aligned: Left")}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
              title="Align Left"
              id="toolbar-align-left"
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => alert("Text aligned: Center")}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
              title="Align Center"
              id="toolbar-align-center"
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => alert("Text aligned: Right")}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
              title="Align Right"
              id="toolbar-align-right"
            >
              <AlignRight size={14} />
            </button>
            <button
              onClick={() => alert("Text aligned: Justified")}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
              title="Justify"
              id="toolbar-align-justify"
            >
              <AlignJustify size={14} />
            </button>

            <div className="w-px h-5 bg-gray-300 self-center mx-1" />

            {/* Bullet & lists */}
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded transition-colors cursor-pointer ${editor?.isActive("bulletList") ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
              title="Bulleted List"
              id="toolbar-action-bullet"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded transition-colors cursor-pointer ${editor?.isActive("orderedList") ? "bg-stone-200 text-stone-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}
              title="Numbered List"
              id="toolbar-action-numbered"
            >
              <ListOrdered size={14} />
            </button>

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

        {/* Side-by-side Workspace Layout */}
        <div
          className="flex-1 flex flex-row items-stretch justify-start gap-6 px-4 md:px-8 overflow-hidden min-h-0 bg-[#F1F0EA]"
          id="side-by-side-workspace-container"
        >
          {/* LEFT: Tree View Sidebar */}
          <div
            className="w-[200px] flex-shrink-0 bg-transparent select-none overflow-y-auto h-full p-2"
            id="document-tree-view"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E1DFD5]/60" id="tree-view-header">
              <span className="text-[11px] font-mono tracking-wider font-semibold uppercase text-stone-600">Document Outline</span>
              <span className="text-[10px] text-gray-400 font-mono">Interactive</span>
            </div>
            <div className="space-y-1" id="tree-view-list">
              {outlineData.length === 0 ? (
                <div className="text-[11px] text-gray-400 font-mono text-center py-4">No headings found</div>
              ) : (
                outlineData.map((chapter) => {
                  const isExpanded = expandedChapters[chapter.id] !== false;
                  return (
                    <div key={chapter.id} className="flex flex-col" id={`tree-chapter-group-${chapter.id}`}>
                      {/* Chapter Row */}
                      <div
                        onClick={() => {
                          setExpandedChapters(prev => ({
                            ...prev,
                            [chapter.id]: prev[chapter.id] === false ? true : false
                          }));
                          handleHeadingClick(chapter.title);
                        }}
                        className="flex items-center justify-between py-2 px-1.5 rounded-lg hover:bg-[#F1F0EA]/50 cursor-pointer transition-colors group"
                        id={`tree-chapter-row-${chapter.id}`}
                      >
                        <div className="flex items-center min-w-0">
                          {/* Horizontal Dash */}
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

                      {/* Parts List */}
                      {isExpanded && chapter.parts && chapter.parts.length > 0 && (
                        <div className="pl-4 mt-0.5 space-y-0.5 border-l border-[#E1DFD5]/60 ml-3" id={`tree-chapter-parts-${chapter.id}`}>
                          {chapter.parts.map((part) => {
                            const isSelected = selectedPartId === part.id;
                            return (
                              <div
                                key={part.id}
                                onClick={() => {
                                  setSelectedPartId(part.id);
                                  handleHeadingClick(part.title);
                                }}
                                className={`flex items-center py-1.5 px-2 rounded-md cursor-pointer transition-colors ${isSelected
                                  ? "bg-[#EAE8DD] text-stone-800 font-semibold"
                                  : "hover:bg-[#F1F0EA]/30 text-gray-500 hover:text-gray-800"
                                  }`}
                                id={`tree-part-row-${part.id}`}
                              >
                                {/* Line Prefix */}
                                <span className={`w-3.5 h-[1.5px] mr-2 flex-shrink-0 ${isSelected ? "bg-stone-700" : "bg-gray-400"
                                  }`} />
                                <span className="text-xs truncate">{part.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* MIDDLE: Scrollable Document Column */}
          <div
            className="flex-1 overflow-auto flex flex-col items-start pt-0 pb-4 pl-4 pr-4 md:pt-0 md:pb-8 md:pl-6 md:pr-6 bg-[#F1F0EA] rounded-none border border-transparent min-w-0 h-full scrollbar-thin"
            id="document-column-container"
          >
            {/* Zoom scaling wrapper (provides layout size matching the scale) */}
            <div
              className="transition-all duration-300 flex-shrink-0 ml-0"
              style={{
                width: `calc(${PAGE_DIMENSIONS[pageDimension].width} * ${zoomLevel / 100})`,
                height: `calc(${PAGE_DIMENSIONS[pageDimension].minHeight} * ${zoomLevel / 100})`,
                marginBottom: "6rem"
              }}
              id="zoom-scaling-layout-wrapper"
            >
              {/* The Document Page / Paper Sheet */}
              <div
                className="bg-white rounded-none p-12 md:p-16 shadow-[-16px_24px_32px_-12px_rgba(0,0,0,0.55),_-6px_8px_16px_-8px_rgba(0,0,0,0.35)] relative flex flex-col flex-shrink-0"
                style={{
                  width: PAGE_DIMENSIONS[pageDimension].width,
                  minHeight: PAGE_DIMENSIONS[pageDimension].minHeight,
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top left",
                  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  fontFamily: fontFamily === 'Inter' ? 'var(--font-sans)' : fontFamily === 'Playfair Display' ? 'var(--font-serif)' : fontFamily === 'JetBrains Mono' ? 'var(--font-mono)' : 'sans-serif',
                  fontSize: `${fontSize}px`
                }}
                id="physical-paper-sheet"
              >


                {/* TipTap Rich Text Editor Container */}
                <div className="w-full prose max-w-none prose-slate" id="tiptap-text-editor-container">
                  {editor ? (
                    <EditorContent editor={editor} className="outline-none min-h-[400px]" />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400" id="editor-loading-placeholder">
                      <Loader2 className="animate-spin text-gray-300 mb-2" size={32} />
                      <p className="text-sm font-mono tracking-wider">Mounting ProseMirror...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Hynki Column */}
          {isChatOpen && (
            <div
              className="w-[300px] flex-shrink-0 bg-[#FAF9F5] text-stone-800 flex flex-col border border-[#E1DFD5] rounded-lg shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] overflow-hidden h-full z-10"
              id="right-chat-pane"
            >
              {/* Header toolbar */}
              <div className="h-14 px-4 border-b border-[#E1DFD5]/60 flex items-center justify-between flex-shrink-0" id="chat-header-toolbar">
                <div className="flex items-center space-x-2">
                  <Sparkles size={16} className="text-amber-700" />
                  <span className="text-xs font-mono uppercase tracking-widest text-stone-500">Hynki</span>
                </div>

                <div className="flex items-center space-x-4 text-stone-500" id="chat-action-icons">
                  <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={`hover:text-gray-900 transition-colors p-1 rounded-md ${isHistoryOpen ? "text-stone-800 bg-[#EAE8DD]" : ""}`}
                    title="Document History Snapshots"
                    id="action-history"
                  >
                    <History size={17} />
                  </button>
                  <button
                    onClick={resetWorkspace}
                    className="hover:text-gray-900 transition-colors p-1 rounded-md"
                    title="Reset Workspace"
                    id="action-reset"
                  >
                    <RefreshCcw size={15} />
                  </button>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="hover:text-gray-900 transition-colors p-1 rounded-md ml-1 border-l border-[#E1DFD5]/60 pl-2"
                    title="Close Hynki"
                    id="action-close-chat"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Slide-out Document History Snapshots */}
              {isHistoryOpen && (
                <div className="bg-[#FAF9F5]/95 border-b border-[#E1DFD5] p-4 animate-slide-up flex flex-col space-y-3 z-10 max-h-[300px] overflow-y-auto" id="document-history-drawer">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-stone-500 tracking-wider">Document Revision History</span>
                    <button onClick={() => setIsHistoryOpen(false)} className="text-stone-400 hover:text-stone-700">
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-normal">
                    Restore specific milestones offline from IndexedDB to experiment with the document structure:
                  </p>
                  <div className="space-y-1.5">
                    {HISTORICAL_VERSIONS.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => restoreSnapshot(v)}
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
              )}

              {/* Scrollable Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6" id="chat-scroller">

                {/* Welcome Message Info */}
                <div className="bg-[#F5F4EE] border border-[#E1DFD5] p-4 rounded-lg flex items-start space-x-3 text-xs text-stone-700 shadow-xs" id="welcome-chat-box">
                  <Info size={14} className="text-stone-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="leading-relaxed">
                      Welcome to your interactive document editor. This chat is wired to standard <strong>Hynki AI</strong> to edit text, structure sections, and toggle document features directly.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      <button
                        onClick={() => handleSendMessage(undefined, "Add a section about Governing Law")}
                        className="bg-white hover:bg-[#EAE8DD] text-stone-700 border border-[#D1CFC5] px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-colors shadow-2xs"
                      >
                        + Add Governing Law
                      </button>
                      <button
                        onClick={() => handleSendMessage(undefined, "Set the assignor to Seb")}
                        className="bg-white hover:bg-[#EAE8DD] text-stone-700 border border-[#D1CFC5] px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-colors shadow-2xs"
                      >
                        ✎ Set Assignor to Seb
                      </button>
                      <button
                        onClick={() => handleSendMessage(undefined, "Toggle the top sphere logo off")}
                        className="bg-white hover:bg-[#EAE8DD] text-stone-700 border border-[#D1CFC5] px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-colors shadow-2xs"
                      >
                        👁 Toggle Logo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat Feeds */}
                {chatMessages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col space-y-1.5 ${msg.sender === "user" ? "items-end" : "items-start"}`}
                    id={`message-${msg.id}`}
                  >
                    {/* Message Bubble */}
                    {msg.sender === "user" ? (
                      <div className="bg-stone-700 text-white px-4 py-2.5 rounded-lg rounded-tr-xs text-sm max-w-[85%] shadow-md leading-relaxed">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="text-gray-700 text-sm max-w-[95%] leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </div>
                    )}

                    {/* Action Widget Pills (Exact image replica) */}
                    {msg.widget && (
                      <div className="w-full my-1" id={`widget-${msg.id}`}>
                        {msg.widget.type === "governing-law" ? (
                          <button
                            onClick={() => highlightDocumentSection("Governing Law")}
                            className="inline-flex items-center space-x-1.5 bg-[#FAF9F5] hover:bg-[#EAE8DD] text-xs text-stone-700 py-2.5 px-3.5 rounded-md transition-all border border-[#E1DFD5] shadow-2xs font-medium"
                          >
                            <span className="text-stone-400 font-mono">▸</span>
                            <span className="font-medium">{msg.widget.label}</span>
                            <span className="text-stone-400 text-[10px] ml-1">›</span>
                          </button>
                        ) : msg.widget.type === "assignor-set" ? (
                          <button
                            onClick={() => highlightDocumentSection("Sebastian Cornelius")}
                            className="inline-flex items-center space-x-1.5 bg-[#FAF9F5] hover:bg-[#EAE8DD] text-xs text-stone-700 py-2.5 px-3.5 rounded-md transition-all border border-[#E1DFD5] shadow-2xs font-medium"
                          >
                            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                              SC
                            </div>
                            <span className="font-medium text-emerald-700">{msg.widget.label}</span>
                            <span className="text-stone-400 text-[10px] ml-1">›</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => highlightDocumentSection(msg.widget?.label || "")}
                            className="inline-flex items-center space-x-1.5 bg-[#FAF9F5] hover:bg-[#EAE8DD] text-xs text-stone-700 py-2.5 px-3.5 rounded-md transition-all border border-[#E1DFD5] shadow-2xs font-medium"
                          >
                            <span className="font-medium">{msg.widget.label}</span>
                            <span className="text-stone-400 text-[10px] ml-1">›</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* AI Generation Loader */}
                {isGenerating && (
                  <div className="flex flex-col items-start space-y-1" id="chat-ai-loader">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 font-mono animate-pulse">
                      <Loader2 size={13} className="animate-spin text-stone-700" />
                      <span>AI is rewriting document...</span>
                    </div>
                  </div>
                )}

                {/* Empty scroll target */}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Area */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-[#E1DFD5]/60 flex-shrink-0 bg-[#F1F0EA]/50"
                id="chat-input-form"
              >
                <div className="bg-white rounded-lg flex flex-col p-2 border border-[#E1DFD5] focus-within:border-stone-400 focus-within:ring-2 focus-within:ring-stone-100 transition-all shadow-xs" id="input-container-box">
                  {/* Main text input field */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask anything..."
                    className="bg-transparent text-sm text-stone-800 placeholder-stone-400 px-2 py-1.5 outline-none w-full"
                    disabled={isGenerating}
                    id="input-text-field"
                  />

                  {/* Tool buttons and send container */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 px-1" id="input-toolbar-row">
                    <div className="flex items-center space-x-1 text-stone-400">
                      <button
                        type="button"
                        className="p-1.5 hover:text-stone-700 hover:bg-[#F1F0EA] rounded-md transition-colors text-stone-400"
                        title="Attach asset (not implemented)"
                        id="btn-attach"
                      >
                        <Paperclip size={14} />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 hover:text-stone-700 hover:bg-[#F1F0EA] rounded-md transition-colors text-stone-400"
                        title="Voice dictation (not implemented)"
                        id="btn-voice"
                      >
                        <Mic size={14} />
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={!inputText.trim() || isGenerating}
                      className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${inputText.trim() && !isGenerating
                        ? "bg-stone-700 text-white hover:bg-stone-800"
                        : "bg-stone-100 text-stone-300 cursor-not-allowed"
                        }`}
                      id="btn-send"
                    >
                      <SendHorizontal size={14} />
                    </button>
                  </div>
                </div>
              </form>

            </div>
          )}

        </div>

        {/* Beautiful Interactive Share Modal */}
        <AnimatePresence>
          {isShareModalOpen && (
            <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#FAF9F5] border border-[#E1DFD5] w-full max-w-md rounded-xl shadow-2xl overflow-hidden text-stone-800"
                id="share-modal-container"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-[#E1DFD5]/60 flex items-center justify-between bg-white">
                  <h3 className="text-base font-semibold font-sans text-stone-800">Share "{docTitle || "Document"}"</h3>
                  <button
                    onClick={() => {
                      setIsShareModalOpen(false);
                      setShareLinkCopied(false);
                    }}
                    className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 space-y-4">
                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-500 font-mono uppercase tracking-wider">Add people, groups, or calendar events</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Enter email address..."
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        className="flex-1 bg-white border border-[#E1DFD5] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-stone-700 font-sans"
                      />
                      <select
                        value={shareRole}
                        onChange={(e) => setShareRole(e.target.value as any)}
                        className="bg-white border border-[#E1DFD5] rounded-lg px-2 py-2 text-xs text-stone-600 focus:outline-none"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="commenter">Commenter</option>
                        <option value="editor">Editor</option>
                      </select>
                    </div>
                  </div>

                  {/* Shared users list (Simulated) */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-stone-500 font-mono uppercase tracking-wider block">People with access</span>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center">NM</div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-stone-800">Nilanjan Mridha (You)</span>
                            <span className="text-[10px] text-stone-400">nilanjanmridha89@gmail.com</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-stone-500 font-medium bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 uppercase">Owner</span>
                      </div>

                      {shareEmail.trim().includes("@") && (
                        <div className="flex items-center justify-between animate-fade-in">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-stone-300 text-stone-700 font-bold text-[10px] flex items-center justify-center">
                              {shareEmail.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-stone-800">{shareEmail}</span>
                              <span className="text-[10px] text-stone-400 font-sans">Pending invitation</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-blue-600 font-medium capitalize bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">{shareRole}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* General Access Link share */}
                  <div className="border-t border-[#E1DFD5]/60 pt-4 space-y-2">
                    <span className="text-xs font-semibold text-stone-500 font-mono uppercase tracking-wider block">General access</span>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg mt-0.5">
                          <Lock size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-stone-800">Restricted Link</span>
                          <span className="text-[11px] text-stone-400">Only people added can open with this link</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          setShareLinkCopied(true);
                          setTimeout(() => setShareLinkCopied(false), 2000);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer font-sans font-semibold ${shareLinkCopied
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 animate-pulse"
                          : "bg-white text-stone-700 border-[#E1DFD5] hover:bg-stone-50"
                          }`}
                      >
                        {shareLinkCopied ? (
                          <>
                            <Check size={12} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <span>Copy link</span>
                        )}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-white border-t border-[#E1DFD5]/60 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsShareModalOpen(false);
                      setShareLinkCopied(false);
                    }}
                    className="px-4 py-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (shareEmail.trim()) {
                        alert(`Invitation sent to ${shareEmail} with role '${shareRole}'!`);
                      }
                      setIsShareModalOpen(false);
                      setShareLinkCopied(false);
                    }}
                    className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg shadow-xs transition-colors cursor-pointer font-sans"
                  >
                    Done
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}

