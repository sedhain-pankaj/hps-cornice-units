import type { Entry } from "@/lib/types";
import { round2, unitsFor } from "@/lib/calc";

export default function DayLedger({
  dayName,
  entries,
  isOff,
  onRemove,
}: {
  dayName: string;
  entries: Entry[];
  isOff: boolean;
  onRemove: (id: string) => void;
}) {
  const dayTotal = entries.reduce((s, e) => s + unitsFor(e), 0);

  return (
    <div className="px-4">
      <div className="mt-2.5 border-t border-dashed border-line">
        {entries.length === 0 ? (
          !isOff && (
            <p className="py-[18px] px-2 text-center text-[12.5px] text-muted">
              No entries yet for {dayName}.
            </p>
          )
        ) : (
          <ul>
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between border-b border-dashed border-line px-0.5 py-2.5 font-mono text-[13px]"
              >
                <span className="min-w-[70px] font-medium text-bone">{e.code}</span>
                <span className="flex-1 pl-2 text-left text-muted">
                  {e.qty} × {e.rate}u
                </span>
                <span className="mr-2.5 font-semibold text-amber">
                  {unitsFor(e)}
                </span>
                <button
                  onClick={() => onRemove(e.id)}
                  aria-label={`Delete entry ${e.code}`}
                  className="cursor-pointer px-1.5 py-0.5 text-base text-muted hover:text-red"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {entries.length > 0 && (
          <div className="flex justify-between px-0.5 pt-2.5 pb-0.5 font-display text-[13px] uppercase tracking-[0.03em] text-bone">
            <span>{dayName} Total</span>
            <b className="font-mono text-amber">{round2(dayTotal)} units</b>
          </div>
        )}
      </div>
    </div>
  );
}
