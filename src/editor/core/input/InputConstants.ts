import type { ModifierState, Platform } from "./InputTypes.ts";

export const PLATFORM: Platform = detectPlatform();

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.platform?.toLowerCase() ?? "";
  if (ua.includes("mac")) return "mac";
  if (ua.includes("win")) return "windows";
  if (ua.includes("linux")) return "linux";
  return "unknown";
}

export const IS_MAC = PLATFORM === "mac";

export const PRIMARY_MODIFIER: "ctrl" | "meta" = IS_MAC ? "meta" : "ctrl";

export const MODIFIER_KEY_MAP: Record<string, keyof ModifierState> = {
  Control: "ctrl",
  Meta: "meta",
  Alt: "alt",
  Shift: "shift",
};

export function hasPrimaryModifier(mod: ModifierState): boolean {
  return IS_MAC ? mod.meta : mod.ctrl;
}

export function hasModifier(mod: ModifierState): boolean {
  return mod.ctrl || mod.meta || mod.alt || mod.shift;
}

export function isOnlyModifier(key: string): boolean {
  return key in MODIFIER_KEY_MAP;
}

export const DOUBLE_CLICK_DELAY = 350;
export const TRIPLE_CLICK_DELAY = 500;
