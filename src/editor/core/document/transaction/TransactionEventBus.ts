import type { TransactionEvent } from "../../types.ts";

type EventCallback = (...args: unknown[]) => void;

export class TransactionEventBus {
  #listeners = new Map<string, Set<EventCallback>>();

  on(event: TransactionEvent, cb: EventCallback): void {
    const set = this.#listeners.get(event);
    if (set) {
      set.add(cb);
    } else {
      this.#listeners.set(event, new Set([cb]));
    }
  }

  off(event: TransactionEvent, cb: EventCallback): void {
    const set = this.#listeners.get(event);
    if (set) {
      set.delete(cb);
      if (set.size === 0) this.#listeners.delete(event);
    }
  }

  emit(event: TransactionEvent, ...args: unknown[]): void {
    const set = this.#listeners.get(event);
    if (set) {
      for (const cb of set) {
        try {
          cb(...args);
        } catch (e) {
          console.error(`TransactionEventBus error in ${event}:`, e);
        }
      }
    }
  }

  clear(): void {
    this.#listeners.clear();
  }
}
