import type { RenderSnapshot } from "../layout/types.ts";

interface BlockContentRendererProps {
  snapshot: RenderSnapshot;
}

export function BlockContentRenderer({ snapshot }: BlockContentRendererProps) {
  switch (snapshot.type) {
    case "heading": {
      const { level, text } = snapshot;
      if (level === 1) return <h1 className="text-2xl font-bold">{text}</h1>;
      if (level === 2) return <h2 className="text-xl font-semibold">{text}</h2>;
      return <h3 className="text-lg font-semibold">{text}</h3>;
    }

    case "paragraph":
      return <p className="text-base leading-relaxed">{snapshot.text}</p>;

    case "image":
      return (
        <img
          src={snapshot.src}
          alt={snapshot.alt ?? ""}
          className="max-w-full rounded"
        />
      );

    case "table":
      return (
        <table className="w-full border-collapse">
          <tbody>
            {(snapshot.cells ?? []).map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-gray-300 px-3 py-2 text-sm">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}
