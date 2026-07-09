export function isNavigationKey(event: KeyboardEvent): boolean {
  const navKeys = [
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    "Home", "End", "PageUp", "PageDown",
  ];
  return navKeys.includes(event.key);
}

export function isModifierKey(event: KeyboardEvent): boolean {
  const mods = ["Control", "Shift", "Alt", "Meta", "CapsLock", "Tab"];
  return mods.includes(event.key);
}

export function isTabKey(event: KeyboardEvent): boolean {
  return event.key === "Tab";
}
