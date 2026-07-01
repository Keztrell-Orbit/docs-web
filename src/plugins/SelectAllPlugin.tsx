import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $selectAll, $getRoot } from "lexical";

export function SelectAllPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isModA = (e.ctrlKey || e.metaKey) && e.key === "a";

      if (!isModA) return;

      e.preventDefault();

      editor.update(() => {
        const root = $getRoot();
        if (root.getChildren().length > 0) {
          $selectAll();
        }
      });
    };

    rootEl.addEventListener("keydown", handleKeyDown);

    return () => {
      rootEl.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor]);

  return null;
}
