import type { LayoutTree } from "../../layout-engine/types.ts";
import { Page } from "../../renderer/components/Page.tsx";

interface WorkspaceProps {
  layoutTree: LayoutTree;
}

export function Workspace({ layoutTree }: WorkspaceProps) {
  return (
    <div className="w-screen h-screen bg-[#e1e3e5] overflow-y-auto">
      <div className="flex flex-col items-center gap-8 py-8">
        {layoutTree.pages.map((page) => (
          <Page key={page.index} page={page} />
        ))}
      </div>
    </div>
  );
}
