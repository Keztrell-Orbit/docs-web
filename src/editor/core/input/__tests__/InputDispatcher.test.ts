import { describe, it, expect, vi } from "vitest";
import { InputDispatcher } from "../InputDispatcher.ts";
import type { InputCommand } from "../InputTypes.ts";

describe("InputDispatcher", () => {
  it("dispatches command to registered sink", () => {
    const dispatcher = new InputDispatcher();
    const sink = vi.fn();
    dispatcher.register(sink);

    const cmd: InputCommand = { type: "UNDO" };
    dispatcher.dispatch(cmd);

    expect(sink).toHaveBeenCalledWith(cmd);
  });

  it("dispatches to multiple sinks", () => {
    const dispatcher = new InputDispatcher();
    const sink1 = vi.fn();
    const sink2 = vi.fn();
    dispatcher.register(sink1);
    dispatcher.register(sink2);

    dispatcher.dispatch({ type: "COPY" });

    expect(sink1).toHaveBeenCalledTimes(1);
    expect(sink2).toHaveBeenCalledTimes(1);
  });

  it("can unregister a sink", () => {
    const dispatcher = new InputDispatcher();
    const sink = vi.fn();
    dispatcher.register(sink);
    dispatcher.unregister(sink);

    dispatcher.dispatch({ type: "PASTE", dataTransfer: null });

    expect(sink).not.toHaveBeenCalled();
  });

  it("clear removes all sinks", () => {
    const dispatcher = new InputDispatcher();
    dispatcher.register(vi.fn());
    dispatcher.register(vi.fn());
    dispatcher.clear();

    expect(dispatcher.sinkCount).toBe(0);
  });

  it("reports sink count correctly", () => {
    const dispatcher = new InputDispatcher();
    expect(dispatcher.sinkCount).toBe(0);

    dispatcher.register(vi.fn());
    expect(dispatcher.sinkCount).toBe(1);

    dispatcher.register(vi.fn());
    expect(dispatcher.sinkCount).toBe(2);
  });

  it("dispatching with no sinks does not throw", () => {
    const dispatcher = new InputDispatcher();
    expect(() => dispatcher.dispatch({ type: "UNDO" })).not.toThrow();
  });
});
