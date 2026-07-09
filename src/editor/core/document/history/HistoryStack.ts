import type { CommittedTransaction } from "../../types.ts";

export class HistoryStack {
  #stack: CommittedTransaction[] = [];
  #maxDepth: number;

  constructor(maxDepth = 100) {
    this.#maxDepth = maxDepth;
  }

  push(item: CommittedTransaction): void {
    this.#stack.push(item);
    if (this.#stack.length > this.#maxDepth) {
      this.#stack.shift();
    }
  }

  pop(): CommittedTransaction | null {
    return this.#stack.pop() ?? null;
  }

  peek(): CommittedTransaction | null {
    return this.#stack[this.#stack.length - 1] ?? null;
  }

  get length(): number {
    return this.#stack.length;
  }

  clear(): void {
    this.#stack = [];
  }

  toArray(): readonly CommittedTransaction[] {
    return this.#stack;
  }
}
