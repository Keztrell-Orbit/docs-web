import type { LayoutBlock } from "../../layout-engine/types.ts";

interface BlockRendererProps {
  block: LayoutBlock;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  switch (block.data.type) {
    case "heading": {
      const { level, text } = block.data;
      if (level === 1) {
        return <h1 className="text-2xl font-bold mb-3 mt-0">{text}</h1>;
      }
      if (level === 2) {
        return <h2 className="text-xl font-semibold mb-2 mt-6">{text}</h2>;
      }
      return <h3 className="text-lg font-semibold mb-2 mt-4">{text}</h3>;
    }

    case "paragraph":
      return (
        <p className="text-base leading-relaxed mb-2" style={{ minHeight: block.height }}>
          {block.data.text}
        </p>
      );

    case "image":
      return (
        <div className="my-3">
          <img
            src={block.data.src}
            alt={block.data.alt}
            className="max-w-full rounded"
            style={{ width: block.data.width, height: block.data.height }}
          />
        </div>
      );

    case "table":
      return (
        <div className="my-3 overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {block.data.cells.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className="border border-gray-300 px-3 py-2 text-sm"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}
