"use client";

import { useSyncExternalStore } from "react";
import type { Category, LedgerData, Mode } from "./types";
import {
  DATA_KEY,
  RATES_KEY,
  freshData,
  loadCategories,
  loadData,
  saveCategories,
  saveData,
} from "./storage";

type Updater<T> = (prev: T) => T;

/**
 * A tiny external store backed by browser storage, exposed through
 * useSyncExternalStore. Reads are cached by the raw stored string so
 * getSnapshot returns a stable reference until the value actually changes;
 * writes notify same-tab listeners (the `storage` event only fires in OTHER
 * tabs, which is how cross-tab sync works for free).
 */
function createStore<T>(
  key: string,
  read: () => T,
  write: (v: T) => void,
  rawSource: () => string | null
) {
  const listeners = new Set<() => void>();
  // `undefined` (not `null`) so the first call always reads — an empty
  // store legitimately returns `null` for the raw value.
  let rawCache: string | null | undefined = undefined;
  let snapCache: T | null = null;

  function getSnapshot(): T {
    const raw = rawSource();
    if (raw !== rawCache) {
      rawCache = raw;
      snapCache = read();
    }
    return snapCache as T;
  }

  function subscribe(onStoreChange: () => void) {
    listeners.add(onStoreChange);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) onStoreChange();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onStoreChange);
      window.removeEventListener("storage", onStorage);
    };
  }

  function update(updater: Updater<T>) {
    const next = updater(getSnapshot());
    write(next);
    rawCache = undefined;
    listeners.forEach((l) => l());
  }

  return { getSnapshot, subscribe, update };
}

export const dataStore = createStore<LedgerData>(
  DATA_KEY,
  loadData,
  saveData,
  () => window.localStorage.getItem(DATA_KEY)
);
export const ratesStore = createStore<Category[]>(
  RATES_KEY,
  loadCategories,
  saveCategories,
  () => window.localStorage.getItem(RATES_KEY)
);

// Which startup option the user picked this browser session. sessionStorage
// (not localStorage) so the startup screen appears again in every new
// session — closing the tab/browser "ends" the session.
export const MODE_KEY = "cornice.ledger.mode.session";

function readMode(): Mode | null {
  const raw = window.sessionStorage.getItem(MODE_KEY);
  return raw === "loaded" || raw === "new" || raw === "admin" ? raw : null;
}

function writeMode(mode: Mode | null): void {
  if (typeof window === "undefined") return;
  if (mode === null) window.sessionStorage.removeItem(MODE_KEY);
  else window.sessionStorage.setItem(MODE_KEY, mode);
}

export const modeStore = createStore<Mode | null>(
  MODE_KEY,
  readMode,
  writeMode,
  () => window.sessionStorage.getItem(MODE_KEY)
);

export function useMode(): Mode | null {
  return useSyncExternalStore(
    modeStore.subscribe,
    modeStore.getSnapshot,
    () => null
  );
}

// Server snapshots (used during SSR/prerender — localStorage is unavailable).
export const SERVER_DATA = freshData();
export const SERVER_CATEGORIES: Category[] = [];

// Flips to true once on the client, right after hydration. Used for values
// that only make sense in the browser (e.g. "today's" weekday) so the
// server-rendered markup and the client's first render always agree.
const clientOnly = {
  subscribe: (cb: () => void) => {
    cb();
    return () => {};
  },
  getSnapshot: () => true,
  getServerSnapshot: () => false,
};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    clientOnly.subscribe,
    clientOnly.getSnapshot,
    clientOnly.getServerSnapshot
  );
}
