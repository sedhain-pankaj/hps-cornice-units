import type { Settings } from "@/lib/types";
import type { WeekSummary } from "@/lib/calc";
import { workingDaysLabel, unitTargetBreakdown } from "@/lib/calc";

export default function Summary({
  settings,
  summary,
}: {
  settings: Settings;
  summary: WeekSummary;
}) {
  const { hourly, hoursPerDay, unitsPerDay, extraRate } = settings;
  const payDays = summary.workingDays + summary.paidOffDays;
  return (
    <section className="px-4">
      <h2 className="mb-2.5 ml-0.5 font-display text-[11px] uppercase tracking-[0.12em] text-muted">
        Estimate
      </h2>
      <div className="mt-1 rounded-[14px] border border-line bg-gradient-to-b from-[#1c1d1f] to-[#151617] p-4">
        <Row label="Working days this week" value={workingDaysLabel(summary)} />
        <Row
          label={`Base pay (${payDays} days × ${hoursPerDay}hrs × $${hourly.toFixed(2)})`}
          value={`$${summary.basePay.toFixed(2)}`}
        />
        <Row label="Total units this week" value={String(summary.totalUnits)} />
        <Row
          label={`Unit target (${unitTargetBreakdown(summary.workingDays, hoursPerDay, unitsPerDay)})`}
          value={String(summary.baseUnitTarget)}
        />
        <Row label="Remaining units" value={String(summary.remaining)} />
        <Row
          label={`Extra pay (× $${extraRate.toFixed(2)}/unit)`}
          value={`$${summary.extraPay.toFixed(2)}`}
        />
        <div className="mt-2.5 flex items-baseline justify-between border-t border-line pt-3">
          <span className="font-display text-[13px] uppercase tracking-[0.06em] text-muted">
            Estimated Pay
          </span>
          <span className="font-mono text-[26px] font-bold text-green">
            ${summary.total.toFixed(2)}
          </span>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-white/[0.06] py-1.5 font-mono text-[13px] text-muted last-of-type:border-b-0">
      <span>{label}</span>
      <span className="text-bone">{value}</span>
    </div>
  );
}
