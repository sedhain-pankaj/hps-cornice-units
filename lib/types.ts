export interface Entry {
  id: string;
  code: string;
  qty: number;
  rate: number;
}

export interface DayRecord {
  entries: Entry[];
  /** Explicit day-off override. Sat/Sun default to off, everything else on. */
  off?: boolean;
  /**
   * Only meaningful when the day is off: a paid day-off (sick/personal leave)
   * counts as a full working day for base pay but adds no unit target.
   */
  paid?: boolean;
}

/** How the user started this browser session (chosen on the startup screen). */
export type Mode = "loaded" | "new" | "admin";

export interface Settings {
  hourly: number;
  hoursPerDay: number;
  unitsPerDay: number;
  extraRate: number;
}

export interface Category {
  name: string;
  codes: Record<string, number[]>;
}

export interface LedgerData {
  /** ISO date of the Wednesday that starts the pay week being viewed. */
  weekStart: string;
  /** The entire database, keyed by local ISO date ("2026-08-18"). */
  days: Record<string, DayRecord>;
  settings: Settings;
  /**
   * The person this ledger belongs to (letters only, max 10 chars). Prefixed
   * to export filenames and stored in the JSON backup. Absent until set.
   */
  ownerName?: string;
}

export type DayName = "Wed" | "Thu" | "Fri" | "Sat" | "Sun" | "Mon" | "Tue";

/** Pay week runs Wed -> Tue, in display order. */
export const DAYS: DayName[] = ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"];
