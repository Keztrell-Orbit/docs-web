import type {
  ModifierState,
  NormalizedKeyboardEvent,
  NormalizedBeforeInputEvent,
  NormalizedCompositionEvent,
  NormalizedPointerEvent,
  NormalizedClipboardEvent,
  NormalizedWheelEvent,
  NormalizedFocusEvent,
  NormalizedDragEvent,
  NormalizedContextMenuEvent,
  NormalizedEvent,
  InputSource,
} from "./InputTypes.ts";

export function getModifiers(event: {
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}): ModifierState {
  return {
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    alt: event.altKey,
    shift: event.shiftKey,
  };
}

function getInputSource(event: Event): InputSource {
  try {
    if (event instanceof KeyboardEvent) return "keyboard";
    if (event instanceof CompositionEvent) return "ime";
    if (event instanceof ClipboardEvent) return "clipboard";
    if (event instanceof DragEvent) return "drag";
    if (event instanceof WheelEvent) return "wheel";
    if (event instanceof MouseEvent && event.type === "contextmenu") return "contextMenu";
  } catch {
    // DOM constructors may not exist in non-browser environments
  }
  return "keyboard";
}

export function normalizeKeyboardEvent(event: KeyboardEvent): NormalizedKeyboardEvent {
  return {
    type: event.type as "keydown" | "keyup",
    key: event.key,
    code: event.code,
    modifiers: getModifiers(event),
    repeat: event.repeat,
    timestamp: event.timeStamp,
    inputSource: "keyboard",
  };
}

export function normalizeBeforeInputEvent(event: InputEvent): NormalizedBeforeInputEvent {
  return {
    type: "beforeinput",
    inputType: event.inputType,
    data: event.data,
    dataTransfer: event.dataTransfer,
    modifiers: getModifiers(event),
    timestamp: event.timeStamp,
    inputSource: getInputSource(event),
  };
}

export function normalizeCompositionEvent(event: CompositionEvent): NormalizedCompositionEvent {
  return {
    type: event.type as "compositionstart" | "compositionupdate" | "compositionend",
    data: event.data ?? "",
    timestamp: event.timeStamp,
    inputSource: "ime",
  };
}

export function normalizePointerEvent(event: PointerEvent | MouseEvent): NormalizedPointerEvent {
  return {
    type: event.type as "pointerdown" | "pointermove" | "pointerup",
    clientX: event.clientX,
    clientY: event.clientY,
    buttons: event.buttons,
    pointerType: "pointerType" in event ? event.pointerType : "mouse",
    clickCount: "detail" in event ? event.detail : 0,
    modifiers: getModifiers(event),
    timestamp: event.timeStamp,
    inputSource: "mouse",
  };
}

export function normalizeClipboardEvent(event: ClipboardEvent): NormalizedClipboardEvent {
  return {
    type: event.type as "copy" | "cut" | "paste",
    dataTransfer: event.clipboardData,
    modifiers: getModifiers(event),
    timestamp: event.timeStamp,
    inputSource: "clipboard",
  };
}

export function normalizeWheelEvent(event: WheelEvent): NormalizedWheelEvent {
  return {
    type: "wheel",
    deltaX: event.deltaX,
    deltaY: event.deltaY,
    deltaZ: event.deltaZ,
    deltaMode: event.deltaMode,
    ctrlKey: event.ctrlKey,
    timestamp: event.timeStamp,
    inputSource: "wheel",
  };
}

export function normalizeFocusEvent(event: FocusEvent): NormalizedFocusEvent {
  return {
    type: event.type as "focus" | "blur",
    timestamp: event.timeStamp,
    inputSource: "keyboard",
  };
}

export function normalizeDragEvent(event: DragEvent): NormalizedDragEvent {
  return {
    type: event.type as "drag" | "drop",
    dataTransfer: event.dataTransfer,
    clientX: event.clientX,
    clientY: event.clientY,
    modifiers: getModifiers(event),
    timestamp: event.timeStamp,
    inputSource: "drag",
  };
}

export function normalizeContextMenuEvent(event: MouseEvent): NormalizedContextMenuEvent {
  return {
    type: "contextmenu",
    clientX: event.clientX,
    clientY: event.clientY,
    modifiers: getModifiers(event),
    timestamp: event.timeStamp,
    inputSource: "contextMenu",
  };
}

export function normalizeEvent(event: Event): NormalizedEvent | null {
  try {
    if (event instanceof KeyboardEvent && (event.type === "keydown" || event.type === "keyup")) {
      return normalizeKeyboardEvent(event);
    }
    if (event instanceof InputEvent && event.type === "beforeinput") {
      return normalizeBeforeInputEvent(event);
    }
    if (event instanceof CompositionEvent) {
      return normalizeCompositionEvent(event);
    }
    if ((event instanceof PointerEvent || event instanceof MouseEvent) && (
      event.type === "pointerdown" || event.type === "pointermove" || event.type === "pointerup"
    )) {
      return normalizePointerEvent(event);
    }
    if (event instanceof ClipboardEvent) {
      return normalizeClipboardEvent(event);
    }
    if (event instanceof WheelEvent && event.type === "wheel") {
      return normalizeWheelEvent(event);
    }
    if (event instanceof FocusEvent && (event.type === "focus" || event.type === "blur")) {
      return normalizeFocusEvent(event);
    }
    if (event instanceof DragEvent && (event.type === "drag" || event.type === "drop")) {
      return normalizeDragEvent(event);
    }
    if (event instanceof MouseEvent && event.type === "contextmenu") {
      return normalizeContextMenuEvent(event);
    }
  } catch {
    // DOM constructors may not exist in non-browser environments
  }
  return null;
}
