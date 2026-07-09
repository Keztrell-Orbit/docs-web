import type { LayoutTree } from "../layout/types.ts";
import type { DomBlockMeasurement } from "./hooks/useDomMeasurements.ts";
import { PageRenderer } from "./PageRenderer.tsx";

interface WorkspaceRendererProps {
  tree: LayoutTree;
  debugLayout?: boolean;
  domMeasurements?: DomBlockMeasurement[];
}

export function WorkspaceRenderer({
  tree,
  debugLayout,
  domMeasurements,
}: WorkspaceRendererProps) {
  return (
    <div className="w-screen h-screen bg-[#e1e3e5] overflow-y-auto">
      <div className="flex flex-col items-center gap-8 py-8">
        {tree.pages.map((page) => (
          <PageRenderer
            key={page.id}
            page={page}
            debugLayout={debugLayout}
            domMeasurements={domMeasurements}
          />
        ))}
      </div>
    </div>
  );
}
