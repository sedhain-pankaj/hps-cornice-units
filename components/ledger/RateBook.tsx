"use client";

import type { Category } from "@/lib/types";
import RateBookList from "./RateBookList";

export default function RateBook({
  categories,
  readOnly,
  onClose,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onOpenCodeModal,
}: {
  categories: Category[];
  readOnly?: boolean;
  onClose: () => void;
  onAddCategory: () => void;
  onRenameCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  onOpenCodeModal: (code: string | null, category: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-bg">
      <div className="flex h-full w-full max-w-[480px] flex-col sm:max-w-2xl sm:my-6 sm:h-auto sm:rounded-2xl sm:border sm:border-line">
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <button
            className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-line text-xl text-bone"
            onClick={onClose}
            aria-label="Back to ledger"
          >
            ‹
          </button>
          <h2 className="font-display text-base uppercase tracking-[0.06em] text-bone">
            Rate Book
          </h2>
          {readOnly ? (
            <span className="rounded-md border border-line px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.05em] text-muted">
              View only
            </span>
          ) : (
            <button
              className="rounded-lg border border-amber-dim px-2.5 py-2 font-display text-[11px] uppercase tracking-[0.05em] text-amber"
              onClick={onAddCategory}
            >
              + Section
            </button>
          )}
        </div>
        <div className="flex flex-1 flex-col overflow-hidden px-4 pt-3">
          <RateBookList
            categories={categories}
            readOnly={readOnly}
            onRenameCategory={onRenameCategory}
            onDeleteCategory={onDeleteCategory}
            onOpenCodeModal={onOpenCodeModal}
            listClassName="flex-1 overflow-y-auto py-2 pb-10"
          />
        </div>
      </div>
    </div>
  );
}
