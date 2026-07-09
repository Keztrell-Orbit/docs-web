import type { NormalizedEvent, InputCommand, CompositionState, CommandSink } from "./InputTypes.ts";
import { InputContext } from "./InputContext.ts";
import { InputDispatcher } from "./InputDispatcher.ts";
import { KeyboardMapper } from "./KeyboardInput.ts";
import { BeforeInputHandler } from "./BeforeInput.ts";
import { CompositionHandler } from "./CompositionInput.ts";
import { ClipboardInput } from "./ClipboardInput.ts";
import { MouseInput } from "./MouseInput.ts";
import { PointerInput } from "./PointerInput.ts";
import { WheelInput } from "./WheelInput.ts";
import { normalizeEvent } from "./InputEventNormalizer.ts";
import type { InteractionState } from "../../interaction/types.ts";

export class InputEngine {
  readonly context: InputContext;
  readonly dispatcher: InputDispatcher;
  readonly keyboardMapper: KeyboardMapper;
  readonly beforeInputHandler: BeforeInputHandler;
  readonly compositionHandler: CompositionHandler;
  readonly clipboardInput: ClipboardInput;
  readonly mouseInput: MouseInput;
  readonly pointerInput: PointerInput;
  readonly wheelInput: WheelInput;

  #getInteractionState: () => InteractionState;
  #logSink: CommandSink;

  constructor(
    getInteractionState: () => InteractionState,
    logSink?: CommandSink,
  ) {
    this.compositionHandler = new CompositionHandler();
    this.context = new InputContext(getInteractionState, this.compositionHandler);
    this.dispatcher = new InputDispatcher();
    this.keyboardMapper = new KeyboardMapper();
    this.beforeInputHandler = new BeforeInputHandler();
    this.clipboardInput = new ClipboardInput();
    this.mouseInput = new MouseInput();
    this.pointerInput = new PointerInput();
    this.wheelInput = new WheelInput();

    this.#getInteractionState = getInteractionState;

    this.#logSink = logSink ?? ((cmd) => {
      console.log(`[InputEngine] ${cmd.type}`);
    });

    this.dispatcher.register(this.#logSink);
  }

  handleEvent(nativeEvent: Event): void {
    const normalized = normalizeEvent(nativeEvent);
    if (!normalized) return;

    const command = this.#route(normalized);
    if (command) {
      groupCommands(command);
      this.dispatcher.dispatch(command);
    }
  }

  #route(normalized: NormalizedEvent): InputCommand | null {
    switch (normalized.type) {
      case "keydown":
      case "keyup": {
        const context = this.context;
        if (normalized.type === "keydown") {
          return this.keyboardMapper.processKeyDown(normalized, context);
        }
        return this.keyboardMapper.processKeyUp(normalized, context);
      }

      case "beforeinput":
        return this.beforeInputHandler.process(normalized);

      case "compositionstart":
        return this.compositionHandler.processStart(normalized);

      case "compositionupdate":
        return this.compositionHandler.processUpdate(normalized);

      case "compositionend":
        return this.compositionHandler.processEnd(normalized);

      case "copy":
        return this.clipboardInput.processCopy(normalized);

      case "cut":
        return this.clipboardInput.processCut(normalized);

      case "paste":
        return this.clipboardInput.processPaste(normalized);

      case "wheel":
        return this.wheelInput.process(normalized);

      case "pointerdown":
      case "pointermove":
      case "pointerup":
        return null;

      case "focus":
      case "blur":
      case "drag":
      case "drop":
      case "contextmenu":
        return null;

      default:
        return null;
    }
  }

  getCompositionState(): CompositionState {
    return this.compositionHandler.getCompositionState();
  }

  destroy(): void {
    this.dispatcher.clear();
    this.compositionHandler.reset();
  }
}

function groupCommands(command: InputCommand): void {
  console.groupCollapsed(`[InputEngine] ${command.type}`);
  console.log(JSON.stringify(command, null, 2));
  console.groupEnd();
}
