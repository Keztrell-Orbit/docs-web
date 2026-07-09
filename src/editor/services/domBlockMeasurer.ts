import type { Block, BlockMeasurer, BlockMeasureResult } from "../types.ts";

export class DomBlockMeasurer implements BlockMeasurer {
  private container: HTMLDivElement;
  private initialized = false;

  constructor(contentWidth: number) {
    this.container = document.createElement("div");
    this.container.style.cssText = [
      "position: absolute",
      "left: -9999px",
      "top: 0",
      `width: ${contentWidth}px`,
      "visibility: hidden",
    ].join(";");
    document.body.appendChild(this.container);
  }

  async initialize(): Promise<void> {
    await document.fonts.ready;
    this.initialized = true;
  }

  get ready(): boolean {
    return this.initialized;
  }

  measure(block: Block): BlockMeasureResult {
    const el = this.createElement(block);
    this.container.appendChild(el);
    const { height } = el.getBoundingClientRect();
    this.container.removeChild(el);
    return {
      contentHeight: height,
      marginTop: 0,
      marginBottom: 0,
      paddingTop: 0,
      paddingBottom: 0,
      borderTop: 0,
      borderBottom: 0,
    };
  }

  destroy(): void {
    this.container.remove();
  }

  private createElement(block: Block): HTMLElement {
    switch (block.type) {
      case "heading": {
        const h = document.createElement(`h${block.level}`);
        h.className = `text-2xl font-bold`;
        h.textContent = block.text;
        return h;
      }
      case "paragraph": {
        const p = document.createElement("p");
        p.className = "text-base leading-relaxed";
        p.textContent = block.text;
        return p;
      }
      case "image": {
        const img = document.createElement("img");
        img.className = "max-w-full rounded";
        img.src = block.src;
        img.alt = block.alt;
        return img;
      }
      case "table": {
        const table = document.createElement("table");
        table.className = "w-full border-collapse";
        const tbody = document.createElement("tbody");
        for (const row of block.cells) {
          const tr = document.createElement("tr");
          for (const cell of row) {
            const td = document.createElement("td");
            td.className = "border border-gray-300 px-3 py-2 text-sm";
            td.textContent = cell;
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        return table;
      }
    }
  }
}
