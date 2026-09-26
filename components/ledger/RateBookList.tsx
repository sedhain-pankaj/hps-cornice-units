"use client";

import { useState } from "react";
import type { Category } from "@/lib/types";
import { normalizeCode } from "@/lib/rates";

// The searchable rate-book list (search box + category accordion). Shared by
// the full-screen RateBook overlay (non-admin, view-only) and the inline
// Rate Book section of the admin panel (editable). The parent supplies the
// surrounding padding and, for the overlay, the scroll behaviour via
// `listClassName`.
export default function RateBookList({
  categories,
  readOnly,
  onRenameCategory,
  onDeleteCategory,
  onOpenCodeModal,
  listClassName = "",
}: {
  categories: Category[];
  readOnly?: boolean;
  onRenameCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  onOpenCodeModal: (code: string | null, category: string) => void;
  listClassName?: string;
}) {
  const [search, setSearch] = useState("");
  const [openCats, setOpenCats] = useState<Set<string>>(
    () => new Set(["700 Series", "900 Series"])
  );

  const normSearch = normalizeCode(search);

  const toggleCat = (name: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <>
      <input
        type="text"
        value={search}
        autoComplete="off"
        placeholder="Search code…"
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 font-mono text-base text-bone outline-none focus:border-amber"
      />
      <div className={listClassName}>
        {categories.map((cat) => {
          const codeEntries = Object.entries(cat.codes)
            .filter(([code]) => !normSearch || code.includes(normSearch))
            .sort((a, b) => a[0].localeCompare(b[0]));
          if (normSearch && codeEntries.length === 0) return null;
          const open = normSearch ? true : openCats.has(cat.name);

          return (
            <div
              key={cat.name}
              className="mb-2.5 overflow-hidden rounded-xl border border-line bg-panel"
            >
              <div className="flex items-center justify-between px-3 py-3">
                <button
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => toggleCat(cat.name)}
                  aria-expanded={open}
                >
                  <span
                    className={`text-xs text-muted transition-transform ${open ? "rotate-90" : ""}`}
                    aria-hidden
                  >
                    ▸
                  </span>
                  <span className="truncate font-display text-[13px] uppercase tracking-[0.04em] text-bone">
                    {cat.name}
                  </span>
                  <span className="font-mono text-[11px] text-muted">
                    ({Object.keys(cat.codes).length})
                  </span>
                </button>
                {!readOnly && (
                  <div className="flex gap-1.5">
                    <button
                      className="cursor-pointer px-1.5 py-1 text-sm text-muted hover:text-bone"
                      onClick={() => onRenameCategory(cat.name)}
                      title={`Rename ${cat.name}`}
                      aria-label={`Rename ${cat.name}`}
                    >
                      ✎
                    </button>
                    <button
                      className="cursor-pointer px-1.5 py-1 text-sm text-muted hover:text-red"
                      onClick={() => onDeleteCategory(cat.name)}
                      title={`Delete ${cat.name}`}
                      aria-label={`Delete ${cat.name}`}
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
              {open && (
                <div className="border-t border-line">
                  {codeEntries.length === 0 ? (
                    <p className="px-3 py-4 text-center text-[12.5px] text-muted">
                      No cornices in this section yet.
                    </p>
                  ) : (
                    <ul>
                      {codeEntries.map(([code, rates]) => (
                        <li
                          key={code}
                          className="flex items-center justify-between border-b border-white/5 px-3 py-2 font-mono text-[13px]"
                        >
                          <span className="min-w-[72px] text-bone">{code}</span>
                          <span className="flex-1 pl-2 text-left text-xs text-amber">
                            {rates.map((r) => r + "u").join(" / ")}
                          </span>
                          {!readOnly && (
                            <button
                              className="cursor-pointer px-1.5 py-1 text-sm text-muted hover:text-bone"
                              onClick={() => onOpenCodeModal(code, cat.name)}
                              title={`Edit ${code}`}
                              aria-label={`Edit ${code}`}
                            >
                              ✎
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!readOnly && (
                    <div className="p-2.5">
                      <button
                        className="w-full cursor-pointer rounded-lg border border-dashed border-amber-dim py-2 font-display text-xs uppercase tracking-[0.04em] text-amber"
                        onClick={() => onOpenCodeModal(null, cat.name)}
                      >
                        + Add Cornice to {cat.name}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
