# Graph Report - hps-cornice-units  (2026-09-26)

## Corpus Check
- Corpus is ~6,761 words - fits in a single context window. You may not need a graph.

## Summary
- 128 nodes · 162 edges · 16 communities (10 shown, 6 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Package Manifest & Lint
- TypeScript Compiler Options
- Ledger Rendering & Pay Week
- Ledger Persistence & App Core
- Rate Book & Categories
- Next.js App Shell
- Dev Dependencies
- Project Docs & Bootstrap
- Entry & Code Lookup
- npm Scripts
- PostCSS Config
- Next.js Logo Asset
- Vercel Logo Asset
- File Icon Asset
- Globe Icon Asset
- Window Icon Asset

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `render()` - 11 edges
3. `buildWeekReport()` - 8 edges
4. `Unsaved-changes tracking (markDirty/markClean)` - 7 edges
5. `toast()` - 7 edges
6. `state (in-memory database)` - 6 edges
7. `loadDBFile()` - 6 edges
8. `cornice_ledger.json (persistence file)` - 6 edges
9. `scripts` - 5 edges
10. `Cornice Ledger (standalone HTML app)` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Agent Rules Block` --references--> `Next.js Project (create-next-app)`  [INFERRED]
  AGENTS.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **cornice_ledger.json persistence layer** — cornice_ledger_builddbobject, cornice_ledger_applydbobject, cornice_ledger_savedb, cornice_ledger_loaddbfile, cornice_ledger_tryautoload, cornice_ledger_json [INFERRED 0.95]
- **Estimated pay calculation flow** — cornice_ledger_rendersummary, cornice_ledger_buildweekreport, cornice_ledger_workingdayscount, cornice_ledger_unitsfor, cornice_ledger_paycalculation, cornice_ledger_settings [INFERRED 0.85]
- **Rate book (categories, codes, rates)** — cornice_ledger_default_categories, cornice_ledger_categories, cornice_ledger_rates, cornice_ledger_rebuildflatrates, cornice_ledger_lookuprates, cornice_ledger_rendercategorylist [INFERRED 0.90]

## Communities (16 total, 6 thin omitted)

### Community 0 - "Package Manifest & Lint"
Cohesion: 0.11
Nodes (18): eslintConfig, dependencies, next, react, react-dom, name, private, version (+10 more)

### Community 1 - "TypeScript Compiler Options"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 2 - "Ledger Rendering & Pay Week"
Cohesion: 0.21
Nodes (15): buildWeekReport(), DAYS (Wed-Tue pay week), isDayOffDate(), Pay calculation (base + extra over unit target), removeEntry(), render(), renderDayChips(), renderDayLedger() (+7 more)

### Community 3 - "Ledger Persistence & App Core"
Cohesion: 0.24
Nodes (14): Cornice Ledger (standalone HTML app), applyDbObject(), buildDbObject(), exportWeekAsJPEG(), File-only persistence (no browser DB), cornice_ledger.json (persistence file), loadDBFile(), saveDB() (+6 more)

### Community 4 - "Rate Book & Categories"
Cohesion: 0.21
Nodes (11): categories (live rate book), DEFAULT_CATEGORIES (default rate table), deleteCategory(), init(), loadRateTable(), openCodeModal(), RATES / RATE_KEYS (flat lookup cache), rebuildFlatRates() (+3 more)

### Community 5 - "Next.js App Shell"
Cohesion: 0.22
Nodes (6): app_globals, geistMono, geistSans, metadata, nextConfig, next

### Community 6 - "Dev Dependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 7 - "Project Docs & Bootstrap"
Cohesion: 0.29
Nodes (6): generate-agent-files.js, next dev (agent-file generator), Next.js Agent Rules Block, next/font (Geist), Next.js Project (create-next-app), Vercel Platform

### Community 8 - "Entry & Code Lookup"
Cohesion: 0.40
Nodes (3): addEntry(), lookupRates(), normalizeCode()

### Community 9 - "npm Scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

## Knowledge Gaps
- **59 isolated node(s):** `geistSans`, `geistMono`, `metadata`, `eslintConfig`, `nextConfig` (+54 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 69 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Next.js App Shell` to `Package Manifest & Lint`, `Project Docs & Bootstrap`?**
  _High betweenness centrality (0.335) - this node is a cross-community bridge._
- **Why does `Cornice Ledger (standalone HTML app)` connect `Ledger Persistence & App Core` to `Ledger Rendering & Pay Week`, `Rate Book & Categories`, `Project Docs & Bootstrap`?**
  _High betweenness centrality (0.313) - this node is a cross-community bridge._
- **Why does `init()` connect `Rate Book & Categories` to `Ledger Rendering & Pay Week`, `Ledger Persistence & App Core`?**
  _High betweenness centrality (0.162) - this node is a cross-community bridge._
- **What connects `geistSans`, `geistMono`, `metadata` to the rest of the system?**
  _59 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Package Manifest & Lint` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `TypeScript Compiler Options` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._