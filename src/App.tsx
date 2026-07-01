import { useState, useEffect, useRef, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, seedDatabase } from "./db";
import { useEditorInit, usePagination, useDocSync, useChatScroll, useOutline } from "./hooks";
import { MenuBar, ShareModal, HISTORICAL_VERSIONS } from "./features/menubar";
import { FormatToolbar } from "./features/toolbar";
import { OutlinePanel } from "./features/outline";
import { DocumentEditor } from "./features/document";
import { HynkiPanel } from "./features/hynki";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isOfflineSaved, setIsOfflineSaved] = useState(true);
  const [pageCount, setPageCount] = useState(1);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [selectedPartId, setSelectedPartId] = useState<string>("");

  const [pageDimension, _setPageDimension] = useState<"A4" | "A5" | "A6" | "Letter">("A4");
  const [zoomLevel, setZoomLevel] = useState<number>(75);
  const [isStarred, setIsStarred] = useState<boolean>(false);
  const [fontFamily, setFontFamily] = useState<string>("Inter");
  const [fontSize, setFontSize] = useState<number>(14);
  const [docTitle, setDocTitle] = useState("");
  const [menuSearchQuery, setMenuSearchQuery] = useState("");

  const [isMenubarCollapsed, setIsMenubarCollapsed] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>(["Marketing", "Q1 2024"]);
  const [isAddingTag, setIsAddingTag] = useState<boolean>(false);
  const [newTagVal, setNewTagVal] = useState<string>("");
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareEmail, setShareEmail] = useState<string>("");
  const [shareRole, setShareRole] = useState<"viewer" | "commenter" | "editor">("editor");
  const [shareLinkCopied, setShareLinkCopied] = useState<boolean>(false);

  const currentDoc = useLiveQuery(() => db.documents.get("doc-default"));
  const chatMessages = useLiveQuery(() => db.chats.orderBy("timestamp").toArray());

  const outlineData = useOutline(currentDoc?.content);

  const editor = useEditorInit();
  const computedPageCount = usePagination(editor, pageDimension);

  useEffect(() => {
    setPageCount(computedPageCount);
  }, [computedPageCount]);

  useDocSync(editor, currentDoc, docTitle, setDocTitle);
  useChatScroll(chatEndRef, chatMessages, isGenerating);

  useEffect(() => {
    seedDatabase();
  }, []);

  useEffect(() => {
    setIsOfflineSaved(true);
  }, [currentDoc]);

  const handleTitleChange = useCallback(async (newTitle: string) => {
    setDocTitle(newTitle);
    setIsOfflineSaved(false);
    await db.documents.update("doc-default", {
      title: newTitle,
      updatedAt: Date.now(),
    });
    setTimeout(() => setIsOfflineSaved(true), 400);
  }, []);

  const handleSendMessage = useCallback(async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || inputText;
    if (!promptToSend.trim() || isGenerating) return;

    if (!customPrompt) {
      setInputText("");
    }

    const userMessageId = `msg-user-${Date.now()}`;
    const assistantMessageId = `msg-assistant-${Date.now()}`;

    await db.chats.add({
      id: userMessageId,
      sender: "user",
      text: promptToSend,
      timestamp: Date.now(),
    });

    setIsGenerating(true);

    try {
      const docHtml = editor?.getHTML() || currentDoc?.content || "";
      const docTitleVal = currentDoc?.title || "Document";
      const hasLogo = currentDoc?.showLogo || false;

      const history = chatMessages?.map((m) => ({
        sender: m.sender,
        text: m.text,
      })) || [];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptToSend,
          history,
          currentContent: docHtml,
          currentTitle: docTitleVal,
          showLogo: hasLogo,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI Assistant.");
      }

      const data = await response.json();

      await db.documents.update("doc-default", {
        content: data.updatedContent,
        showLogo: data.updatedShowLogo,
        updatedAt: Date.now(),
      });

      await db.chats.add({
        id: assistantMessageId,
        sender: "assistant",
        text: data.text,
        widget: data.widget,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error(err);
      await db.chats.add({
        id: assistantMessageId,
        sender: "assistant",
        text: `Error: ${err.message || "Something went wrong while applying edits."}`,
        timestamp: Date.now(),
      });
    } finally {
      setIsGenerating(false);
    }
  }, [inputText, isGenerating, editor, currentDoc, chatMessages]);

  const restoreSnapshot = useCallback(async (snapshot: typeof HISTORICAL_VERSIONS[0]) => {
    setIsOfflineSaved(false);
    await db.documents.update("doc-default", {
      content: snapshot.content,
      showLogo: snapshot.showLogo,
      updatedAt: Date.now(),
    });
    await db.chats.add({
      id: `restore-${Date.now()}`,
      sender: "assistant",
      text: `Restored document to: "${snapshot.label}".`,
      timestamp: Date.now(),
    });
    setIsHistoryOpen(false);
    setTimeout(() => setIsOfflineSaved(true), 400);
  }, []);

  const resetWorkspace = useCallback(async () => {
    if (confirm("Would you like to reset the workspace document and chat back to original state?")) {
      await db.chats.clear();
      await db.documents.clear();
      await seedDatabase();
      window.location.reload();
    }
  }, []);

  const handleHeadingClick = useCallback((title: string) => {
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
  }, []);

  const highlightDocumentSection = useCallback((keyword: string) => {
    const editorEl = document.querySelector(".ProseMirror");
    if (!editorEl) return;
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
  }, []);

  return (
    <div className="h-screen w-screen bg-[#F1F0EA] flex flex-col md:flex-row font-sans text-stone-800 antialiased overflow-hidden" id="editor-workspace-container">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 mr-0" id="left-document-pane">
        <MenuBar
          editor={editor}
          docTitle={docTitle}
          handleTitleChange={handleTitleChange}
          isStarred={isStarred}
          setIsStarred={setIsStarred}
          isMenubarCollapsed={isMenubarCollapsed}
          setIsMenubarCollapsed={setIsMenubarCollapsed}
          isHistoryOpen={isHistoryOpen}
          setIsHistoryOpen={setIsHistoryOpen}
          isChatOpen={isChatOpen}
          setIsChatOpen={setIsChatOpen}
          setIsShareModalOpen={setIsShareModalOpen}
          tags={tags}
          setTags={setTags}
          isAddingTag={isAddingTag}
          setIsAddingTag={setIsAddingTag}
          newTagVal={newTagVal}
          setNewTagVal={setNewTagVal}
          restoreSnapshot={restoreSnapshot}
          resetWorkspace={resetWorkspace}
          setInputText={setInputText}
          setZoomLevel={setZoomLevel}
          highlightDocumentSection={highlightDocumentSection}
          isOfflineSaved={isOfflineSaved}
        />

        <FormatToolbar
          editor={editor}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          fontSize={fontSize}
          setFontSize={setFontSize}
          menuSearchQuery={menuSearchQuery}
          setMenuSearchQuery={setMenuSearchQuery}
          isMenubarCollapsed={isMenubarCollapsed}
          setIsMenubarCollapsed={setIsMenubarCollapsed}
        />

        <div
          className="flex-1 flex flex-row items-stretch justify-start gap-6 px-4 md:px-8 overflow-hidden min-h-0 bg-[#F1F0EA]"
          id="side-by-side-workspace-container"
        >
          <OutlinePanel
            outlineData={outlineData}
            expandedChapters={expandedChapters}
            setExpandedChapters={setExpandedChapters}
            selectedPartId={selectedPartId}
            setSelectedPartId={setSelectedPartId}
            handleHeadingClick={handleHeadingClick}
          />

          <DocumentEditor
            editor={editor}
            pageDimension={pageDimension}
            pageCount={pageCount}
            zoomLevel={zoomLevel}
            fontFamily={fontFamily}
            fontSize={fontSize}
          />

          <HynkiPanel
            isChatOpen={isChatOpen}
            isGenerating={isGenerating}
            inputText={inputText}
            setInputText={setInputText}
            chatMessages={chatMessages}
            isHistoryOpen={isHistoryOpen}
            setIsHistoryOpen={setIsHistoryOpen}
            onSendMessage={handleSendMessage}
            onResetWorkspace={resetWorkspace}
            onClose={() => setIsChatOpen(false)}
            onHighlightSection={highlightDocumentSection}
            onRestoreSnapshot={restoreSnapshot}
            chatEndRef={chatEndRef}
            historicalVersions={HISTORICAL_VERSIONS}
          />
        </div>

        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareLinkCopied(false);
          }}
          docTitle={docTitle}
          shareEmail={shareEmail}
          setShareEmail={setShareEmail}
          shareRole={shareRole}
          setShareRole={setShareRole}
          shareLinkCopied={shareLinkCopied}
          setShareLinkCopied={setShareLinkCopied}
        />
      </div>
    </div>
  );
}
