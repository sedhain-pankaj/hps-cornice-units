"use client";

import { useState } from "react";
import type { Settings } from "@/lib/types";
import { isValidOwnerName } from "@/lib/naming";
import Modal from "./Modal";

export default function SettingsModal({
  settings,
  ownerName,
  readOnly,
  onSave,
  onSaveName,
  onClose,
}: {
  settings: Settings;
  ownerName: string;
  readOnly?: boolean;
  onSave: (s: Settings) => void;
  onSaveName: (name: string) => void;
  onClose: () => void;
}) {
  const [hourly, setHourly] = useState(String(settings.hourly));
  const [hoursPerDay, setHoursPerDay] = useState(String(settings.hoursPerDay));
  const [unitsPerDay, setUnitsPerDay] = useState(String(settings.unitsPerDay));
  const [extraRate, setExtraRate] = useState(String(settings.extraRate));
  const [nameDraft, setNameDraft] = useState(ownerName);
  const [nameError, setNameError] = useState<string | null>(null);

  const save = () => {
    onSave({
      hourly: parseFloat(hourly) || 0,
      hoursPerDay: parseFloat(hoursPerDay) || 0,
      unitsPerDay: parseFloat(unitsPerDay) || 0,
      extraRate: parseFloat(extraRate) || 0,
    });
    onClose();
  };

  const saveName = () => {
    if (!isValidOwnerName(nameDraft)) {
      setNameError("Letters only, up to 10 characters.");
      return;
    }
    onSaveName(nameDraft);
    setNameError(null);
  };

  return (
    <Modal label="Settings" onClose={onClose}>
      <h2 className="mb-3.5 font-display text-[15px] uppercase tracking-[0.06em] text-bone">
        Settings
      </h2>

      {/* Name — editable by everyone (unlike pay settings). */}
      <label
        htmlFor="owner-name-setting"
        className="mb-1 block text-[11px] uppercase tracking-[0.06em] text-muted"
      >
        Your Name
      </label>
      <input
        id="owner-name-setting"
        type="text"
        value={nameDraft}
        maxLength={10}
        autoComplete="off"
        autoCapitalize="words"
        onChange={(e) => {
          setNameDraft(e.target.value.replace(/[^A-Za-z]/g, ""));
          setNameError(null);
        }}
        className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 font-mono text-base text-bone outline-none focus:border-amber"
      />
      <p className="mx-0.5 -mt-1 mb-2.5 text-[11px] leading-relaxed text-muted">
        Letters only, up to 10 characters. Prefixed to your export filenames.
      </p>
      {nameError && (
        <p className="mb-2 text-[12px] font-medium text-red">{nameError}</p>
      )}
      <button
        className="w-full cursor-pointer rounded-lg border border-amber-dim py-2.5 font-display text-xs uppercase tracking-[0.05em] text-amber"
        onClick={saveName}
      >
        Save Name
      </button>

      {/* Pay settings — admin only. */}
      <div className="mt-5 border-t border-line pt-4">
        <span className="mb-2 block text-[11px] uppercase tracking-[0.06em] text-muted">
          Pay Settings
        </span>
        {readOnly && (
          <p className="mb-3 rounded-lg border border-line bg-panel-2 px-3 py-2 text-[11.5px] text-muted">
            View only — admin access is required to change pay settings.
          </p>
        )}
        <Field
          label="Hourly Rate ($)"
          value={hourly}
          onChange={setHourly}
          disabled={readOnly}
        />
        <Field
          label="Base Hours / Working Day"
          value={hoursPerDay}
          onChange={setHoursPerDay}
          disabled={readOnly}
        />
        <Field
          label="Base Units / Working Day"
          value={unitsPerDay}
          onChange={setUnitsPerDay}
          disabled={readOnly}
        />
        <Field
          label="Extra Rate ($ / unit)"
          value={extraRate}
          onChange={setExtraRate}
          disabled={readOnly}
        />
        <p className="mx-0.5 -mt-1 mb-3 text-[11px] leading-relaxed text-muted">
          Base pay and the unit target both multiply by however many days this
          week aren&apos;t marked &quot;Day Off&quot;. A paid day-off adds a
          full day to base pay.
        </p>
        {!readOnly && (
          <button
            className="w-full rounded-lg bg-amber py-3 font-display text-sm font-semibold uppercase tracking-[0.05em] text-[#1a1a1a]"
            onClick={save}
          >
            Save
          </button>
        )}
      </div>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
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
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 font-mono text-base text-bone outline-none focus:border-amber disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
