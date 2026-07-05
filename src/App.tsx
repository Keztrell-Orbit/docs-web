import { createSampleDocument } from "./features/document/model.ts";
import { placeholderBlockMeasurer } from "./features/document/services/blockMeasurer.ts";
import { A4, defaultMargins } from "./features/layout-engine/geometry/PageGeometry.ts";
import { useLayoutTree } from "./features/layout-engine/hooks/useLayoutTree.ts";
import { Workspace } from "./features/workspace/components/Workspace.tsx";

export default function App() {
  const document = createSampleDocument();
  const layoutTree = useLayoutTree(document, A4, defaultMargins, placeholderBlockMeasurer);

  return <Workspace layoutTree={layoutTree} />;
}
