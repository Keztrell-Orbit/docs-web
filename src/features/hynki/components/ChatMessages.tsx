import { Info, Spinner } from "@phosphor-icons/react";
import type { Widget } from "../../../types/widgets";

interface ChatMessageData {
  id: string;
  sender: "user" | "assistant";
  text: string;
  widget?: Widget;
  timestamp: number;
}

interface ChatMessagesProps {
  messages: ChatMessageData[] | undefined;
  isGenerating: boolean;
  streamingText?: string;
  onSendMessage: (e?: React.FormEvent, customPrompt?: string) => void;
  onHighlightSection: (keyword: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({
  messages, isGenerating, streamingText,
  onSendMessage, onHighlightSection, chatEndRef,
}: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#F1F0EA]" id="chat-scroller">
      <div className="bg-[#F1F0EA] p-4 rounded-none flex items-start space-x-3 text-xs text-stone-700 shadow-xs" id="welcome-chat-box">
        <Info size={14} className="text-stone-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="leading-relaxed">
            Welcome to your interactive document editor. This chat is wired to standard <strong>Hynki AI</strong> to edit text, structure sections, and toggle document features directly.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1">
            <button
              onClick={() => onSendMessage(undefined, "Add a section about Governing Law")}
              className="bg-white hover:bg-[#EAE8DD] text-stone-700 px-2.5 py-1.5 rounded-none text-[10px] font-medium transition-colors shadow-2xs"
            >
              + Add Governing Law
            </button>
            <button
              onClick={() => onSendMessage(undefined, "Set the assignor to Seb")}
              className="bg-white hover:bg-[#EAE8DD] text-stone-700 px-2.5 py-1.5 rounded-none text-[10px] font-medium transition-colors shadow-2xs"
            >
              ✎ Set Assignor to Seb
            </button>
            <button
              onClick={() => onSendMessage(undefined, "Toggle the top sphere logo off")}
              className="bg-white hover:bg-[#EAE8DD] text-stone-700 px-2.5 py-1.5 rounded-none text-[10px] font-medium transition-colors shadow-2xs"
            >
              👁 Toggle Logo
            </button>
          </div>
        </div>
      </div>

      {messages?.map((msg) => (
        <div
          key={msg.id}
          className={`flex flex-col space-y-1.5 ${msg.sender === "user" ? "items-end" : "items-start"}`}
          id={`message-${msg.id}`}
        >
          {msg.sender === "user" ? (
            <div className="bg-stone-700 text-white px-4 py-2.5 rounded-none rounded-none text-sm max-w-[85%] shadow-md leading-relaxed">
              {msg.text}
            </div>
          ) : (
            <div className="text-gray-700 text-sm max-w-[95%] leading-relaxed whitespace-pre-wrap">
              {msg.text}
            </div>
          )}

          {msg.widget && (
            <div className="w-full my-1" id={`widget-${msg.id}`}>
              {msg.widget.question && (
                <p className="text-xs text-stone-500 mb-2">{msg.widget.question}</p>
              )}
              {msg.widget.type === "governing-law" ? (
                <button
                  onClick={() => onHighlightSection("Governing Law")}
                  className="inline-flex items-center space-x-1.5 bg-[#FAF9F5] hover:bg-[#EAE8DD] text-xs text-stone-700 py-2.5 px-3.5 rounded-none transition-all shadow-2xs font-medium"
                >
                  <span className="text-stone-400 font-mono">▸</span>
                  <span className="font-medium">{msg.widget.label}</span>
                  <span className="text-stone-400 text-[10px] ml-1">›</span>
                </button>
              ) : msg.widget.type === "assignor-set" ? (
                <button
                  onClick={() => onHighlightSection("Sebastian Cornelius")}
                  className="inline-flex items-center space-x-1.5 bg-[#FAF9F5] hover:bg-[#EAE8DD] text-xs text-stone-700 py-2.5 px-3.5 rounded-none transition-all shadow-2xs font-medium"
                >
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center justify-center flex-shrink-0">SC</div>
                  <span className="font-medium text-emerald-700">{msg.widget.label}</span>
                  <span className="text-stone-400 text-[10px] ml-1">›</span>
                </button>
              ) : msg.widget.type === "picker" && msg.widget.options ? (
                <div className="flex flex-wrap gap-2">
                  {msg.widget.options.map((opt) => {
                    const isHex = /^#[0-9A-Fa-f]{6}$/.test(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => onSendMessage(undefined, `Use ${opt.label} (${opt.value})`)}
                        className="inline-flex items-center gap-1.5 bg-white hover:bg-[#EAE8DD] text-xs text-stone-700 py-2 px-3 rounded-none transition-all shadow-2xs font-medium border border-[#E1DFD5]"
                      >
                        {isHex ? (
                          <span className="w-3.5 h-3.5 rounded-full border border-stone-300 flex-shrink-0" style={{ backgroundColor: opt.value }} />
                        ) : null}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <button
                  onClick={() => onHighlightSection(msg.widget?.label || "")}
                  className="inline-flex items-center space-x-1.5 bg-[#FAF9F5] hover:bg-[#EAE8DD] text-xs text-stone-700 py-2.5 px-3.5 rounded-none transition-all shadow-2xs font-medium"
                >
                  <span className="font-medium">{msg.widget.label}</span>
                  <span className="text-stone-400 text-[10px] ml-1">›</span>
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {isGenerating && streamingText ? (
        <div className="flex flex-col items-start space-y-1.5" id="chat-streaming-message">
          <div className="text-gray-700 text-sm max-w-[95%] leading-relaxed whitespace-pre-wrap">
            {streamingText}
            <span className="inline-flex w-[2px] h-[1em] ml-0.5 bg-stone-700 animate-pulse align-text-bottom" />
          </div>
        </div>
      ) : isGenerating && !streamingText ? (
        <div className="flex flex-col items-start space-y-1" id="chat-ai-loader">
          <div className="flex items-center space-x-2 text-xs text-gray-500 font-mono animate-pulse">
            <Spinner size={13} className="animate-spin text-stone-700" />
            <span>AI is rewriting document...</span>
          </div>
        </div>
      ) : null}

      <div ref={chatEndRef} />
    </div>
  );
}
