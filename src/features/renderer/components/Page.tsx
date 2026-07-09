import type { LayoutPage } from "../../layout-engine/types.ts";
import { BlockRenderer } from "./BlockRenderer.tsx";

interface PageProps {
  page: LayoutPage;
}

export function Page({ page }: PageProps) {
  const { geometry } = page;

  return (
    <div
      className="bg-white shadow-xl"
      style={{
        width: geometry.size.width,
        height: geometry.size.height,
      }}
    >
      <div
        style={{
          paddingTop: geometry.margins.top,
          paddingBottom: geometry.margins.bottom,
          paddingLeft: geometry.margins.left,
          paddingRight: geometry.margins.right,
          width: "100%",
          height: "100%",
        }}
      >
        {page.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}
