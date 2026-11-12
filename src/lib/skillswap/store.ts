import { useSyncExternalStore } from "react";

import { applyAction, type Action, type Result } from "./engine";
import { createSeed } from "./seed";
import { migrateDemo } from "./migrate-demo";
import type { DemoState } from "./types";

const KEY = "skillswap-demo-v1";

let cache: DemoState | null = null;
const listeners = new Set<() => void>();
let storageBound = false;

function load(): DemoState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed && parsed.version === 1) return migrateDemo(parsed);
    }
  } catch {
    // corrupted data falls through to a fresh seed
  }
  const seed = createSeed();
  window.localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!storageBound) {
    storageBound = true;
    // Keep other tabs of the same browser in sync.
    window.addEventListener("storage", (e) => {
      if (e.key === KEY || e.key === null) {
        cache = load();
        emit();
      }
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): DemoState {
  if (!cache) cache = load();
  return cache;
}

function getServerSnapshot(): DemoState | null {
  return null;
}

/** Null during server render and hydration; the saved demo afterwards. */
export function useDemoState(enabled = true): DemoState | null {
  return useSyncExternalStore(enabled ? subscribe : () => () => {}, enabled ? getSnapshot : getServerSnapshot, getServerSnapshot);
}

/**
 * Applies an action against the freshest saved state (not a stale render),
 * so double clicks and other tabs can never apply the same change twice.
 */
export function dispatch(action: Action): Result {
  const fresh = load();
  const result = applyAction(fresh, action);
  if (result.ok) {
    try { window.localStorage.setItem(KEY, JSON.stringify(result.state)); }
    catch { return { ok: false, error: "No pudimos guardar la demo. Revisa el almacenamiento de tu navegador e intenta de nuevo." }; }
    cache = result.state;
    emit();
  }
  return result;
}

/** Serialize read/validate/write across same-origin tabs when Web Locks is available. */
export async function dispatchSaved(action: Action): Promise<Result> {
  if (navigator.locks) return navigator.locks.request(KEY, () => dispatch(action));
  return dispatch(action);
}
