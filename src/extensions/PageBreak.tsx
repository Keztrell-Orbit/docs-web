import type { EditorConfig, KlassConstructor, LexicalEditor, LexicalNode, SerializedLexicalNode } from "lexical";
import { DecoratorNode } from "lexical";
import type { JSX } from "react";

export const PAGE_BREAK_HEIGHT = 218;

export class PageBreakNode extends DecoratorNode<JSX.Element> {
  declare ['constructor']: KlassConstructor<typeof PageBreakNode>;

  static getType(): string {
    return "pageBreak";
  }

  static clone(node: PageBreakNode): PageBreakNode {
    return new PageBreakNode(node.__key);
  }

  static importJSON(_serializedNode: SerializedLexicalNode): PageBreakNode {
    return $createPageBreakNode();
  }

  exportJSON(): SerializedLexicalNode {
    return { type: "pageBreak", version: 1 };
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement("div");
    el.setAttribute("data-page-break", "");
    return el;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return <div className="page-break-marker" />;
  }

  isInline(): boolean {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return false;
  }

  isIsolated(): boolean {
    return true;
  }
}

export function $createPageBreakNode(): PageBreakNode {
  return new PageBreakNode();
}

export function $isPageBreakNode(node: LexicalNode | null | undefined): node is PageBreakNode {
  return node instanceof PageBreakNode;
}
