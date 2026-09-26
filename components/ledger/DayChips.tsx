import type { DayName } from "@/lib/types";
import { DAYS } from "@/lib/types";
import { addDays, parseIso } from "@/lib/dates";

export default function DayChips({
  weekStart,
  activeDay,
  onSelect,
  isOff,
  hasEntries,
}: {
  weekStart: string;
  activeDay: DayName;
  onSelect: (d: DayName) => void;
  isOff: (iso: string) => boolean;
  hasEntries: (iso: string) => boolean;
}) {
  return (
    <section className="px-4 pt-3.5">
      <h2 className="mb-2.5 ml-0.5 font-display text-[11px] uppercase tracking-[0.12em] text-muted">
        Day
      </h2>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="tablist" aria-label="Days of the pay week">
        {DAYS.map((d, i) => {
          const iso = addDays(weekStart, i);
          const dt = parseIso(iso);
          const off = isOff(iso);
          const has = hasEntries(iso);
          const active = d === activeDay;
          return (
            <button
              key={d}
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(d)}
              className={`min-w-[44px] flex-1 rounded-lg border px-1 py-2 text-center font-mono text-xs whitespace-nowrap transition-colors ${
                active
                  ? "border-amber bg-amber/10 text-amber"
                  : "border-line bg-panel text-muted"
              } ${off ? (active ? "opacity-70" : "opacity-45") : ""}`}
            >
              <span className={off ? "line-through" : ""}>{d}</span>
              <span className="block text-[9px] opacity-70">{dt.getDate()}</span>
              <span
                aria-hidden
                className={`mx-auto mt-1 block h-1 w-1 rounded-full bg-amber ${has ? "opacity-100" : "opacity-0"}`}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
