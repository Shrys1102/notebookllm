import { useEffect } from "react";

/**
 * Central keyboard shortcut architecture.
 *
 * Every shortcut is registered through this hook so behavior is consistent,
 * documented in one place (see SettingsPage "Keyboard shortcuts"), and never
 * fires while the user is typing in an input, textarea, or contenteditable —
 * except for explicitly allowed escape-hatch keys.
 *
 * Binding format: { keys: "ctrl+k", onKeyDown, description }
 * Modifiers: "ctrl" = Ctrl OR Cmd (cross-platform), "alt", "shift".
 */

export function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName ? target.tagName.toLowerCase() : "";
  if (tag === "input" || tag === "textarea") return true;
  return target.isContentEditable === true;
}

/** Keys that are allowed to work even while typing (escape hatches). */
const ALWAYS_ACTIVE_KEYS = new Set(["escape", "k", "b", "f", "e", "r", "s", "enter"]);

export function shouldSkipShortcut(e, target) {
  if (!isTypingTarget(target)) return false;
  return !ALWAYS_ACTIVE_KEYS.has(e.key.toLowerCase());
}

export default function useKeyboardShortcuts(bindings = [], enabled = true) {
  useEffect(() => {
    if (!enabled || !bindings.length) return undefined;

    const handleKeyDown = (event) => {
      if (shouldSkipShortcut(event, event.target)) return;
      for (const binding of bindings) {
        const parts = binding.keys.toLowerCase().split("+");
        const bareKey = parts[parts.length - 1];
        const wantsCtrl = parts.includes("ctrl");
        const wantsAlt = parts.includes("alt");
        const wantsShift = parts.includes("shift");

        if (event.key.toLowerCase() !== bareKey) continue;
        if (wantsCtrl !== (event.ctrlKey || event.metaKey)) continue;
        if (wantsAlt !== event.altKey) continue;
        if (wantsShift !== event.shiftKey) continue;

        event.preventDefault();
        binding.onKeyDown(event);
        break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bindings, enabled]);
}

/** Documented shortcut catalog (used by SettingsPage and palette footer). */
export const SHORTCUT_CATALOG = [
  { keys: "Ctrl/⌘ + K", description: "Open command palette" },
  { keys: "Ctrl/⌘ + B", description: "Toggle source sidebar" },
  { keys: "Esc", description: "Close dialog / exit focus mode / close viewer" },
  { keys: "Ctrl/⌘ + F", description: "Search inside the open document" },
  { keys: "Alt + E", description: "Toggle evidence panel in viewer" },
  { keys: "Alt + F", description: "Toggle focus mode in viewer" },
  { keys: "Alt + R", description: "Open research panel (notes / saved evidence)" },
  { keys: "Alt + S", description: "Toggle Studio panel" },
];