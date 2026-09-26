"use client";

import { useMemo, useRef, useState } from "react";
import { lookupRates, normalizeCode } from "@/lib/rates";

export default function EntryForm({
  dayName,
  entryCount,
  isOff,
  isPaid,
  rateIndex,
  rateKeys,
  onToggleOff,
  onTogglePaid,
  onAdd,
}: {
  dayName: string;
  entryCount: number;
  isOff: boolean;
  isPaid: boolean;
  rateIndex: Record<string, number[]>;
  rateKeys: string[];
  onToggleOff: () => void;
  onTogglePaid: () => void;
  /** Returns true when the entry was accepted (form resets). */
  onAdd: (code: string, qty: number, rate: number) => boolean;
}) {
  const [code, setCode] = useState("");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("");
  const [mould, setMould] = useState(0);
  const [sugOpen, setSugOpen] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);

  const rates = code.trim() ? lookupRates(rateIndex, code) : null;

  const suggestions = useMemo(() => {
    const norm = normalizeCode(code);
    if (!norm) return [];
    return rateKeys.filter((k) => k.startsWith(norm)).slice(0, 8);
  }, [code, rateKeys]);

  const showSuggestions =
    sugOpen &&
    suggestions.length > 0 &&
    !(suggestions.length === 1 && suggestions[0] === normalizeCode(code));

  const onCodeChange = (v: string) => {
    setCode(v);
    const r = lookupRates(rateIndex, v);
    if (r) {
      setRate(String(r[0]));
      setMould(0);
    }
  };

  const pickSuggestion = (k: string) => {
    setCode(k);
    setSugOpen(false);
    const r = lookupRates(rateIndex, k);
    if (r) {
      setRate(String(r[0]));
      setMould(0);
    }
    qtyRef.current?.focus();
  };

  const submit = () => {
    const ok = onAdd(code.trim(), parseFloat(qty), parseFloat(rate));
    if (ok) {
      setCode("");
      setQty("");
      setRate("");
      setMould(0);
      setSugOpen(false);
      codeRef.current?.focus();
    }
  };

  const offNote = isOff
    ? entryCount > 0
      ? `Marked as a day off — no new entries can be added. (${entryCount} existing entr${entryCount === 1 ? "y" : "ies"} stay.)`
      : "Marked as a day off — no entries can be added."
    : null;
  const paidNote =
    isOff && isPaid
      ? "Paid day off — a full day is added to base pay (no unit target)."
      : null;

  return (
    <section className="px-4">
      <h2 className="mb-2.5 ml-0.5 font-display text-[11px] uppercase tracking-[0.12em] text-muted">
        Add Entry — <span className="text-bone">{dayName}</span>{" "}
        {entryCount > 0 && (
          <span className="text-amber">({entryCount} entries)</span>
        )}
      </h2>
      <div className="rounded-xl border border-line bg-panel p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2.5 ${
              isOff ? "border-red/30 bg-red/10" : "border-line bg-panel-2"
            }`}
          >
            <input
              type="checkbox"
              checked={isOff}
              onChange={onToggleOff}
              className="h-4 w-4 cursor-pointer accent-red"
            />
            <span
              className={`text-[13px] font-medium ${isOff ? "text-red" : "text-bone"}`}
            >
              Day Off
            </span>
          </label>
          {isOff && (
            <label className="paid-in flex cursor-pointer items-center gap-2 rounded-lg border border-amber-dim bg-amber/10 px-2.5 py-2.5">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={onTogglePaid}
                className="h-4 w-4 cursor-pointer accent-amber"
              />
              <span className="text-[13px] font-medium text-amber">Paid</span>
            </label>
          )}
        </div>
        {offNote && (
          <p className="mb-3 -mt-1.5 px-0.5 text-[11px] leading-relaxed text-muted">
            {offNote}
          </p>
        )}
        {paidNote && (
          <p className="mb-3 -mt-1.5 px-0.5 text-[11px] leading-relaxed text-amber">
            {paidNote}
          </p>
        )}

        <div
          className={isOff ? "pointer-events-none opacity-35" : ""}
          aria-disabled={isOff}
        >
          <label
            htmlFor="cornice-code"
            className="mb-1 block text-[10px] uppercase tracking-[0.08em] text-muted"
          >
            Cornice Code
          </label>
          <div className="relative">
            <input
              id="cornice-code"
              ref={codeRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              placeholder="e.g. 923"
              value={code}
              disabled={isOff}
              onChange={(e) => onCodeChange(e.target.value)}
              onFocus={() => setSugOpen(true)}
              onBlur={() => setTimeout(() => setSugOpen(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setSugOpen(false);
                  qtyRef.current?.focus();
                }
              }}
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 font-mono text-base text-bone outline-none focus:border-amber disabled:cursor-not-allowed"
            />
            {code.trim() && (
              <span
                className={`pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-xs ${
                  rates ? "text-green" : "text-red"
                }`}
              >
                {rates
                  ? rates.length === 1
                    ? `${rates[0]} u`
                    : `${rates.length} moulds`
                  : "custom"}
              </span>
            )}
            {showSuggestions && (
              <div className="absolute top-[calc(100%+4px)] right-0 left-0 z-30 max-h-[180px] overflow-y-auto rounded-lg border border-line bg-panel-2">
                {suggestions.map((k) => {
                  const r = rateIndex[k];
                  const rateLabel =
                    r.length > 1 ? r.map((x) => x + "u").join(" / ") : r[0] + "u";
                  return (
                    <button
                      key={k}
                      className="flex w-full cursor-pointer items-center justify-between px-3 py-2 font-mono text-[13px] text-bone hover:bg-amber/10"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pickSuggestion(k);
                      }}
                    >
                      <span>{k}</span>
                      <span className="text-amber">{rateLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {rates && rates.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Mould rate">
              {rates.map((r, i) => (
                <button
                  key={i}
                  role="radio"
                  aria-checked={mould === i}
                  onClick={() => {
                    setRate(String(r));
                    setMould(i);
                  }}
                  className={`rounded-md border border-amber-dim px-2.5 py-1.5 font-mono text-xs ${
                    mould === i
                      ? "bg-amber font-semibold text-[#1a1a1a]"
                      : "bg-amber/10 text-amber"
                  }`}
                >
                  Mould {String.fromCharCode(65 + i)} · {r}u
                </button>
              ))}
            </div>
          )}

          <div className="mt-2.5 flex gap-2">
            <div className="flex-1">
              <label
                htmlFor="entry-qty"
                className="mb-1 block text-[10px] uppercase tracking-[0.08em] text-muted"
              >
                Length Made
              </label>
              <input
                id="entry-qty"
                ref={qtyRef}
                type="number"
                inputMode="decimal"
                placeholder="Qty"
                value={qty}
                disabled={isOff}
                onChange={(e) => setQty(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    rateRef.current?.focus();
                  }
                }}
                className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 font-mono text-base text-bone outline-none focus:border-amber disabled:cursor-not-allowed"
              />
            </div>
            <div className="w-[110px]">
              <label
                htmlFor="entry-rate"
                className="mb-1 block text-[10px] uppercase tracking-[0.08em] text-muted"
              >
                Units/Length
              </label>
              <input
                id="entry-rate"
                ref={rateRef}
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="Units"
                value={rate}
                disabled={isOff}
                onChange={(e) => setRate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 font-mono text-base text-bone outline-none focus:border-amber disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <button
            onClick={submit}
            disabled={isOff}
            className="mt-2.5 w-full rounded-lg bg-amber py-2.5 font-display text-sm font-semibold uppercase tracking-[0.04em] text-[#1a1a1a] disabled:opacity-35"
          >
            + Add to Ledger
          </button>
        </div>
      </div>
    </section>
  );
}
