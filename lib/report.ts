import type { LedgerData } from "./types";
import { DAYS } from "./types";
import { fmtDate, isoDate, parseIso, wednesdayOf } from "./dates";
import {
  round2,
  unitsFor,
  computeWeekSummary,
  workingDaysLabel,
  unitTargetBreakdown,
} from "./calc";

// Draws a clean, printable pay-summary sheet: daily tallies with the
// cornice code/qty/rate/units behind each entry, plus the full pay calc.
// Runs the same layout function twice — once with ctx=null just to measure
// the total height needed, then again on a properly-sized canvas to draw —
// so the two passes can never drift out of sync with each other.

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function buildWeekReport(
  ctx: CanvasRenderingContext2D | null,
  W: number,
  data: LedgerData,
  isDayOff: (iso: string) => boolean
): number {
  const marginX = 40;
  const contentW = W - marginX * 2;
  let y = 0;
  const draw = (fn: (c: CanvasRenderingContext2D) => void) => {
    if (ctx) fn(ctx);
  };

  const start = parseIso(data.weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const isCurrent = data.weekStart === isoDate(wednesdayOf(new Date()));

  draw((c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, W, 100000);
  });

  y += 38;
  draw((c) => {
    c.fillStyle = "#1c1c1e";
    c.font = "700 24px -apple-system, Helvetica, Arial, sans-serif";
    c.fillText("Weekly Pay Summary", marginX, y);
  });

  y += 22;
  draw((c) => {
    c.fillStyle = "#6e6e73";
    c.font = "500 14px -apple-system, Helvetica, Arial, sans-serif";
    c.fillText(
      `Week of ${fmtDate(start)} – ${fmtDate(end)}` + (isCurrent ? " (current)" : ""),
      marginX,
      y
    );
  });

  y += 16;
  draw((c) => {
    c.fillStyle = "#a0a0a5";
    c.font = "400 11px -apple-system, Helvetica, Arial, sans-serif";
    c.fillText(
      "Generated " +
        new Date().toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }),
      marginX,
      y
    );
  });

  y += 14;
  draw((c) => {
    c.strokeStyle = "#e5e5ea";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(marginX, y);
    c.lineTo(W - marginX, y);
    c.stroke();
  });
  y += 22;

  let weekTotal = 0;

  DAYS.forEach((d, i) => {
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);
    const iso = isoDate(dt);
    const dayEntries = data.days[iso]?.entries ?? [];
    const dayTotal = dayEntries.reduce((s, e) => s + unitsFor(e), 0);
    weekTotal += dayTotal;
    const off = isDayOff(iso);
    const paid = off && !!data.days[iso]?.paid;

    draw((c) => {
      c.fillStyle = "#1c1c1e";
      c.font = "700 15px -apple-system, Helvetica, Arial, sans-serif";
      c.fillText(`${d} ${dt.getDate()} ${dt.toLocaleDateString("en-AU", { month: "short" })}`, marginX, y + 12);
      c.textAlign = "right";
      if (off) {
        c.fillStyle = paid ? "#b8860b" : "#d9645b";
        c.font = "700 12px -apple-system, Helvetica, Arial, sans-serif";
        c.fillText(paid ? "DAY OFF (PAID)" : "DAY OFF", W - marginX, y + 12);
      } else {
        c.fillStyle = "#b8860b";
        c.font = "700 13px -apple-system, Helvetica, Arial, sans-serif";
        c.fillText(dayEntries.length ? `${round2(dayTotal)} units` : "—", W - marginX, y + 12);
      }
      c.textAlign = "left";
    });
    y += 24;

    if (dayEntries.length > 0) {
      draw((c) => {
        c.fillStyle = "#a0a0a5";
        c.font = "600 10px -apple-system, Helvetica, Arial, sans-serif";
        c.fillText("CODE", marginX + 4, y + 8);
        c.fillText("QTY", marginX + 150, y + 8);
        c.fillText("RATE", marginX + 230, y + 8);
        c.fillText("UNITS", marginX + 330, y + 8);
      });
      y += 16;
      dayEntries.forEach((e) => {
        draw((c) => {
          c.fillStyle = "#1c1c1e";
          c.font = "500 13px Menlo, Consolas, monospace";
          c.fillText(e.code, marginX + 4, y + 14);
          c.fillText(String(e.qty), marginX + 150, y + 14);
          c.fillText(e.rate + "u", marginX + 230, y + 14);
          c.fillStyle = "#b8860b";
          c.fillText(String(unitsFor(e)), marginX + 330, y + 14);
        });
        y += 22;
      });
    } else {
      draw((c) => {
        c.fillStyle = "#a0a0a5";
        c.font = "italic 12px -apple-system, Helvetica, Arial, sans-serif";
        c.fillText(off ? "No entries — day off" : "No entries", marginX + 4, y + 14);
      });
      y += 22;
    }

    y += 6;
    draw((c) => {
      c.strokeStyle = "#f0f0f2";
      c.beginPath();
      c.moveTo(marginX, y);
      c.lineTo(W - marginX, y);
      c.stroke();
    });
    y += 14;
  });

  draw((c) => {
    c.fillStyle = "#1c1c1e";
    c.font = "700 16px -apple-system, Helvetica, Arial, sans-serif";
    c.fillText("WEEK TOTAL", marginX, y + 14);
    c.fillStyle = "#b8860b";
    c.textAlign = "right";
    c.fillText(`${round2(weekTotal)} units`, W - marginX, y + 14);
    c.textAlign = "left";
  });
  y += 40;

  const summary = computeWeekSummary(data, isDayOff);
  const { hourly, hoursPerDay, unitsPerDay, extraRate } = data.settings;
  const {
    workingDays,
    paidOffDays,
    basePay,
    baseUnitTarget,
    remaining,
    extraPay,
    total,
  } = summary;
  const payDays = workingDays + paidOffDays;

  const boxTop = y;
  const boxHeight = 236;
  draw((c) => {
    c.fillStyle = "#f7f7f8";
    roundRectPath(c, marginX, boxTop, contentW, boxHeight, 10);
    c.fill();
  });

  y += 26;
  draw((c) => {
    c.fillStyle = "#6e6e73";
    c.font = "700 11px -apple-system, Helvetica, Arial, sans-serif";
    c.fillText("PAY CALCULATION", marginX + 20, y);
  });
  y += 24;

  const rows: [string, string][] = [
    ["Working days", workingDaysLabel(summary)],
    [`Base pay (${payDays} days × ${hoursPerDay}hrs × $${hourly.toFixed(2)})`, `$${basePay.toFixed(2)}`],
    ["Total units made", `${round2(summary.totalUnits)}`],
    [`Unit target (${unitTargetBreakdown(workingDays, hoursPerDay, unitsPerDay)})`, `${round2(baseUnitTarget)}`],
    ["Remaining units", `${remaining}`],
    [`Extra pay (× $${extraRate.toFixed(2)}/unit)`, `$${extraPay.toFixed(2)}`],
  ];
  rows.forEach(([label, value]) => {
    draw((c) => {
      c.fillStyle = "#3a3a3c";
      c.font = "400 13px -apple-system, Helvetica, Arial, sans-serif";
      c.fillText(label, marginX + 20, y);
      c.textAlign = "right";
      c.fillText(value, W - marginX - 20, y);
      c.textAlign = "left";
    });
    y += 22;
  });

  y += 6;
  draw((c) => {
    c.strokeStyle = "#d8d8dc";
    c.beginPath();
    c.moveTo(marginX + 20, y);
    c.lineTo(W - marginX - 20, y);
    c.stroke();
  });
  y += 28;

  draw((c) => {
    c.fillStyle = "#1c1c1e";
    c.font = "700 14px -apple-system, Helvetica, Arial, sans-serif";
    c.fillText("ESTIMATED PAY", marginX + 20, y);
    c.fillStyle = "#1e8e3e";
    c.font = "700 22px -apple-system, Helvetica, Arial, sans-serif";
    c.textAlign = "right";
    c.fillText(`$${total.toFixed(2)}`, W - marginX - 20, y);
    c.textAlign = "left";
  });

  y = boxTop + boxHeight + 24;
  draw((c) => {
    c.fillStyle = "#a0a0a5";
    c.font = "400 10px -apple-system, Helvetica, Arial, sans-serif";
    c.fillText(
      'Generated by Cornice Ledger. "Units" = length made × units-per-length rate recorded at time of entry.',
      marginX,
      y
    );
  });
  y += 20;

  return y;
}

/** Renders the weekly pay summary for the viewed week as a JPEG blob. */
export function renderWeekAsJPEGBlob(
  data: LedgerData,
  isDayOff: (iso: string) => boolean
): Promise<Blob | null> {
  const W = 800;
  const totalHeight = buildWeekReport(null, W, data, isDayOff); // measure pass

  const canvas = document.createElement("canvas");
  const scale = 2; // sharper output
  canvas.width = W * scale;
  canvas.height = totalHeight * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, totalHeight);

  buildWeekReport(ctx, W, data, isDayOff); // draw pass

  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
  );
}
