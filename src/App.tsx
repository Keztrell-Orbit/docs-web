import { useState, useEffect, useRef, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { LexicalEditor } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { db, seedDatabase } from "./db";
import { EditorProvider } from "./contexts/EditorContext";
import { useChatScroll, useOutline } from "./hooks";
import { MenuBar, ShareModal, SettingsModal, HISTORICAL_VERSIONS } from "./features/menubar";
import { FormatToolbar } from "./features/toolbar";
import { OutlinePanel } from "./features/outline";
import { DocumentEditor } from "./features/document";
import { HynkiPanel } from "./features/hynki";
import { createConversation, streamConversation, listModels } from "./api/chat";
import { executeTool } from "./features/toolbar/document-tools";
import type { Widget } from "./types/widgets";

function getDisplayText(full: string): string {
  let display = full.replace(/---tool:\{[\s\S]*?\}---/g, "");
  display = display.replace(/---widget:\{[\s\S]*?\}---/g, "");
  const positions = [-1];
  let idx = -1;
  while ((idx = display.indexOf("---tool:", idx + 1)) !== -1) positions.push(idx);
  idx = -1;
  while ((idx = display.indexOf("---widget:", idx + 1)) !== -1) positions.push(idx);
  const lastPos = Math.max(...positions);
  if (lastPos !== -1) {
    const suffix = display.substring(lastPos);
    if (!/^---(tool|widget):\{[\s\S]*?\}---$/.test(suffix)) {
      display = display.substring(0, lastPos);
    }
  }
  return display.trim();
}

export default function App() {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isOfflineSaved, setIsOfflineSaved] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<LexicalEditor | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const streamBufferRef = useRef("");
  const lastWidgetRef = useRef<Widget | null>(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [preGenSnapshot, setPreGenSnapshot] = useState<string | null>(null);

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

  const outlineData = useOutline(currentDoc?.contentHtml || currentDoc?.content);

  useChatScroll(chatEndRef, chatMessages, isGenerating, streamingText);

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

  const handleSendMessage = useCallback(async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || inputText;
    if (!promptToSend.trim() || isGenerating) return;

    if (!customPrompt) setInputText("");

    const userMessageId = `msg-user-${Date.now()}`;
    let convId = conversationId;

    await db.chats.add({
      id: userMessageId,
      sender: "user",
      text: promptToSend,
      timestamp: Date.now(),
    });

    setIsGenerating(true);
    setStreamingText("");
    streamBufferRef.current = "";
    lastWidgetRef.current = null;
    setPendingChanges(false);
    setPreGenSnapshot(null);

    try {
      if (!convId) {
        const newConv = await createConversation();
        convId = newConv;
        setConversationId(convId);
      }

      const editor = editorRef.current;
      const docHtml = editor
        ? editor.getEditorState().read(() => $generateHtmlFromNodes(editor, null))
        : currentDoc?.contentHtml || "";
      const docTitleVal = currentDoc?.title || "Document";

      const activeProvider = selectedModel.provider;
      const activeApiKey = apiKeys[activeProvider]?.enabled ? apiKeys[activeProvider].key : undefined;

      const snap = editor ? editor.getEditorState().toJSON() : null;
      if (snap) setPreGenSnapshot(JSON.stringify(snap));

      streamConversation(
        convId,
        promptToSend,
        (event: any) => {
          if (event.type === "token") {
            streamBufferRef.current += event.content;
            console.log("[stream] token received, buffer length:", streamBufferRef.current.length, "last 100:", event.content?.slice(-100));

            const toolRegex = /---tool:\{[\s\S]*?\}---/g;
            let toolMatch;
            while ((toolMatch = toolRegex.exec(streamBufferRef.current)) !== null) {
              try {
                const jsonStr = toolMatch[0].replace(/^---tool:/, "").replace(/---$/, "");
                const tool = JSON.parse(jsonStr);
                const toolName = tool.name;
                const toolArgs = tool.arguments
                  ? tool.arguments
                  : (() => { const { name, ...rest } = tool; return rest; })();
                console.log("[stream] extracted tool:", toolName, JSON.stringify(toolArgs)?.slice(0, 150));
                if (editor && toolName && toolArgs && Object.keys(toolArgs).length > 0) {
                  executeTool(editor, toolName, toolArgs);
                  setPendingChanges(true);
                } else {
                  console.log("[stream] tool skipped - missing editor/name/args:", !!editor, toolName, !!toolArgs, Object.keys(toolArgs || {}).length);
                }
              } catch (e) {
                console.log("[stream] tool parse error:", e);
              }
            }

            const widgetRegex = /---widget:\{[\s\S]*?\}---/g;
            let widgetMatch;
            while ((widgetMatch = widgetRegex.exec(streamBufferRef.current)) !== null) {
              try {
                const jsonStr = widgetMatch[0].replace(/^---widget:/, "").replace(/---$/, "");
                lastWidgetRef.current = JSON.parse(jsonStr);
              } catch { /* ignore */ }
            }

            setStreamingText(getDisplayText(streamBufferRef.current));
          }
        },
        (error: Error) => {
          console.error(error);
          db.chats.add({
            id: `msg-assistant-${Date.now()}`,
            sender: "assistant",
            text: `Error: ${error.message || "Something went wrong communicating with AI."}`,
            timestamp: Date.now(),
          });
          setIsGenerating(false);
          setStreamingText("");
          setPendingChanges(false);
          setPreGenSnapshot(null);
        },
        () => {
          const finalText = getDisplayText(streamBufferRef.current);
          const widget = lastWidgetRef.current;
          db.chats.add({
            id: `msg-assistant-${Date.now()}`,
            sender: "assistant",
            text: finalText,
            widget: widget || undefined,
            timestamp: Date.now(),
          });
          setIsGenerating(false);
          setStreamingText("");
        },
        {
          documentContent: docHtml,
          documentTitle: docTitleVal,
          provider: activeProvider,
          model: selectedModel.model,
          apiKey: activeApiKey,
        }
      );
    } catch (err: any) {
      console.error(err);
      db.chats.add({
        id: `msg-assistant-${Date.now()}`,
        sender: "assistant",
        text: `Error: ${err.message || "Something went wrong communicating with AI."}`,
        timestamp: Date.now(),
      });
      setIsGenerating(false);
    }
  }, [inputText, isGenerating, currentDoc, conversationId, selectedModel, apiKeys]);

  const handleAcceptChanges = useCallback(() => {
    setPendingChanges(false);
    setPreGenSnapshot(null);
  }, []);

  const handleRejectChanges = useCallback(() => {
    const editor = editorRef.current;
    const snapshot = preGenSnapshot;
    if (editor && snapshot) {
      try {
        const json = JSON.parse(snapshot);
        const editorState = editor.parseEditorState(json);
        editor.setEditorState(editorState);
      } catch { /* ignore */ }
    }
    setPendingChanges(false);
    setPreGenSnapshot(null);
  }, [preGenSnapshot]);

  const restoreSnapshot = useCallback(async (snapshot: typeof HISTORICAL_VERSIONS[0]) => {
    setIsOfflineSaved(false);
    await db.documents.update("doc-default", {
      content: snapshot.content,
      contentHtml: snapshot.content,
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
              isGenerating={isGenerating}
              pendingChanges={pendingChanges}
              onAcceptChanges={handleAcceptChanges}
              onRejectChanges={handleRejectChanges}
            />

            <HynkiPanel
              isChatOpen={isChatOpen}
              isGenerating={isGenerating}
              streamingText={streamingText}
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
