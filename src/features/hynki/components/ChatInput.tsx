import { Paperclip, Microphone, PaperPlaneRight } from "@phosphor-icons/react";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  isGenerating: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatInput({ inputText, setInputText, isGenerating, onSubmit }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="p-4 flex-shrink-0 bg-[#F1F0EA]" id="chat-input-form">
      <div className="bg-white rounded-none flex flex-col p-2 focus-within:ring-2 focus-within:ring-stone-100 transition-all shadow-xs" id="input-container-box">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask anything..."
          className="bg-transparent text-sm text-stone-800 placeholder-stone-400 px-2 py-1.5 outline-none w-full"
          disabled={isGenerating}
          id="input-text-field"
        />
        <div className="flex items-center justify-between mt-2 pt-2 px-1" id="input-toolbar-row">
          <div className="flex items-center space-x-1 text-stone-400">
            <button type="button" className="p-1.5 hover:text-stone-700 hover:bg-[#F1F0EA] rounded-none transition-colors text-stone-400" title="Attach asset (not implemented)" id="btn-attach">
              <Paperclip size={14} />
            </button>
            <button type="button" className="p-1.5 hover:text-stone-700 hover:bg-[#F1F0EA] rounded-none transition-colors text-stone-400" title="Voice dictation (not implemented)" id="btn-voice">
              <Microphone size={14} />
            </button>
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            className={`w-7 h-7 rounded-none flex items-center justify-center transition-all ${
              inputText.trim() && !isGenerating
                ? "bg-stone-700 text-white hover:bg-stone-800"
                : "bg-stone-100 text-stone-300 cursor-not-allowed"
            }`}
            id="btn-send"
          >
            <PaperPlaneRight size={14} />
          </button>
        </div>
      </div>
    </form>
  );
}
