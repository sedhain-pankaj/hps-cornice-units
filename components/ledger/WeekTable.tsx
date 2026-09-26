import type { DayName, DayRecord } from "@/lib/types";
import { DAYS } from "@/lib/types";
import { addDays } from "@/lib/dates";
import { dayUnits, round2 } from "@/lib/calc";

export default function WeekTable({
  weekStart,
  activeDay,
  days,
  isOff,
}: {
  weekStart: string;
  activeDay: DayName;
  days: Record<string, DayRecord>;
  isOff: (iso: string) => boolean;
}) {
  const rows = DAYS.map((d, i) => {
    const iso = addDays(weekStart, i);
    const rec = days[iso];
    const count = rec?.entries.length ?? 0;
    const total = dayUnits(rec);
    const off = isOff(iso);
    const paid = off && !!rec?.paid;
    return { d, iso, count, total, off, paid };
  });
  const weekTotal = rows.reduce((s, r) => s + r.total, 0);
  const workingDays = rows.filter((r) => !r.off).length;

  return (
    <section className="px-4">
      <h2 className="mb-2.5 ml-0.5 font-display text-[11px] uppercase tracking-[0.12em] text-muted">
        Week So Far
      </h2>
      <div className="rounded-xl border border-line bg-panel p-3">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="pb-1.5 border-b border-line font-display text-left text-[10px] uppercase tracking-[0.07em] text-muted">
                Day
              </th>
              <th className="pb-1.5 border-b border-line font-display text-right text-[10px] uppercase tracking-[0.07em] text-muted">
                Entries
              </th>
              <th className="pb-1.5 border-b border-line font-display text-right text-[10px] uppercase tracking-[0.07em] text-muted">
                Units
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ d, count, total, off, paid }) => (
              <tr
                key={d}
                className={d === activeDay ? "text-amber" : "text-bone"}
              >
                <td className={`py-2 border-b border-white/5 font-mono text-[13px] ${off && !paid ? "opacity-55" : ""}`}>
                  {off ? (
                    <>
                      <span className={paid ? "" : "line-through"}>{d}</span>{" "}
                      <span
                        className={`ml-0.5 rounded border px-1 py-px align-middle text-[9px] font-bold ${
                          paid
                            ? "border-amber-dim text-amber"
                            : "border-red/40 text-red"
                        }`}
                      >
                        OFF
                      </span>
                      {paid && (
                        <span className="ml-1 rounded border border-amber-dim bg-amber/10 px-1 py-px align-middle text-[9px] font-bold text-amber">
                          PAID
                        </span>
                      )}
                    </>
                  ) : (
                    d
                  )}
                </td>
                <td className={`py-2 border-b border-white/5 text-right font-mono text-[13px] ${off && !paid ? "opacity-55" : ""}`}>
                  {count || "—"}
                </td>
                <td className={`py-2 border-b border-white/5 text-right font-mono text-[13px] ${off && !paid ? "opacity-55" : ""}`}>
                  {count ? round2(total) : "—"}
                </td>
              </tr>
            ))}
            <tr>
              <td className="pt-2.5 font-mono text-[13px] font-semibold text-amber">
                WEEK
                <span className="block font-sans text-[9px] font-normal text-muted">
                  {workingDays} working days
                </span>
              </td>
              <td className="pt-2.5" />
              <td className="pt-2.5 text-right font-mono text-[13px] font-semibold text-amber">
                {round2(weekTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
