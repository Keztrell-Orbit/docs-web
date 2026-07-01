import { useEffect, type RefObject } from "react";

export function useChatScroll(
  chatEndRef: RefObject<HTMLDivElement | null>,
  ...deps: unknown[]
) {
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
