"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { DayName, DayRecord, Settings } from "@/lib/types";
import { DAYS } from "@/lib/types";
import {
  addDays,
  fileStamp,
  fmtDate,
  isoDate,
  parseIso,
  wednesdayOf,
} from "@/lib/dates";
import {
  buildRateIndex,
  categoryOfCode,
  normalizeCode,
} from "@/lib/rates";
import {
  applyDbObject,
  buildDbObject,
  newId,
  type DbFile,
} from "@/lib/db";
import { computeWeekSummary } from "@/lib/calc";
import { renderWeekAsJPEGBlob } from "@/lib/report";
import { saveBlob } from "@/lib/files";
import { isValidOwnerName } from "@/lib/naming";
import {
  SERVER_CATEGORIES,
  SERVER_DATA,
  dataStore,
  modeStore,
  ratesStore,
  useHydrated,
  useMode,
} from "@/lib/store";
import TopBar from "./TopBar";
import DayChips from "./DayChips";
import EntryForm from "./EntryForm";
import DayLedger from "./DayLedger";
import WeekTable from "./WeekTable";
import Summary from "./Summary";
import RateBook from "./RateBook";
import CodeModal from "./CodeModal";
import SettingsModal from "./SettingsModal";
import Dialogs, { type DialogRequest } from "./Dialogs";
import Toast from "./Toast";
import StartupScreen from "./StartupScreen";
import AdminApp from "./AdminApp";

export default function LedgerApp() {
  // Ledger data + rate book live in localStorage, read through
  // useSyncExternalStore: the server renders the empty state, the client
  // hydrates straight into the saved data (and stays in sync across tabs).
  const data = useSyncExternalStore(
    dataStore.subscribe,
    dataStore.getSnapshot,
    () => SERVER_DATA
  );
  const categories = useSyncExternalStore(
    ratesStore.subscribe,
    ratesStore.getSnapshot,
    () => SERVER_CATEGORIES
  );
  // null = the startup screen (Load JSON / New user / Admin) is showing.
  const mode = useMode();
  const hydrated = useHydrated();
  // "Today's" weekday is only meaningful in the browser; before hydration we
  // render "Wed" so server and client markup always agree.
  const [activeDayOverride, setActiveDayOverride] = useState<DayName | null>(
    null
  );
  const activeDay: DayName = hydrated
    ? (activeDayOverride ?? DAYS[(new Date().getDay() - 3 + 7) % 7])
    : "Wed";
  const [rateBookOpen, setRateBookOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [codeModal, setCodeModal] = useState<{
    code: string | null;
    category: string;
  } | null>(null);
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [saveHintShown, setSaveHintShown] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toast = useCallback((msg: string, ms = 1600) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), ms);
  }, []);

  const askConfirm = useCallback(
    (title: string, message: string, confirmLabel?: string) =>
      new Promise<boolean>((resolve) => {
        setDialog({ kind: "confirm", title, message, confirmLabel, resolve });
      }),
    []
  );

  const askPrompt = useCallback(
    (title: string, initialValue?: string) =>
      new Promise<string | null>((resolve) => {
        setDialog({ kind: "prompt", title, initialValue, resolve });
      }),
    []
  );

  const closeDialog = (result: boolean | string | null) => {
    if (!dialog) return;
    if (dialog.kind === "confirm") dialog.resolve(result === true);
    else dialog.resolve(typeof result === "string" ? result : null);
    setDialog(null);
  };

  const rateIndex = useMemo(() => buildRateIndex(categories), [categories]);

  const isDayOffDate = useCallback(
    (iso: string) => {
      const rec = data.days[iso];
      if (rec && rec.off !== undefined) return rec.off;
      const weekday = parseIso(iso).getDay(); // Sun=0..Sat=6
      return weekday === 0 || weekday === 6;
    },
    [data.days]
  );

  const isDayPaid = useCallback(
    (iso: string) => !!data.days[iso]?.paid,
    [data.days]
  );

  const isoForDayIndex = (i: number) => addDays(data.weekStart, i);
  const activeIso = isoForDayIndex(DAYS.indexOf(activeDay));
  const activeDayOff = isDayOffDate(activeIso);
  const activeDayPaid = isDayPaid(activeIso);
  const activeEntries = data.days[activeIso]?.entries ?? [];
  const isCurrentWeek = data.weekStart === isoDate(wednesdayOf(new Date()));
  const weekLabel = `Week of ${fmtDate(parseIso(data.weekStart))} – ${fmtDate(
    parseIso(isoForDayIndex(6))
  )}${isCurrentWeek ? " (current)" : ""}`;

  // ---------- Entry actions ----------

  const addEntry = (codeRaw: string, qty: number, rate: number): boolean => {
    if (activeDayOff) {
      toast(`${activeDay} is marked as a day off`);
      return false;
    }
    if (!codeRaw) {
      toast("Enter a cornice code");
      return false;
    }
    if (!qty || qty <= 0) {
      toast("Enter a valid quantity");
      return false;
    }
    if (!rate || rate <= 0) {
      toast("Enter a units-per-length rate");
      return false;
    }
    const entry = { id: newId(), code: normalizeCode(codeRaw), qty, rate };
    dataStore.update((d) => {
      const rec = d.days[activeIso] ?? { entries: [] };
      return {
        ...d,
        days: {
          ...d.days,
          [activeIso]: { ...rec, entries: [...rec.entries, entry] },
        },
      };
    });
    if (mode === "new" && !saveHintShown) {
      setSaveHintShown(true);
      toast(
        "First time? Save your data before closing so you can continue next time.",
        4200
      );
    }
    return true;
  };

  const removeEntry = (id: string) => {
    dataStore.update((d) => {
      const rec = d.days[activeIso];
      if (!rec) return d;
      return {
        ...d,
        days: {
          ...d.days,
          [activeIso]: {
            ...rec,
            entries: rec.entries.filter((e) => e.id !== id),
          },
        },
      };
    });
  };

  const toggleDayOff = () => {
    dataStore.update((d) => {
      const rec = d.days[activeIso] ?? { entries: [] };
      const off = !isDayOffDate(activeIso);
      const next: DayRecord = { ...rec, off };
      // Paid only makes sense on a day off; default to unpaid, drop it
      // entirely when the day is back on.
      if (off) next.paid = rec.paid ?? false;
      else delete next.paid;
      return {
        ...d,
        days: {
          ...d.days,
          [activeIso]: next,
        },
      };
    });
  };

  const togglePaid = () => {
    dataStore.update((d) => {
      const rec = d.days[activeIso] ?? { entries: [] };
      return {
        ...d,
        days: {
          ...d.days,
          [activeIso]: { ...rec, paid: !isDayPaid(activeIso) },
        },
      };
    });
  };

  const clearDay = async () => {
    const ok = await askConfirm(
      "Clear Day",
      `Clear all entries for ${activeDay}?`,
      "Clear"
    );
    if (!ok) return;
    dataStore.update((d) => {
      const rec = d.days[activeIso];
      if (!rec) return d;
      return {
        ...d,
        days: { ...d.days, [activeIso]: { ...rec, entries: [] } },
      };
    });
  };

  // ---------- Week navigation ----------

  const goToWeek = (iso: string) => dataStore.update((d) => ({ ...d, weekStart: iso }));
  const prevWeek = () => goToWeek(addDays(data.weekStart, -7));
  const nextWeek = () => goToWeek(addDays(data.weekStart, 7));
  const thisWeek = () => {
    goToWeek(isoDate(wednesdayOf(new Date())));
    toast("Jumped to current week");
  };

  // ---------- Settings ----------

  const saveSettings = (s: Settings) => {
    dataStore.update((d) => ({ ...d, settings: s }));
    toast("Settings updated");
  };

  const saveName = (name: string) => {
    if (!isValidOwnerName(name)) {
      toast("Name must be letters only, up to 10 characters");
      return;
    }
    dataStore.update((d) => ({ ...d, ownerName: name }));
    toast("Name saved");
  };

  // ---------- Rate book actions ----------

  const addCategory = async () => {
    const name = await askPrompt("New Section");
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast("A section with that name already exists");
      return;
    }
    ratesStore.update((cs) => [...cs, { name: trimmed, codes: {} }]);
    toast("Section added");
  };

  const renameCategory = async (oldName: string) => {
    const name = await askPrompt("Rename Section", oldName);
    if (!name || !name.trim() || name.trim() === oldName) return;
    const trimmed = name.trim();
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast("A section with that name already exists");
      return;
    }
    ratesStore.update((cs) =>
      cs.map((c) => (c.name === oldName ? { ...c, name: trimmed } : c))
    );
  };

  const deleteCategory = async (name: string) => {
    const cat = categories.find((c) => c.name === name);
    const codeCount = cat ? Object.keys(cat.codes).length : 0;
    const msg =
      codeCount > 0
        ? `Delete "${name}"? Its ${codeCount} cornice code(s) will be moved to "Uncategorized".`
        : `Delete empty section "${name}"?`;
    const ok = await askConfirm("Delete Section", msg, "Delete");
    if (!ok) return;
    ratesStore.update((cs) => {
      const target = cs.find((c) => c.name === name);
      if (!target) return cs;
      let next = cs.filter((c) => c.name !== name);
      if (codeCount > 0) {
        let uncat = next.find((c) => c.name === "Uncategorized");
        if (!uncat) {
          uncat = { name: "Uncategorized", codes: {} };
          next = [...next, uncat];
        }
        uncat.codes = { ...uncat.codes, ...target.codes };
      }
      return next;
    });
    toast("Section deleted");
  };

  const saveCode = async (
    code: string | null,
    targetCat: string,
    rates: number[]
  ) => {
    const newCode = normalizeCode(code ?? "");
    if (!newCode) {
      toast("Enter a code");
      return;
    }
    if (rates.length === 0) {
      toast("Enter at least one valid rate");
      return;
    }
    if (!targetCat) {
      toast("Choose a section");
      return;
    }

    const existingOwner = categoryOfCode(categories, newCode);
    if (existingOwner && !(code && newCode === code)) {
      const ok = await askConfirm(
        "Code Already Exists",
        `"${newCode}" already exists in "${existingOwner}". Overwrite it there and move to "${targetCat}"?`,
        "Overwrite & Move"
      );
      if (!ok) return;
    } else {
      const ok = await askConfirm(
        "Save Cornice",
        `Save "${newCode}" in "${targetCat}" with rate(s) ${rates
          .map((r) => r + "u")
          .join(", ")}?`,
        "Save"
      );
      if (!ok) return;
    }

    const origCat = codeModal?.category ?? null;
    ratesStore.update((cs) => {
      let next = cs.map((c) => {
        if (code && origCat && c.name === origCat) {
          const codes = { ...c.codes };
          delete codes[code];
          return { ...c, codes };
        }
        if (
          existingOwner &&
          c.name === existingOwner &&
          existingOwner !== targetCat
        ) {
          const codes = { ...c.codes };
          delete codes[newCode];
          return { ...c, codes };
        }
        return c;
      });
      next = next.map((c) =>
        c.name === targetCat
          ? { ...c, codes: { ...c.codes, [newCode]: rates } }
          : c
      );
      return next;
    });
    setCodeModal(null);
    toast(code ? "Cornice updated" : "Cornice added");
  };

  const deleteCode = async (code: string, catName: string) => {
    const ok = await askConfirm(
      "Delete Cornice",
      `Delete "${code}" from the rate book?`,
      "Delete"
    );
    if (!ok) return;
    ratesStore.update((cs) =>
      cs.map((c) => {
        if (c.name !== catName) return c;
        const codes = { ...c.codes };
        delete codes[code];
        return { ...c, codes };
      })
    );
    setCodeModal(null);
    toast("Cornice deleted");
  };

  // ---------- Backup export / import ----------

  // Valid owner name is prefixed to export filenames ("John_..."); empty/invalid
  // names are omitted (no leading underscore).
  const namePrefix =
    data.ownerName && isValidOwnerName(data.ownerName)
      ? `${data.ownerName}_`
      : "";

  const exportData = async () => {
    const db = buildDbObject(data);
    const blob = new Blob([JSON.stringify(db, null, 2)], {
      type: "application/json",
    });
    const name = `${namePrefix}cornice_ledger.json`;
    const used = await saveBlob(blob, name, {
      mime: "application/json",
      description: "JSON backup",
      extensions: [".json"],
    });
    if (used) toast(`Saved ${used}`, 2600);
  };

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const db = JSON.parse(text) as DbFile;
      if (!db || typeof db !== "object") {
        toast("Not a valid cornice_ledger.json file");
        return;
      }
      const ok = await askConfirm(
        "Load Data",
        "This replaces everything currently shown (all weeks and settings) with the contents of this file. Continue?",
        "Load"
      );
      if (!ok) return;
      dataStore.update((d) => applyDbObject(d, db));
      toast("Loaded cornice_ledger.json");
    } catch {
      toast("Could not read that file — is it valid JSON?");
    }
  };

  const exportWeek = async () => {
    const blob = await renderWeekAsJPEGBlob(data, isDayOffDate);
    if (!blob) {
      toast("Could not render the weekly summary");
      return;
    }
    const name = `${namePrefix}cornice_units_${fileStamp()}.jpg`;
    const used = await saveBlob(blob, name, {
      mime: "image/jpeg",
      description: "JPEG image",
      extensions: [".jpg"],
    });
    if (used) toast(`Saved ${used}`, 2600);
  };

  if (mode === null) return <StartupScreen />;

  const isAdmin = mode === "admin";

  // Overlays shared by both the admin panel and the ledger view (code editor,
  // confirm/prompt dialogs, toasts). The file picker only exists in the ledger
  // view — the admin has no import/export.
  const sharedOverlays = (
    <>
      {codeModal && (
        <CodeModal
          code={codeModal.code}
          category={codeModal.category}
          categories={categories}
          onSave={saveCode}
          onDelete={deleteCode}
          onCancel={() => setCodeModal(null)}
        />
      )}
      <Dialogs request={dialog} onDone={closeDialog} />
      <Toast message={toastMsg} />
      {!isAdmin && (
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImportFile(file);
            e.target.value = "";
          }}
        />
      )}
    </>
  );

  if (isAdmin) {
    return (
      <>
        <AdminApp
          categories={categories}
          settings={data.settings}
          onAddCategory={addCategory}
          onRenameCategory={renameCategory}
          onDeleteCategory={deleteCategory}
          onOpenCodeModal={(code, category) => setCodeModal({ code, category })}
          onSaveSettings={saveSettings}
          onLogout={() => modeStore.update(() => null)}
        />
        {sharedOverlays}
      </>
    );
  }

  const summary = computeWeekSummary(data, isDayOffDate);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col pb-[env(safe-area-inset-bottom)] lg:max-w-5xl">
      <TopBar
        weekLabel={weekLabel}
        onPrev={prevWeek}
        onNext={nextWeek}
        onRateBook={() => setRateBookOpen(true)}
        onSettings={() => setSettingsOpen(true)}
      />

      <div className="grid flex-1 grid-cols-1 gap-x-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-4">
          <DayChips
            weekStart={data.weekStart}
            activeDay={activeDay}
            onSelect={setActiveDayOverride}
            isOff={isDayOffDate}
            hasEntries={(iso) => (data.days[iso]?.entries.length ?? 0) > 0}
          />
          <EntryForm
            dayName={activeDay}
            entryCount={activeEntries.length}
            isOff={activeDayOff}
            isPaid={activeDayPaid}
            rateIndex={rateIndex}
            rateKeys={Object.keys(rateIndex)}
            onToggleOff={toggleDayOff}
            onTogglePaid={togglePaid}
            onAdd={addEntry}
          />
          <DayLedger
            dayName={activeDay}
            entries={activeEntries}
            isOff={activeDayOff}
            onRemove={removeEntry}
          />
        </div>
        <div className="flex flex-col gap-4 border-t border-line pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <WeekTable
            weekStart={data.weekStart}
            activeDay={activeDay}
            days={data.days}
            isOff={isDayOffDate}
          />
          <Summary settings={data.settings} summary={summary} />
        </div>
      </div>

      <footer className="px-4 pt-4 pb-6">
        <div className="flex gap-2">
          <button
            className="flex-1 cursor-pointer rounded-lg border border-line py-2.5 font-display text-xs uppercase tracking-[0.05em] text-muted"
            onClick={thisWeek}
          >
            This Week
          </button>
          <button
            className="flex-1 cursor-pointer rounded-lg border border-red/30 py-2.5 font-display text-xs uppercase tracking-[0.05em] text-red"
            onClick={clearDay}
          >
            Clear Day
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            className="flex-1 cursor-pointer rounded-lg border border-amber-dim py-2.5 font-display text-xs uppercase tracking-[0.05em] text-amber"
            onClick={exportData}
          >
            💾 Save Data
          </button>
          <button
            className="flex-1 cursor-pointer rounded-lg border border-line py-2.5 font-display text-xs uppercase tracking-[0.05em] text-muted"
            onClick={() => fileInputRef.current?.click()}
          >
            📂 Load Data
          </button>
        </div>
        <div className="mt-3">
          <button
            className="w-full cursor-pointer rounded-lg bg-amber py-2.5 font-display text-sm font-semibold uppercase tracking-[0.04em] text-[#1a1a1a]"
            onClick={exportWeek}
          >
            📤 Export Weekly Summary (JPEG)
          </button>
        </div>
      </footer>

      {rateBookOpen && (
        <RateBook
          categories={categories}
          readOnly
          onClose={() => setRateBookOpen(false)}
          onAddCategory={addCategory}
          onRenameCategory={renameCategory}
          onDeleteCategory={deleteCategory}
          onOpenCodeModal={(code, category) =>
            setCodeModal({ code, category })
          }
        />
      )}
      {settingsOpen && (
        <SettingsModal
          settings={data.settings}
          ownerName={data.ownerName ?? ""}
          readOnly
          onSave={saveSettings}
          onSaveName={saveName}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {sharedOverlays}
    </div>
  );
}
