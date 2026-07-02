import { Sparkle, ClockCounterClockwise, ArrowClockwise, X } from "@phosphor-icons/react";
import type { DocSnapshot } from "../../../types";
import { HistoryDrawer } from "./HistoryDrawer";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

interface Widget {
  type: string;
  label: string;
}

interface ChatMessageData {
  id: string;
  sender: "user" | "assistant";
  text: string;
  widget?: Widget;
  timestamp: number;
}

interface HynkiPanelProps {
  isChatOpen: boolean;
  isGenerating: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  chatMessages: ChatMessageData[] | undefined;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  onSendMessage: (e?: React.FormEvent, customPrompt?: string) => void;
  onResetWorkspace: () => void;
  onClose: () => void;
  onHighlightSection: (keyword: string) => void;
  onRestoreSnapshot: (snapshot: DocSnapshot) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  historicalVersions: DocSnapshot[];
}

export function HynkiPanel({
  isChatOpen, isGenerating, inputText, setInputText,
  chatMessages, isHistoryOpen, setIsHistoryOpen,
  onSendMessage, onResetWorkspace, onClose,
  onHighlightSection, onRestoreSnapshot, chatEndRef,
  historicalVersions,
}: HynkiPanelProps) {
  if (!isChatOpen) return null;

  return (
    <div
      className="w-[300px] flex-shrink-0 bg-[#FAF9F5] text-stone-800 flex flex-col border border-[#E1DFD5] rounded-none shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] overflow-hidden h-full z-10"
      id="right-chat-pane"
    >
      <div className="h-14 px-4 border-b border-[#E1DFD5]/60 flex items-center justify-between flex-shrink-0" id="chat-header-toolbar">
        <div className="flex items-center space-x-2">
          <Sparkle size={16} className="text-amber-700" />
          <span className="text-xs font-mono uppercase tracking-widest text-stone-500">Hynki</span>
        </div>
        <div className="flex items-center space-x-4 text-stone-500" id="chat-action-icons">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={`hover:text-gray-900 transition-colors p-1 rounded-none ${isHistoryOpen ? "text-stone-800 bg-[#EAE8DD]" : ""}`}
            title="Document History Snapshots"
            id="action-history"
          >
            <ClockCounterClockwise size={17} />
          </button>
          <button
            onClick={onResetWorkspace}
            className="hover:text-gray-900 transition-colors p-1 rounded-none"
            title="Reset Workspace"
            id="action-reset"
          >
            <ArrowClockwise size={15} />
          </button>
          <button
            onClick={onClose}
            className="hover:text-gray-900 transition-colors p-1 rounded-none ml-1 border-l border-[#E1DFD5]/60 pl-2"
            title="Close Hynki"
            id="action-close-chat"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        versions={historicalVersions}
        onRestore={onRestoreSnapshot}
      />

      <ChatMessages
        messages={chatMessages}
        isGenerating={isGenerating}
        onSendMessage={onSendMessage}
        onHighlightSection={onHighlightSection}
        chatEndRef={chatEndRef}
      />

      <ChatInput
        inputText={inputText}
        setInputText={setInputText}
        isGenerating={isGenerating}
        onSubmit={onSendMessage}
      />
    </div>
  );
}
