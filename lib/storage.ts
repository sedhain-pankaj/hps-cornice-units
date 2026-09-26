import type { Category, DayRecord, Entry, LedgerData, Settings } from "./types";
import { isoDate, wednesdayOf } from "./dates";
import { defaultCategories } from "./rates";
import { isValidOwnerName } from "./naming";

// localStorage is the primary persistence layer (auto-saved on every change).
// The JSON backup file (lib/db.ts) is for porting data between devices.
export const DATA_KEY = "cornice.ledger.data.v1";
export const RATES_KEY = "cornice.ledger.rates.v1";

export const DEFAULT_SETTINGS: Settings = {
  hourly: 28.5,
  hoursPerDay: 8,
  unitsPerDay: 36,
  extraRate: 3.8,
};

export function freshData(): LedgerData {
  return {
    weekStart: isoDate(wednesdayOf(new Date())),
    days: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function loadData(): LedgerData {
  if (typeof window === "undefined") return freshData();
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    if (!raw) return freshData();
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) return freshData();
    const fresh = freshData();
    const days: LedgerData["days"] = {};
    if (isObject(parsed.days)) {
      for (const [iso, rec] of Object.entries(parsed.days)) {
        if (!isObject(rec)) continue;
        const entries: Entry[] = Array.isArray(rec.entries)
          ? rec.entries.filter(
              (e): e is Entry =>
                isObject(e) &&
                typeof e.id === "string" &&
                typeof e.code === "string" &&
                typeof e.qty === "number" &&
                typeof e.rate === "number"
            )
          : [];
        const off =
          typeof rec.off === "boolean" ? rec.off : undefined;
        const paid =
          typeof rec.paid === "boolean" ? rec.paid : undefined;
        const dayRec: DayRecord = { entries };
        if (off !== undefined) dayRec.off = off;
        if (paid !== undefined) dayRec.paid = paid;
        days[iso] = dayRec;
      }
    }
    const s = isObject(parsed.settings) ? parsed.settings : {};
    const num = (v: unknown, fallback: number) =>
      typeof v === "number" && isFinite(v) ? v : fallback;
    const settings: Settings = {
      hourly: num(s.hourly, DEFAULT_SETTINGS.hourly),
      hoursPerDay: num(s.hoursPerDay, DEFAULT_SETTINGS.hoursPerDay),
      unitsPerDay: num(s.unitsPerDay, DEFAULT_SETTINGS.unitsPerDay),
      extraRate: num(s.extraRate, DEFAULT_SETTINGS.extraRate),
    };
    const ownerName =
      typeof parsed.ownerName === "string" && isValidOwnerName(parsed.ownerName)
        ? parsed.ownerName
        : undefined;
    return {
      weekStart:
        typeof parsed.weekStart === "string" ? parsed.weekStart : fresh.weekStart,
      days,
      settings,
      ownerName,
    };
  } catch {
    return freshData();
  }
}

export function saveData(data: LedgerData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked — data stays in memory for the session.
  }
}

export function loadCategories(): Category[] {
  if (typeof window === "undefined") return defaultCategories();
  try {
    const raw = window.localStorage.getItem(RATES_KEY);
    if (!raw) return defaultCategories();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultCategories();
    const cats: Category[] = [];
    for (const c of parsed) {
      if (!isObject(c) || typeof c.name !== "string" || !isObject(c.codes)) {
        continue;
      }
      const codes: Record<string, number[]> = {};
      for (const [code, rates] of Object.entries(c.codes)) {
        if (
          Array.isArray(rates) &&
          rates.length > 0 &&
          rates.every((r) => typeof r === "number" && isFinite(r))
        ) {
          codes[code] = rates;
        }
      }
      cats.push({ name: c.name, codes });
    }
    return cats.length > 0 ? cats : defaultCategories();
  } catch {
    return defaultCategories();
  }
}

export function saveCategories(categories: Category[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RATES_KEY, JSON.stringify(categories));
  } catch {
    // Same as above — edits stay in memory for the session.
  }
}
