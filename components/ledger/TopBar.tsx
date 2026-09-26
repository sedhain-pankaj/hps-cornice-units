export default function TopBar({
  weekLabel,
  onPrev,
  onNext,
  onRateBook,
  onSettings,
}: {
  weekLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onRateBook: () => void;
  onSettings: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg px-4 pb-2.5 pt-4">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-xl uppercase tracking-[0.06em] text-bone">
          Cornice <span className="text-amber">Ledger</span>
        </h1>
        <div className="flex gap-2">
          <button
            className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-line text-base text-muted hover:border-amber-dim"
            onClick={onRateBook}
            title="Rate Book"
            aria-label="Rate Book"
          >
            📖
          </button>
          <button
            className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-line text-base text-muted hover:border-amber-dim"
            onClick={onSettings}
            title="Pay Settings"
            aria-label="Pay Settings"
          >
            ⚙
          </button>
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <button
          className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg border border-line text-base text-amber active:bg-amber/10"
          onClick={onPrev}
          aria-label="Previous week"
        >
          ‹
        </button>
        <div className="flex-1 px-2 text-center font-mono text-[11px] tracking-[0.03em] text-muted">
          {weekLabel}
        </div>
        <button
          className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg border border-line text-base text-amber active:bg-amber/10"
          onClick={onNext}
          aria-label="Next week"
        >
          ›
        </button>
      </div>
    </header>
  );
}
