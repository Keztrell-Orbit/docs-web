import type {
  EditorConfig,
  KlassConstructor,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { $applyNodeReplacement, DecoratorNode } from "lexical";
import type { JSX } from "react";

export type SerializedImageNode = Spread<
  { src: string; alt: string; width: number },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  declare ["constructor"]: KlassConstructor<typeof ImageNode>;

  __src: string;
  __alt: string;
  __width: number;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__width, node.__key);
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const node = $createImageNode(
      serializedNode.src,
      serializedNode.alt,
      serializedNode.width,
    );
    return node;
  }

  constructor(src: string, alt: string, width: number, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__width = width;
  }

  exportJSON(): SerializedImageNode {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      alt: this.__alt,
      width: this.__width,
    };
  }

  createDOM(_config: EditorConfig): HTMLElement {
    void _config;
    const el = document.createElement("div");
    el.className = "image-node-wrapper";
    return el;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    void _editor;
    void _config;
    return (
      <img
        src={this.__src}
        alt={this.__alt}
        width={this.__width}
        className="max-w-full h-auto my-2 rounded"
        draggable={false}
        loading="lazy"
      />
    );
  }

  isInline(): boolean {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }

  isIsolated(): boolean {
    return true;
  }
}

export function $createImageNode(
  src: string,
  alt: string = "Image",
  width: number = 400,
): ImageNode {
  return $applyNodeReplacement(new ImageNode(src, alt, width));
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}
