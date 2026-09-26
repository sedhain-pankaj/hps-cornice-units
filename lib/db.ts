import type { DayRecord, LedgerData, Settings } from "./types";
import { humanDateKey, isoFromHumanKey } from "./dates";
import { round2 } from "./calc";
import { isValidOwnerName } from "./naming";

/**
 * Human-readable JSON backup format (v4). Example:
 * {
 *   "app": "Cornice Ledger",
 *   "version": 4,
 *   "exportedAt": "2026-08-18T04:12:00.000Z",
 *   "ownerName": "John",
 *   "settings": { "hourly": 28.5, "hoursPerDay": 8, "unitsPerDay": 36, "extraRate": 3.8 },
 *   "days": {
 *     "wednesday 12/08/2026": { "923 (3)": 6, "696 (9)": 6 },
 *     "saturday 15/08/2026": { "_off": true, "_paid": true }
 *   }
 * }
 * Entry keys are "CODE (rate)" — same code+rate pairs are merged by quantity.
 * `ownerName` (v4) is the person the ledger belongs to; it's prefixed to export
 * filenames. v2/v3 files (no `_paid` / no `ownerName`) load fine.
 */
export interface DbFile {
  app?: string;
  version?: number;
  exportedAt?: string;
  ownerName?: string;
  settings?: Settings;
  days?: Record<string, Record<string, number | boolean>>;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function buildDbObject(data: LedgerData): DbFile {
  const days: DbFile["days"] = {};
  for (const [iso, rec] of Object.entries(data.days)) {
    const entries = rec.entries ?? [];
    if (
      entries.length === 0 &&
      rec.off === undefined &&
      rec.paid === undefined
    ) {
      continue;
    }
    const dayObj: Record<string, number | boolean> = {};
    if (rec.off !== undefined) dayObj._off = rec.off;
    if (rec.paid !== undefined) dayObj._paid = rec.paid;
    for (const e of entries) {
      const key = `${e.code} (${e.rate})`;
      const prev = typeof dayObj[key] === "number" ? (dayObj[key] as number) : 0;
      dayObj[key] = round2(prev + e.qty);
    }
    days[humanDateKey(iso)] = dayObj;
  }
  const db: DbFile = {
    app: "Cornice Ledger",
    version: 4,
    exportedAt: new Date().toISOString(),
    settings: data.settings,
    days,
  };
  if (data.ownerName && isValidOwnerName(data.ownerName)) {
    db.ownerName = data.ownerName;
  }
  return db;
}

/** Replaces days+settings (+ owner name, if the file has one) in `data`. */
export function applyDbObject(data: LedgerData, db: DbFile): LedgerData {
  const settings: Settings = db.settings ?? data.settings;
  // A file with a valid name wins; older files (no name) keep the current one.
  const ownerName =
    typeof db.ownerName === "string" && isValidOwnerName(db.ownerName)
      ? db.ownerName
      : data.ownerName;
  const days: Record<string, DayRecord> = {};
  for (const [humanKey, dayObj] of Object.entries(db.days ?? {})) {
    const iso = isoFromHumanKey(humanKey);
    if (!iso || !dayObj || typeof dayObj !== "object") continue;
    const rec: DayRecord = { entries: [] };
    if (typeof dayObj._off === "boolean") rec.off = dayObj._off;
    if (typeof dayObj._paid === "boolean") rec.paid = dayObj._paid;
    for (const [k, qty] of Object.entries(dayObj)) {
      if (k === "_off" || k === "_paid") continue;
      const m = k.match(/^(.*?)\s*\(([\d.]+)\)\s*$/);
      const code = m ? m[1] : k;
      const rate = m ? parseFloat(m[2]) : 0;
      const parsedQty =
        typeof qty === "number" ? qty : parseFloat(String(qty)) || 0;
      rec.entries.push({ id: newId(), code, rate, qty: parsedQty });
    }
    days[iso] = rec;
  }
  return { ...data, settings, days, ownerName };
}
