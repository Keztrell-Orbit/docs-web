import { Paperclip, Mic, SendHorizontal } from "lucide-react";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  isGenerating: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatInput({ inputText, setInputText, isGenerating, onSubmit }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="p-4 border-t border-[#E1DFD5]/60 flex-shrink-0 bg-[#F1F0EA]/50" id="chat-input-form">
      <div className="bg-white rounded-lg flex flex-col p-2 border border-[#E1DFD5] focus-within:border-stone-400 focus-within:ring-2 focus-within:ring-stone-100 transition-all shadow-xs" id="input-container-box">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask anything..."
          className="bg-transparent text-sm text-stone-800 placeholder-stone-400 px-2 py-1.5 outline-none w-full"
          disabled={isGenerating}
          id="input-text-field"
        />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 px-1" id="input-toolbar-row">
          <div className="flex items-center space-x-1 text-stone-400">
            <button type="button" className="p-1.5 hover:text-stone-700 hover:bg-[#F1F0EA] rounded-md transition-colors text-stone-400" title="Attach asset (not implemented)" id="btn-attach">
              <Paperclip size={14} />
            </button>
            <button type="button" className="p-1.5 hover:text-stone-700 hover:bg-[#F1F0EA] rounded-md transition-colors text-stone-400" title="Voice dictation (not implemented)" id="btn-voice">
              <Mic size={14} />
            </button>
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
              inputText.trim() && !isGenerating
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
  );
}
