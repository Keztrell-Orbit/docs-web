import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Paperclip, Microphone, PaperPlaneRight, CaretRight, Sparkle } from "@phosphor-icons/react";

const FALLBACK_MODELS: Record<string, string[]> = {
  gemini: ["gemini-3.5-flash", "gemini-3.1-flash-lite"],
  openai: ["gpt-4o-mini", "gpt-4o"],
  claude: ["claude-sonnet-4", "claude-3.5-sonnet"],
  openrouter: ["openrouter/auto"],
};

const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Gemini",
  openai: "OpenAI",
  claude: "Claude",
  openrouter: "OpenRouter",
};

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  isGenerating: boolean;
  onSubmit: (e: React.FormEvent) => void;
  apiKeys: Record<string, { enabled: boolean; key: string }>;
  selectedModel: { provider: string; model: string };
  onModelChange: (model: { provider: string; model: string }) => void;
  availableModels?: Record<string, { id: string; name?: string }[]>;
}

export function ChatInput({
  inputText, setInputText, isGenerating, onSubmit,
  apiKeys, selectedModel, onModelChange, availableModels,
}: ChatInputProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<"providers" | { provider: string }>("providers");
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const configuredProviders = Object.entries(apiKeys)
    .filter(([, v]) => v.enabled && v.key.length > 0)
    .map(([key]) => key);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isMenuOpen]);

  const handleSelectModel = (provider: string, model: string) => {
    onModelChange({ provider, model });
    setIsMenuOpen(false);
  };

  const getProviderModels = (provider: string): string[] => {
    if (availableModels?.[provider]?.length) {
      return availableModels[provider].map((m) => m.id);
    }
    return FALLBACK_MODELS[provider] || [];
  };

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
            {configuredProviders.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  ref={buttonRef}
                  onClick={() => { setIsMenuOpen((prev) => !prev); setMenuView("providers"); }}
                  className={`p-1.5 hover:text-stone-700 hover:bg-[#F1F0EA] rounded-none transition-colors flex items-center gap-1 text-xs cursor-pointer ${
                    isMenuOpen ? "text-stone-700 bg-[#F1F0EA]" : "text-stone-500"
                  }`}
                  title={`Model: ${selectedModel.model}`}
                  id="btn-model-select"
                  disabled={isGenerating}
                >
                  <Sparkle size={14} />
                  <span className="max-w-[72px] truncate">{selectedModel.model}</span>
                </button>
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      ref={menuRef}
                      initial={{ opacity: 0, scaleY: 0.95, y: -4 }}
                      animate={{ opacity: 1, scaleY: 1, y: 0 }}
                      exit={{ opacity: 0, scaleY: 0.95, y: -4 }}
                      transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.6 }}
                      className="absolute bottom-full left-0 mb-2 bg-white border border-[#E1DFD5] shadow-lg min-w-[180px] overflow-hidden z-50"
                      style={{ transformOrigin: "bottom left" }}
                    >
                      {menuView === "providers" ? (
                        <div>
                          {configuredProviders.map((provider) => (
                            <button
                              key={provider}
                              type="button"
                              onClick={() => setMenuView({ provider })}
                              className="w-full flex items-center justify-between px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer text-left"
                            >
                              <span>{PROVIDER_LABELS[provider] || provider}</span>
                              <CaretRight size={12} />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <button
                            type="button"
                            onClick={() => setMenuView("providers")}
                            className="w-full flex items-center gap-1 px-3 py-2 text-xs text-stone-500 hover:bg-stone-50 transition-colors cursor-pointer border-b border-[#E1DFD5]/60"
                          >
                            <CaretRight size={12} className="rotate-180" />
                            <span>{PROVIDER_LABELS[menuView.provider]}</span>
                          </button>
                          {getProviderModels(menuView.provider).map((model) => {
                            const isActive = selectedModel.provider === menuView.provider && selectedModel.model === model;
                            return (
                              <button
                                key={model}
                                type="button"
                                onClick={() => handleSelectModel(menuView.provider, model)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
                                  isActive
                                    ? "text-stone-900 bg-stone-100 font-medium"
                                    : "text-stone-600 hover:bg-stone-50"
                                }`}
                              >
                                <span className="w-3">{isActive ? "\u25CF" : "\u25CB"}</span>
                                <span>{model}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
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
