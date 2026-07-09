import type { TextLayout } from "../../interaction/types.ts";

export class TextLayoutRegistry {
  #layouts: Map<string, TextLayout> = new Map();
  #version: number = 0;

  register(blockId: string, layout: TextLayout): void {
    this.#layouts.set(blockId, layout);
    this.#version++;
  }

  get(blockId: string): TextLayout {
    const layout = this.#layouts.get(blockId);
    if (!layout) {
      throw new Error(`Missing TextLayout for block ${blockId}`);
    }
    return layout;
  }

  has(blockId: string): boolean {
    return this.#layouts.has(blockId);
  }

  unregister(blockId: string): void {
    this.#layouts.delete(blockId);
    this.#version++;
  }

  clear(): void {
    this.#layouts.clear();
    this.#version++;
  }

  getVersion(): number {
    return this.#version;
  }

  get registeredCount(): number {
    return this.#layouts.size;
  }

  get allBlockIds(): IterableIterator<string> {
    return this.#layouts.keys();
  }
}
