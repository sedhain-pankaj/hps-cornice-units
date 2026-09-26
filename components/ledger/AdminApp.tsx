"use client";

import { useState } from "react";
import type { Category, Settings } from "@/lib/types";
import RateBookList from "./RateBookList";

// The admin view. An admin's only job is maintaining the pay settings and the
// cornice rate book — so this screen shows exactly those two things (both
// editable) plus a way to log back out to the startup screen. No ledger, no
// owner name, no import/export.
export default function AdminApp({
  categories,
  settings,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onOpenCodeModal,
  onSaveSettings,
  onLogout,
}: {
  categories: Category[];
  settings: Settings;
  onAddCategory: () => void;
  onRenameCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  onOpenCodeModal: (code: string | null, category: string) => void;
  onSaveSettings: (s: Settings) => void;
  onLogout: () => void;
}) {
  const [hourly, setHourly] = useState(String(settings.hourly));
  const [hoursPerDay, setHoursPerDay] = useState(String(settings.hoursPerDay));
  const [unitsPerDay, setUnitsPerDay] = useState(String(settings.unitsPerDay));
  const [extraRate, setExtraRate] = useState(String(settings.extraRate));

  const save = () => {
    onSaveSettings({
      hourly: parseFloat(hourly) || 0,
      hoursPerDay: parseFloat(hoursPerDay) || 0,
      unitsPerDay: parseFloat(unitsPerDay) || 0,
      extraRate: parseFloat(extraRate) || 0,
    });
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col lg:max-w-3xl">
      <header className="sticky top-0 z-20 border-b border-line bg-bg px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl uppercase tracking-[0.06em] text-bone">
            Admin <span className="text-red">Panel</span>
          </h1>
          <button
            className="cursor-pointer rounded-lg border border-red/30 px-3 py-2 font-display text-xs uppercase tracking-[0.05em] text-red"
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
        <p className="mt-1 font-mono text-[11px] text-muted">
          Manage pay settings and the cornice rate book.
        </p>
      </header>

      <div className="flex flex-col gap-4 px-4 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <section className="rounded-xl border border-line bg-panel p-4">
          <h2 className="mb-3 font-display text-[15px] uppercase tracking-[0.06em] text-bone">
            Pay Settings
          </h2>
          <Field
            label="Hourly Rate ($)"
            value={hourly}
            onChange={setHourly}
          />
          <Field
            label="Base Hours / Working Day"
            value={hoursPerDay}
            onChange={setHoursPerDay}
          />
          <Field
            label="Base Units / Working Day"
            value={unitsPerDay}
            onChange={setUnitsPerDay}
          />
          <Field
            label="Extra Rate ($ / unit)"
            value={extraRate}
            onChange={setExtraRate}
          />
          <p className="mx-0.5 -mt-1 mb-3 text-[11px] leading-relaxed text-muted">
            Base pay and the unit target both multiply by however many days this
            week aren&apos;t marked &quot;Day Off&quot;. A paid day-off adds a
            full day to base pay.
          </p>
          <button
            className="w-full cursor-pointer rounded-lg bg-amber py-3 font-display text-sm font-semibold uppercase tracking-[0.05em] text-[#1a1a1a]"
            onClick={save}
          >
            Save
          </button>
        </section>

        <section className="rounded-xl border border-line bg-panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[15px] uppercase tracking-[0.06em] text-bone">
              Rate Book
            </h2>
            <button
              className="cursor-pointer rounded-lg border border-amber-dim px-2.5 py-2 font-display text-[11px] uppercase tracking-[0.05em] text-amber"
              onClick={onAddCategory}
            >
              + Section
            </button>
          </div>
          <RateBookList
            categories={categories}
            onRenameCategory={onRenameCategory}
            onDeleteCategory={onDeleteCategory}
            onOpenCodeModal={onOpenCodeModal}
            listClassName="pt-1 pb-1"
          />
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-[11px] uppercase tracking-[0.06em] text-muted">
        {label}
      </label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 font-mono text-base text-bone outline-none focus:border-amber"
      />
    </div>
  );
}
