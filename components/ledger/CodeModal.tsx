"use client";

import { useState } from "react";
import type { Category } from "@/lib/types";
import Modal from "./Modal";

export default function CodeModal({
  code,
  category,
  categories,
  onSave,
  onDelete,
  onCancel,
}: {
  /** null when adding a new cornice. */
  code: string | null;
  category: string;
  categories: Category[];
  onSave: (code: string | null, targetCat: string, rates: number[]) => void;
  onDelete: (code: string, category: string) => void;
  onCancel: () => void;
}) {
  const existingRates = code
    ? categories.find((c) => c.codes[code])?.codes[code] ?? [1]
    : null;
  const [codeVal, setCodeVal] = useState(code ?? "");
  const [catVal, setCatVal] = useState(category);
  const [rateRows, setRateRows] = useState<string[]>(
    existingRates ? existingRates.map(String) : [""]
  );

  const setRateRow = (i: number, v: string) => {
    setRateRows((rows) => rows.map((r, j) => (j === i ? v : r)));
  };

  const removeRateRow = (i: number) => {
    setRateRows((rows) => (rows.length > 1 ? rows.filter((_, j) => j !== i) : rows));
  };

  return (
    <Modal label={code ? "Edit Cornice" : "Add Cornice"} onClose={onCancel}>
      <h2 className="mb-3.5 font-display text-[15px] uppercase tracking-[0.06em] text-bone">
        {code ? "Edit Cornice" : "Add Cornice"}
      </h2>
      <div className="mb-3">
        <label
          htmlFor="edit-code"
          className="mb-1 block text-[11px] uppercase tracking-[0.06em] text-muted"
        >
          Code
        </label>
        <input
          id="edit-code"
          type="text"
          autoComplete="off"
          placeholder="e.g. 923"
          value={codeVal}
          onChange={(e) => setCodeVal(e.target.value)}
          className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 font-mono text-sm text-bone outline-none focus:border-amber"
        />
      </div>
      <div className="mb-3">
        <label
          htmlFor="edit-category"
          className="mb-1 block text-[11px] uppercase tracking-[0.06em] text-muted"
        >
          Section
        </label>
        <select
          id="edit-category"
          value={catVal}
          onChange={(e) => setCatVal(e.target.value)}
          className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 font-mono text-sm text-bone outline-none focus:border-amber"
        >
          {categories.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-1">
        <span className="mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-muted">
          Units per length made — add more than one if this code has multiple
          moulds
        </span>
        {rateRows.map((r, i) => (
          <div key={i} className="mb-1.5 flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="Units"
              value={r}
              aria-label={`Rate ${i + 1}`}
              onChange={(e) => setRateRow(i, e.target.value)}
              className="flex-1 rounded-lg border border-line bg-panel-2 px-3 py-2.5 font-mono text-sm text-bone outline-none focus:border-amber"
            />
            <button
              className="cursor-pointer px-1.5 py-1 text-sm text-red"
              onClick={() => removeRateRow(i)}
              aria-label={`Remove rate ${i + 1}`}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          className="mt-1 w-full cursor-pointer rounded-lg border border-line py-2 font-display text-xs uppercase tracking-[0.05em] text-muted"
          onClick={() => setRateRows((rows) => [...rows, ""])}
        >
          + Add another rate
        </button>
      </div>
      <button
        className="mt-2 w-full rounded-lg bg-amber py-3 font-display text-sm font-semibold uppercase tracking-[0.05em] text-[#1a1a1a]"
        onClick={() =>
          onSave(
            codeVal,
            catVal,
            rateRows.map((r) => parseFloat(r)).filter((v) => !isNaN(v) && v > 0)
          )
        }
      >
        Save
      </button>
      {code && (
        <button
          className="mt-2 w-full cursor-pointer rounded-lg border border-red/30 py-2.5 font-display text-xs uppercase tracking-[0.05em] text-red"
          onClick={() => onDelete(code, category)}
        >
          Delete Cornice
        </button>
      )}
      <button
        className="mt-2 w-full cursor-pointer rounded-lg border border-line py-2.5 font-display text-xs uppercase tracking-[0.05em] text-muted"
        onClick={onCancel}
      >
        Cancel
      </button>
    </Modal>
  );
}
