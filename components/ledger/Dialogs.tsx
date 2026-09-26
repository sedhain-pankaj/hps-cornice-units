"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";

// Promise-based confirm/prompt dialogs (native confirm()/prompt() are
// unreliable in some embedded web views).
export type DialogRequest =
  | {
      kind: "confirm";
      title: string;
      message: string;
      confirmLabel?: string;
      resolve: (v: boolean) => void;
    }
  | {
      kind: "prompt";
      title: string;
      initialValue?: string;
      resolve: (v: string | null) => void;
    };

export default function Dialogs({
  request,
  onDone,
}: {
  request: DialogRequest | null;
  onDone: (result: boolean | string | null) => void;
}) {
  if (!request) return null;

  if (request.kind === "confirm") {
    return (
      <Modal label={request.title} onClose={() => onDone(false)}>
        <h2 className="mb-3.5 font-display text-[15px] uppercase tracking-[0.06em] text-bone">
          {request.title}
        </h2>
        <p className="mb-4 text-[13.5px] leading-relaxed text-muted">
          {request.message}
        </p>
        <button
          className="w-full rounded-lg bg-amber py-3 font-display text-sm font-semibold uppercase tracking-[0.05em] text-[#1a1a1a]"
          onClick={() => onDone(true)}
        >
          {request.confirmLabel ?? "Confirm"}
        </button>
        <button
          className="mt-2 w-full rounded-lg border border-line py-2.5 font-display text-xs uppercase tracking-[0.05em] text-muted"
          onClick={() => onDone(false)}
        >
          Cancel
        </button>
      </Modal>
    );
  }

  return <PromptDialog request={request} onDone={onDone} />;
}

function PromptDialog({
  request,
  onDone,
}: {
  request: Extract<DialogRequest, { kind: "prompt" }>;
  onDone: (result: boolean | string | null) => void;
}) {
  const [value, setValue] = useState(request.initialValue ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => onDone(value);

  return (
    <Modal label={request.title} onClose={() => onDone(null)}>
      <h2 className="mb-3.5 font-display text-[15px] uppercase tracking-[0.06em] text-bone">
        {request.title}
      </h2>
      <input
        ref={inputRef}
        type="text"
        value={value}
        autoComplete="off"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        className="mb-3 w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 font-mono text-base text-bone outline-none focus:border-amber"
      />
      <button
        className="w-full rounded-lg bg-amber py-3 font-display text-sm font-semibold uppercase tracking-[0.05em] text-[#1a1a1a]"
        onClick={submit}
      >
        Save
      </button>
      <button
        className="mt-2 w-full rounded-lg border border-line py-2.5 font-display text-xs uppercase tracking-[0.05em] text-muted"
        onClick={() => onDone(null)}
      >
        Cancel
      </button>
    </Modal>
  );
}
