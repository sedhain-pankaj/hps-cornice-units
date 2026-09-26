// All date math is done in LOCAL time. ISO strings are formatted/parsed from
// local components (never via toISOString / Date.parse of a bare date), so the
// pay week is correct regardless of the user's UTC offset.

/** Finds the Wednesday that starts the pay period containing date `d`. */
export function wednesdayOf(d: Date): Date {
  const dt = new Date(d);
  const day = dt.getDay(); // Sun=0 ... Sat=6
  const offset = (day - 3 + 7) % 7; // days since most recent Wednesday
  dt.setDate(dt.getDate() - offset);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/** Local ISO date ("2026-08-18") for a Date. */
export function isoDate(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a local ISO date into a Date at local midnight. */
export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const dt = parseIso(iso);
  dt.setDate(dt.getDate() + n);
  return isoDate(dt);
}

export function fmtDate(dt: Date): string {
  return dt.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

/**
 * "2026-08-18_02-05-09PM" — local date + 12-hour time stamp for export
 * filenames. Every part is 2 digits except the 4-digit year; the time is
 * 12-hour (zero-padded) with an AM/PM suffix.
 */
export function fileStamp(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const h24 = d.getHours();
  const h12 = ((h24 + 11) % 12) + 1; // 1..12
  const meridiem = h24 < 12 ? "AM" : "PM";
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(
    h12
  )}-${p(d.getMinutes())}-${p(d.getSeconds())}${meridiem}`;
}

const DAY_NAMES_FULL = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/** "2026-08-12" -> "wednesday 12/08/2026" (JSON backup key format). */
export function humanDateKey(iso: string): string {
  const dt = parseIso(iso);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${DAY_NAMES_FULL[dt.getDay()]} ${dd}/${mm}/${yyyy}`;
}

/** "wednesday 12/08/2026" -> "2026-08-12" (day name is cosmetic/ignored). */
export function isoFromHumanKey(key: string): string | null {
  const m = String(key).trim().match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}
