<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project conventions

Cornice Ledger — a single-page production + weekly-pay tracker for cornice work, rebuilt from the standalone `cornice_ledger.html` reference (kept in the repo root as the spec).

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (page prerenders statically)
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`; includes strict `react-hooks` rules — no `setState` in effects, no mutable state reassignment during render)
- `npx tsc --noEmit` — typecheck (strict mode)

## Architecture

- Everything is client-side: no API routes, no server actions, no env vars. `app/page.tsx` renders `components/ledger/LedgerApp.tsx` (a `"use client"` orchestrator); UI is split into `components/ledger/*` components, logic into `lib/*` modules.
- Persistence is localStorage through `lib/store.ts` — a small `useSyncExternalStore` wrapper (`dataStore`, `ratesStore`). Never store ledger state in React `useState`; call `dataStore.update(fn)` / `ratesStore.update(fn)`. The store handles SSR (server snapshots), auto-persist, and cross-tab sync (`storage` event).
- `lib/storage.ts` owns the storage keys and all read/write + payload sanitization. `lib/db.ts` is only for the JSON backup file format (export/import).
- `useHydrated()` (in `lib/store.ts`) gates browser-only values (e.g. "today's" weekday) so server and client markup never mismatch.
- **Startup screen & modes**: before the app shows, `components/ledger/StartupScreen.tsx` asks how to start — Load JSON (green), New user (yellow), Admin (red). The choice is a `Mode` (`"loaded" | "new" | "admin"`) kept in **sessionStorage** (`cornice.ledger.mode.session`, via `modeStore`/`useMode()` in `lib/store.ts`), so the screen re-appears in every new browser session. `mode === null` → startup screen.
- **Owner name**: picking "New user" requires a first name (letters only, max 10, no spaces — `isValidOwnerName` in `lib/naming.ts`); the prompt is pre-filled with any existing name. Admin login defaults the name to `"Admin"` when none is set. Load JSON pulls the name from the file. It's editable by loaded/new users in a dedicated Settings section (not shown to the admin, who never sees the ledger). The name prompt and the admin password prompt are mutually exclusive — opening one collapses the other.
- **Access control & admin panel**: `mode === "admin"` renders a dedicated `components/ledger/AdminApp.tsx` (the "Admin Panel") that shows **only** the editable Pay Settings and the editable Rate Book, plus a "Log out" button (sets mode → null, back to the startup screen). The admin does **not** see the ledger, owner name, or import/export. Loaded/new users get the full ledger and may *view* the rate book (the `RateBook` overlay, `readOnly`) but not edit it; only the admin edits the rate book/pay settings. The shared rate-book list lives in `components/ledger/RateBookList.tsx` (used by both the view-only overlay and the admin panel). Admin auth is a client-side SHA-256 check in `lib/auth.ts` (deterrent only — the hash ships in the bundle; there is no server).

## Domain rules

- Pay week runs Wednesday → Tuesday (`DAYS` in `lib/types.ts`, week start = the Wednesday; `lib/dates.ts` has the math).
- Saturday/Sunday are day-offs by default; per-day override lives on the day record (`off?: boolean`).
- A day-off can be marked **paid** (`paid?: boolean`, only meaningful when `off`): it adds a full day (`hoursPerDay × hourly`) to base pay but adds **no** unit target/extras. The "Paid" checkbox is only visible (with a slide-in animation) while "Day Off" is checked; unchecking day-off clears `paid`.
- An entry records `code`, `qty`, and `rate` (units per length) at entry time; units = qty × rate. Pay math is in `lib/calc.ts` (`computeWeekSummary`). Day counts: **working days** = days that are not day-offs; **paid day-offs** = day-offs marked paid; **unpaid weekday day-offs** = non-weekend day-offs that are *not* paid. Base pay = (working days + paid day-offs) × `hoursPerDay` × `hourly`; unit target = working days × `unitsPerDay`; extra units beyond the target paid at `extraRate`. Unpaid weekday day-offs count toward **neither** base pay nor the target.
- **Estimate display** — the on-screen `Summary` card and the "PAY CALCULATION" box in the `lib/report.ts` JPG share identical wording via `workingDaysLabel()` / `unitTargetBreakdown()` in `lib/calc.ts`. The "Working days" line reads "{n} full days + {m} paid day off + {k} unpaid day off" (each part shown only when > 0, pluralized). The base-pay line shows "(payDays days × hours × $rate)" where payDays = working + paid. The unit-target line shows the breakdown "{workingDays} × {hoursPerDay} × {unitsPerDay/hoursPerDay}" (e.g. "4 × 8 × 4.5"). There is **no** separate "Paid day-offs" line (it is already inside base pay).
- Settings defaults: `hourly 28.5, hoursPerDay 8, unitsPerDay 36, extraRate 3.8`.

## Data & storage

- localStorage keys: `cornice.ledger.data.v1` (`LedgerData`), `cornice.ledger.rates.v1` (`Category[]`). Bump the `.v1` suffix for breaking shape changes — loaders fall back to fresh/defaults on anything malformed.
- `lib/rates.ts` `DEFAULT_CATEGORIES` is the seed rate book (11 categories); it is only used as a fallback when nothing is stored.
- JSON backup format (v4, `cornice_ledger.json`) is defined in `lib/db.ts` (`buildDbObject` / `applyDbObject`); day objects may carry `_off` and `_paid`, and the file may carry a top-level `ownerName`. v2/v3 files (no `_paid` / no `ownerName`) still load.
- **Exports** (both live in the main footer, not in Settings): JSON backup downloads as `[Name_]cornice_ledger_YYYY-MM-DD_HH-MM-SSAMPM.json` (plain anchor download, a new file each time). The weekly JPEG summary is `[Name_]cornice_units_YYYY-MM-DD_HH-MM-SSAMPM.jpg`, rendered by `lib/report.ts` (`renderWeekAsJPEGBlob`) and saved through `lib/files.ts` `saveBlob` — the File System Access API save picker (user chooses the location; Chromium) with a plain-download fallback elsewhere. The optional `Name_` prefix is the owner name (omitted when unset). Filenames use `fileStamp()` from `lib/dates.ts` — local date + 12-hour time, all parts 2 digits except the 4-digit year (e.g. `John_2026-09-26_03-43-32PM`).

## Styling

- Tailwind CSS v4 (`@import "tailwindcss"` + `@theme inline` in `app/globals.css`). Design tokens (colors `bg/panel/panel-2/line/amber/amber-dim/bone/muted/green/red`, fonts `display/mono/sans`) are defined there — use the token classes, not raw hex values.
- Fonts come from `next/font/google` in `app/layout.tsx` (Oswald, JetBrains Mono, Inter).

## Deploy

- Vercel: plain `next build` output, no build args or env vars needed.
