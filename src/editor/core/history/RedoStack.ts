import type { ExecutionSnapshot } from "./ExecutionSnapshot.ts";

export class RedoStack {
  #stack: ExecutionSnapshot[] = [];
  #maxDepth: number;

  constructor(maxDepth = 100) {
    this.#maxDepth = maxDepth;
  }

  push(snapshot: ExecutionSnapshot): void {
    this.#stack.push(snapshot);
    if (this.#stack.length > this.#maxDepth) {
      this.#stack.shift();
    }
  }

  pop(): ExecutionSnapshot | null {
    return this.#stack.pop() ?? null;
  }

  peek(): ExecutionSnapshot | null {
    return this.#stack[this.#stack.length - 1] ?? null;
  }

  get depth(): number {
    return this.#stack.length;
  }

  get isEmpty(): boolean {
    return this.#stack.length === 0;
  }

  clear(): void {
    this.#stack = [];
  }
}
