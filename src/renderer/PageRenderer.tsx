import type { LayoutPage } from "../layout/types.ts";
import type { DomBlockMeasurement } from "./hooks/useDomMeasurements.ts";
import { PageContentLayer } from "./PageContentLayer.tsx";

interface PageRendererProps {
  page: LayoutPage;
  debugLayout?: boolean;
  domMeasurements?: DomBlockMeasurement[];
}

export function PageRenderer({
  page,
  debugLayout,
  domMeasurements,
}: PageRendererProps) {
  return (
    <div
      className="bg-white shadow-xl"
      style={{ width: page.width, height: page.height }}
    >
      <div
        style={{
          paddingTop: page.margin.top,
          paddingBottom: page.margin.bottom,
          paddingLeft: page.margin.left,
          paddingRight: page.margin.right,
          width: "100%",
          height: "100%",
        }}
      >
        <PageContentLayer
          pageId={page.id}
          blocks={page.blocks}
          debugLayout={debugLayout}
          domMeasurements={domMeasurements}
        />
      </div>
    </div>
  );
}
