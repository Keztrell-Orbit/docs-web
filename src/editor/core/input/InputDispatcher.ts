import type { InputCommand, CommandSink } from "./InputTypes.ts";

export type InputDispatcherCallback = CommandSink;

export class InputDispatcher {
  #sinks: Set<CommandSink> = new Set();

  register(sink: CommandSink): void {
    this.#sinks.add(sink);
  }

  unregister(sink: CommandSink): void {
    this.#sinks.delete(sink);
  }

  dispatch(command: InputCommand): void {
    for (const sink of this.#sinks) {
      sink(command);
    }
  }

  clear(): void {
    this.#sinks.clear();
  }

  get sinkCount(): number {
    return this.#sinks.size;
  }
}
