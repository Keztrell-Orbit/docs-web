import { useState, useEffect, useRef, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { LexicalEditor } from "lexical";
import { $getRoot } from "lexical";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { db, seedDatabase } from "./db";
import { EditorProvider } from "./contexts/EditorContext";
import { useChatScroll, useOutline } from "./hooks";
import { MenuBar, ShareModal, SettingsModal, HISTORICAL_VERSIONS } from "./features/menubar";
import { FormatToolbar } from "./features/toolbar";
import { OutlinePanel } from "./features/outline";
import { DocumentEditor } from "./features/document";
import { HynkiPanel } from "./features/hynki";
import { createConversation, sendMessage, listModels } from "./api/chat";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isOfflineSaved, setIsOfflineSaved] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<LexicalEditor | null>(null);

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

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const defaultApiKeys = { gemini: { enabled: false, key: "" }, openai: { enabled: false, key: "" }, claude: { enabled: false, key: "" }, openrouter: { enabled: false, key: "" } };
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const saved = localStorage.getItem("byok-settings");
      return saved ? JSON.parse(saved) : defaultApiKeys;
    } catch {
      return defaultApiKeys;
    }
  });

  const handleSaveSettings = useCallback((newKeys: typeof apiKeys) => {
    setApiKeys(newKeys);
    localStorage.setItem("byok-settings", JSON.stringify(newKeys));

    const enabled = Object.entries(newKeys).filter(([, v]) => v.enabled && v.key.length > 0);
    for (const [provider, config] of enabled) {
      listModels(provider, config.key)
        .then((models) => {
          setAvailableModels((prev) => ({ ...prev, [provider]: models }));
        })
        .catch(() => {
          // fall back to default model list if fetch fails
        });
    }
  }, []);

  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = localStorage.getItem("selected-model");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return { provider: "gemini", model: "gemini-3.5-flash" };
  });

  const [availableModels, setAvailableModels] = useState<Record<string, { id: string; name?: string }[]>>({});

  const handleModelChange = useCallback((model: { provider: string; model: string }) => {
    setSelectedModel(model);
    localStorage.setItem("selected-model", JSON.stringify(model));
  }, []);

  const currentDoc = useLiveQuery(() => db.documents.get("doc-default"));
  const chatMessages = useLiveQuery(() => db.chats.orderBy("timestamp").toArray());

  const outlineData = useOutline(currentDoc?.content);

  useChatScroll(chatEndRef, chatMessages, isGenerating);

  useEffect(() => {
    seedDatabase();
  }, []);

  useEffect(() => {
    setIsOfflineSaved(true);
  }, [currentDoc]);

  const handleEditorReady = useCallback((editor: LexicalEditor) => {
    editorRef.current = editor;
  }, []);

  const handleTitleChange = useCallback(async (newTitle: string) => {
    setDocTitle(newTitle);
    setIsOfflineSaved(false);
    await db.documents.update("doc-default", {
      title: newTitle,
      updatedAt: Date.now(),
    });
    setTimeout(() => setIsOfflineSaved(true), 400);
  }, []);

  const applyDocumentContent = useCallback((html: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      root.append(...nodes);
    });
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
    let convId = conversationId;

    await db.chats.add({
      id: userMessageId,
      sender: "user",
      text: promptToSend,
      timestamp: Date.now(),
    });

    setIsGenerating(true);

    try {
      if (!convId) {
        const newConv = await createConversation();
        convId = newConv;
        setConversationId(convId);
      }

      const editor = editorRef.current;
      const docHtml = editor
        ? editor.getEditorState().read(() => $generateHtmlFromNodes(editor, null))
        : currentDoc?.content || "";
      const docTitleVal = currentDoc?.title || "Document";

      const activeProvider = selectedModel.provider;
      const activeApiKey = apiKeys[activeProvider]?.enabled ? apiKeys[activeProvider].key : undefined;

      const data = await sendMessage(convId, promptToSend, {
        documentContent: docHtml,
        documentTitle: docTitleVal,
        provider: activeProvider,
        model: selectedModel.model,
        apiKey: activeApiKey,
      });

      let textContent = data.content;

      const docMatch = textContent.match(/---doc-start---([\s\S]*?)---doc-end---/);
      if (docMatch) {
        const docHtmlContent = docMatch[1].trim();
        textContent = textContent.replace(/---doc-start---[\s\S]*?---doc-end---/g, "").trim();
        applyDocumentContent(docHtmlContent);
      }

      const widgetMatch = textContent.match(/---widget:(\{.*?\})---/);
      let widget: { type: string; label: string } | undefined;

      if (widgetMatch) {
        try {
          widget = JSON.parse(widgetMatch[1]);
          textContent = textContent.replace(widgetMatch[0], "").trim();
        } catch { /* ignore parse errors */ }
      }

      await db.chats.add({
        id: assistantMessageId,
        sender: "assistant",
        text: textContent,
        widget: widget as any,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error(err);
      await db.chats.add({
        id: assistantMessageId,
        sender: "assistant",
        text: `Error: ${err.message || "Something went wrong communicating with AI."}`,
        timestamp: Date.now(),
      });
    } finally {
      setIsGenerating(false);
    }
  }, [inputText, isGenerating, currentDoc, conversationId, selectedModel, apiKeys, applyDocumentContent]);

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
      setConversationId(null);
      await db.chats.clear();
      await db.documents.clear();
      await seedDatabase();
      window.location.reload();
    }
  }, []);

  const handleHeadingClick = useCallback((title: string) => {
    const editorEl = document.querySelector("#lexical-editor-input");
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
    const editorEl = document.querySelector("#lexical-editor-input");
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
        <EditorProvider
          initialContent={currentDoc?.content}
          onEditorReady={handleEditorReady}
        >
          <MenuBar
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
            setIsSettingsModalOpen={setIsSettingsModalOpen}
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
              pageDimension={pageDimension}
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
              apiKeys={apiKeys}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              availableModels={availableModels}
            />
          </div>
        </EditorProvider>

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

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={apiKeys}
          onSave={handleSaveSettings}
        />
      </div>
    </div>
  );
}
