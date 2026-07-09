export interface OverflowEntry {
  blockId: string;
  tag: string;
  height: number;
  childBottom: number;
  parentBottom: number;
  overflow: number;
}

export function scanOverflows(container: HTMLElement): OverflowEntry[] {
  const results: OverflowEntry[] = [];
  const all = container.querySelectorAll<HTMLElement>("*");
  all.forEach((el) => {
    const parent = el.parentElement;
    if (!parent) return;
    const elRect = el.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    if (elRect.bottom > parentRect.bottom + 0.5) {
      results.push({
        blockId:
          el
            .closest("[data-block-id]")
            ?.getAttribute("data-block-id") ?? "",
        tag: el.tagName.toLowerCase(),
        height: Math.round(elRect.height * 10) / 10,
        childBottom: Math.round(elRect.bottom * 10) / 10,
        parentBottom: Math.round(parentRect.bottom * 10) / 10,
        overflow: Math.round((elRect.bottom - parentRect.bottom) * 10) / 10,
      });
    }
  });
  return results;
}
