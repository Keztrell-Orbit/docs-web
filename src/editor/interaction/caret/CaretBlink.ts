import { useEffect, useRef, useCallback } from "react";

const BLINK_INTERVAL = 530;
const PAUSE_AFTER_INTERACTION = 2000;

export function useCaretBlink(
  focused: boolean,
  dispatch: React.Dispatch<import("../types.ts").InteractionAction>,
): () => void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);

  const startBlinking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!pausedRef.current) {
        dispatch({ type: "CARET_BLINK" });
      }
    }, BLINK_INTERVAL);
  }, [dispatch]);

  const pauseBlinking = useCallback(() => {
    pausedRef.current = true;
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, PAUSE_AFTER_INTERACTION);
  }, []);

  useEffect(() => {
    if (focused) {
      startBlinking();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, [focused, startBlinking]);

  return pauseBlinking;
}
