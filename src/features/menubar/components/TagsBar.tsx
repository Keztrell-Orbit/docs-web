import { Tag, Plus, X } from "lucide-react";

interface TagsBarProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  isAddingTag: boolean;
  setIsAddingTag: (adding: boolean) => void;
  newTagVal: string;
  setNewTagVal: (val: string) => void;
}

const TAG_COLORS: Record<string, string> = {
  Marketing: "bg-blue-600",
  "Q1 2024": "bg-cyan-500",
};

function getTagColor(tag: string): string {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag];
  const colors = ["bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-pink-500", "bg-rose-500", "bg-teal-500"];
  const index = Math.abs(tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
  return colors[index];
}

export function TagsBar({ tags, setTags, isAddingTag, setIsAddingTag, newTagVal, setNewTagVal }: TagsBarProps) {
  return (
    <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto scrollbar-none shrink-0" id="menubar-tags-bar">
      <div className="p-1 text-stone-400 bg-stone-200/30 rounded-md" title="Interactive Document Tags">
        <Tag size={13} />
      </div>

      {tags.map((tag) => (
        <div
          key={tag}
          className="flex items-center bg-white hover:bg-stone-100 border border-[#E1DFD5]/70 rounded px-2 py-0.5 text-stone-700 text-[11px] font-sans transition-colors"
          id={`document-tag-${tag}`}
        >
          <span className={`w-1 h-3.5 rounded-sm ${getTagColor(tag)} mr-1.5`} />
          <span className="font-medium mr-1.5">{tag}</span>
          <button
            onClick={() => setTags(tags.filter(t => t !== tag))}
            className="hover:bg-stone-200 text-stone-400 hover:text-stone-700 rounded-full p-0.5 transition-colors cursor-pointer flex items-center justify-center"
            title={`Remove ${tag}`}
          >
            <X size={10} />
          </button>
        </div>
      ))}

      {isAddingTag ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newTagVal.trim() && !tags.includes(newTagVal.trim())) {
              setTags([...tags, newTagVal.trim()]);
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
  );
}
