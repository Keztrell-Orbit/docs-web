import { Node } from "@tiptap/core";

/** 96px bottom margin + 10px gap + 96px top margin */
export const PAGE_BREAK_HEIGHT = 202;

export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: false,
  draggable: false,

  parseHTML() {
    return [{ tag: "div[data-page-break]" }];
  },

  renderHTML() {
    return ["div", { "data-page-break": "", class: "page-break-marker" }];
  },
});
