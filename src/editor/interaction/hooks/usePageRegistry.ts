import { useRef, useCallback } from "react";

export function usePageRegistry(): {
  registry: Map<string, HTMLDivElement>;
  registerPage: (pageId: string) => (el: HTMLDivElement | null) => void;
} {
  const registryRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const registerPage = useCallback((pageId: string) => {
    return (el: HTMLDivElement | null) => {
      if (el) {
        registryRef.current.set(pageId, el);
      } else {
        registryRef.current.delete(pageId);
      }
    };
  }, []);

  return { registry: registryRef.current, registerPage };
}
