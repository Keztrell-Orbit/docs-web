import { useEffect, type RefObject } from "react";

export function useClickOutside(
  ref: RefObject<HTMLDivElement | null>,
  onClose: () => void,
  ignoreRefs?: RefObject<HTMLElement | null>[]
) {
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (ignoreRefs?.some(ir => ir.current?.contains(e.target as Node))) return;
        onClose();
      }
    }
    function handleScrollOrResize(e: Event) {
      if (e.type === "scroll") {
        if (e.target !== document && e.target !== document.documentElement && e.target !== document.body) return;
        onClose();
        return;
      }
      onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [ref, onClose, ignoreRefs]);
}
