"use client";

import { useRef, useState } from "react";
import type { Mode } from "@/lib/types";
import { modeStore, dataStore } from "@/lib/store";
import { verifyAdminPassword } from "@/lib/auth";
import { isoDate, wednesdayOf } from "@/lib/dates";
import { applyDbObject, type DbFile } from "@/lib/db";
import { isValidOwnerName } from "@/lib/naming";
import Dialogs, { type DialogRequest } from "./Dialogs";

export default function StartupScreen() {
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [nameOpen, setNameOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const enter = (m: Mode) => modeStore.update(() => m);

  const askConfirm = (title: string, message: string, label: string) =>
    new Promise<boolean>((resolve) => {
      setDialog({ kind: "confirm", title, message, confirmLabel: label, resolve });
    });

  const hasData = () =>
    Object.values(dataStore.getSnapshot().days).some(
      (r) => r.entries.length > 0
    );

  const onNewUser = () => {
    // Ask for the first name (required). Pre-fill any name already on the
    // device so a repeat "new user" can just confirm it. Only one prompt is
    // open at a time — collapse the admin password field if it's showing.
    setPwOpen(false);
    setName(dataStore.getSnapshot().ownerName ?? "");
    setNameError(null);
    setNameOpen(true);
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  const submitName = () => {
    if (!isValidOwnerName(name)) {
      setNameError("Letters only, up to 10 characters.");
      return;
    }
    dataStore.update((d) => ({
      weekStart: isoDate(wednesdayOf(new Date())),
      days: {},
      settings: d.settings,
      ownerName: name,
    }));
    enter("new");
  };

  const onAdmin = async () => {
    if (!pwOpen) {
      // Only one prompt is open at a time — collapse the name field if it's
      // showing.
      setNameOpen(false);
      setPwOpen(true);
      setPwError(null);
      setTimeout(() => pwRef.current?.focus(), 50);
      return;
    }
    setBusy(true);
    const ok = await verifyAdminPassword(pw);
    setBusy(false);
    if (ok) {
      // Default the name to "Admin" when none is set, so exports always have a
      // sensible filename prefix. An existing name is kept (admin can change it).
      dataStore.update((d) =>
        d.ownerName ? d : { ...d, ownerName: "Admin" }
      );
      enter("admin");
    } else {
      setPwError("Wrong password — access restricted.");
      setPw("");
    }
  };

  const onFile = async (file: File) => {
    setFileError(null);
    let db: DbFile;
    try {
      db = JSON.parse(await file.text()) as DbFile;
    } catch {
      setFileError("Could not read that file — is it valid JSON?");
      return;
    }
    if (!db || typeof db !== "object" || (!db.days && !db.settings)) {
      setFileError("Not a valid cornice_ledger.json file.");
      return;
    }
    if (hasData()) {
      const ok = await askConfirm(
        "Load File?",
        "This replaces the data currently on this device.",
        "Load"
      );
      if (!ok) return;
    }
    dataStore.update((d) => applyDbObject(d, db));
    enter("loaded");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-[360px]">
        <h1 className="text-center font-display text-[32px] uppercase tracking-[0.06em] text-bone">
          Cornice <span className="text-amber">Ledger</span>
        </h1>
        <p className="mt-1.5 mb-8 text-center font-mono text-[11px] text-muted">
          Choose how to start
        </p>

        <button
          className="mb-3 w-full cursor-pointer rounded-xl border border-green/40 bg-green/10 px-4 py-3.5 text-left"
          onClick={() => fileRef.current?.click()}
        >
          <span className="block font-display text-[15px] uppercase tracking-[0.05em] text-green">
            📂 Load JSON
          </span>
          <span className="mt-0.5 block text-[11.5px] text-muted">
            Continue from a saved cornice_ledger.json
          </span>
        </button>

        <button
          className="mb-3 w-full cursor-pointer rounded-xl border border-amber/40 bg-amber/10 px-4 py-3.5 text-left"
          onClick={onNewUser}
        >
          <span className="block font-display text-[15px] uppercase tracking-[0.05em] text-amber">
            ✨ I am a new user
          </span>
          <span className="mt-0.5 block text-[11.5px] text-muted">
            Start a fresh ledger
          </span>
        </button>

        <button
          className={`w-full cursor-pointer rounded-xl border px-4 py-3.5 text-left ${
            pwOpen
              ? "border-red bg-red/15"
              : "border-red/40 bg-red/10"
          }`}
          onClick={onAdmin}
        >
          <span className="block font-display text-[15px] uppercase tracking-[0.05em] text-red">
            🔒 I am an admin
          </span>
          <span className="mt-0.5 block text-[11.5px] text-muted">
            (Unauthorised Access Restricted)
          </span>
        </button>

        {pwOpen && (
          <div className="paid-in mt-3 rounded-xl border border-red/40 bg-panel p-3">
            <label
              htmlFor="admin-pw"
              className="mb-1 block text-[10px] uppercase tracking-[0.08em] text-muted"
            >
              Admin Password
            </label>
            <input
              id="admin-pw"
              ref={pwRef}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pw}
              disabled={busy}
              onChange={(e) => {
                setPw(e.target.value);
                setPwError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !busy) onAdmin();
              }}
              placeholder="••••"
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 font-mono text-base tracking-[0.3em] text-bone outline-none focus:border-red disabled:opacity-50"
            />
            {pwError && (
              <p className="mt-2 text-[12px] font-medium text-red">
                {pwError}
              </p>
            )}
            <button
              className="mt-2.5 w-full cursor-pointer rounded-lg bg-red py-2.5 font-display text-sm font-semibold uppercase tracking-[0.05em] text-[#1a1a1a] disabled:opacity-50"
              onClick={onAdmin}
              disabled={busy}
            >
              {busy ? "Checking…" : "Unlock"}
            </button>
          </div>
        )}

        {nameOpen && (
          <div className="paid-in mt-3 rounded-xl border border-amber/40 bg-panel p-3">
            <label
              htmlFor="owner-name"
              className="mb-1 block text-[10px] uppercase tracking-[0.08em] text-muted"
            >
              Your First Name
            </label>
            <input
              id="owner-name"
              ref={nameRef}
              type="text"
              value={name}
              maxLength={10}
              autoComplete="off"
              autoCapitalize="words"
              onChange={(e) => {
                // Letters only — strip anything else (spaces, digits, symbols).
                setName(e.target.value.replace(/[^A-Za-z]/g, ""));
                setNameError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitName();
              }}
              placeholder="e.g. John"
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 font-mono text-base text-bone outline-none focus:border-amber"
            />
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              Save your data upon completion for future use and use the LOAD
              JSON option next time.
            </p>
            {nameError && (
              <p className="mt-2 text-[12px] font-medium text-red">{nameError}</p>
            )}
            <button
              className="mt-2.5 w-full cursor-pointer rounded-lg bg-amber py-2.5 font-display text-sm font-semibold uppercase tracking-[0.05em] text-[#1a1a1a]"
              onClick={submitName}
            >
              Start
            </button>
          </div>
        )}

        {fileError && (
          <p className="paid-in mt-3 rounded-lg border border-red/40 bg-red/10 px-3 py-2.5 text-[12px] font-medium text-red">
            {fileError}
          </p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
        <Dialogs
          request={dialog}
          onDone={(result) => {
            if (dialog?.kind === "confirm") dialog.resolve(result === true);
            setDialog(null);
          }}
        />
      </div>
    </div>
  );
}
