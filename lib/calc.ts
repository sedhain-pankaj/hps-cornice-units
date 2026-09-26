import type { DayRecord, LedgerData } from "./types";
import { addDays, parseIso } from "./dates";

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** units = length made x units-per-length rate, recorded at time of entry. */
export function unitsFor(e: { qty: number; rate: number }): number {
  return round2(e.qty * e.rate);
}

export function dayUnits(rec: DayRecord | undefined): number {
  if (!rec) return 0;
  return rec.entries.reduce((s, e) => s + unitsFor(e), 0);
}

export interface WeekSummary {
  totalUnits: number;
  workingDays: number;
  /** Day-offs marked "Paid" — count as a full day for base pay, no unit target. */
  paidOffDays: number;
  /** Weekday (non-weekend) day-offs that are NOT paid — no base pay, no target. */
  unpaidWeekdayOffs: number;
  basePay: number;
  baseUnitTarget: number;
  remaining: number;
  extraPay: number;
  total: number;
}

export function computeWeekSummary(
  data: LedgerData,
  isDayOff: (iso: string) => boolean
): WeekSummary {
  let totalUnits = 0;
  let workingDays = 0;
  let paidOffDays = 0;
  let unpaidWeekdayOffs = 0;
  for (let i = 0; i < 7; i++) {
    const iso = addDays(data.weekStart, i);
    totalUnits += dayUnits(data.days[iso]);
    if (isDayOff(iso)) {
      if (data.days[iso]?.paid) {
        paidOffDays++;
      } else {
        const weekday = parseIso(iso).getDay(); // 0=Sun..6=Sat
        if (weekday !== 0 && weekday !== 6) unpaidWeekdayOffs++;
      }
    } else {
      workingDays++;
    }
  }
  const { hourly, hoursPerDay, unitsPerDay, extraRate } = data.settings;
  // A paid day-off adds a full day (hoursPerDay) to base pay but no unit target.
  const basePay = hourly * hoursPerDay * (workingDays + paidOffDays);
  const baseUnitTarget = unitsPerDay * workingDays;
  const remaining = Math.max(0, round2(totalUnits - baseUnitTarget));
  const extraPay = remaining * extraRate;
  const total = basePay + extraPay;
  return {
    totalUnits: round2(totalUnits),
    workingDays,
    paidOffDays,
    unpaidWeekdayOffs,
    basePay,
    baseUnitTarget: round2(baseUnitTarget),
    remaining,
    extraPay,
    total,
  };
}

/** "4 full days + 1 paid day off (+ 1 unpaid day off)" — estimate header label. */
export function workingDaysLabel(
  s: Pick<WeekSummary, "workingDays" | "paidOffDays" | "unpaidWeekdayOffs">
): string {
  const parts = [`${s.workingDays} full ${s.workingDays === 1 ? "day" : "days"}`];
  if (s.paidOffDays > 0)
    parts.push(`${s.paidOffDays} paid day ${s.paidOffDays === 1 ? "off" : "offs"}`);
  if (s.unpaidWeekdayOffs > 0)
    parts.push(`${s.unpaidWeekdayOffs} unpaid day ${s.unpaidWeekdayOffs === 1 ? "off" : "offs"}`);
  return parts.join(" + ");
}

/** Unit-target breakdown, e.g. "4 × 8 × 4.5" (days × hours × units-per-hour). */
export function unitTargetBreakdown(
  workingDays: number,
  hoursPerDay: number,
  unitsPerDay: number
): string {
  if (hoursPerDay > 0) {
    const perHour = unitsPerDay / hoursPerDay;
    const perHourStr = String(Math.round(perHour * 1000) / 1000);
    return `${workingDays} × ${hoursPerDay} × ${perHourStr}`;
  }
  return `${workingDays} × ${unitsPerDay}`;
}
