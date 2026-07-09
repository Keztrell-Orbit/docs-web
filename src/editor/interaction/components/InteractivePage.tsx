import { useInteractionContext } from "../core/InteractionContext.tsx";
import { PageRenderer } from "../../../renderer/PageRenderer.tsx";
import type { LayoutPage } from "../../../layout/types.ts";
import type { DomBlockMeasurement } from "../../../renderer/hooks/useDomMeasurements.ts";

interface InteractivePageProps {
  page: LayoutPage;
  debugLayout?: boolean;
  domMeasurements?: DomBlockMeasurement[];
}

export function InteractivePage({ page, debugLayout, domMeasurements }: InteractivePageProps) {
  const { registerPage } = useInteractionContext();

  return (
    <div ref={registerPage(page.id)}>
      <PageRenderer
        page={page}
        debugLayout={debugLayout}
        domMeasurements={domMeasurements}
      />
    </div>
  );
}
