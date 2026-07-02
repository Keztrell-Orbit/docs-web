import { motion, AnimatePresence } from "motion/react";
import { X, Check, Lock } from "@phosphor-icons/react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  docTitle: string;
  shareEmail: string;
  setShareEmail: (email: string) => void;
  shareRole: "viewer" | "commenter" | "editor";
  setShareRole: (role: "viewer" | "commenter" | "editor") => void;
  shareLinkCopied: boolean;
  setShareLinkCopied: (copied: boolean) => void;
}

export function ShareModal({
  isOpen,
  onClose,
  docTitle,
  shareEmail,
  setShareEmail,
  shareRole,
  setShareRole,
  shareLinkCopied,
  setShareLinkCopied,
}: ShareModalProps) {
  const handleClose = () => {
    onClose();
    setShareLinkCopied(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#FAF9F5] border border-[#E1DFD5] w-full max-w-md rounded-none shadow-2xl overflow-hidden text-stone-800"
            id="share-modal-container"
          >
            <div className="p-5 border-b border-[#E1DFD5]/60 flex items-center justify-between bg-white">
              <h3 className="text-base font-semibold font-sans text-stone-800">Share &ldquo;{docTitle || "Document"}&rdquo;</h3>
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-500 font-mono uppercase tracking-wider">Add people, groups, or calendar events</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email address..."
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="flex-1 bg-white border border-[#E1DFD5] rounded-none px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-stone-700 font-sans"
                  />
                  <select
                    value={shareRole}
                    onChange={(e) => setShareRole(e.target.value as any)}
                    className="bg-white border border-[#E1DFD5] rounded-none px-2 py-2 text-xs text-stone-600 focus:outline-none"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="commenter">Commenter</option>
                    <option value="editor">Editor</option>
                  </select>
                </div>
              </div>

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

              <div className="border-t border-[#E1DFD5]/60 pt-4 space-y-2">
                <span className="text-xs font-semibold text-stone-500 font-mono uppercase tracking-wider block">General access</span>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-none mt-0.5">
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
                    className={`text-xs px-3 py-1.5 rounded-none border transition-all flex items-center gap-1 cursor-pointer font-sans font-semibold ${
                      shareLinkCopied
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

            <div className="p-4 bg-white border-t border-[#E1DFD5]/60 flex justify-end gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (shareEmail.trim()) {
                    alert(`Invitation sent to ${shareEmail} with role '${shareRole}'!`);
                  }
                  handleClose();
                }}
                className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 font-semibold rounded-none shadow-xs transition-colors cursor-pointer font-sans"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
