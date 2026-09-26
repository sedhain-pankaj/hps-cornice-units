import { useEffect, useRef, type ReactNode } from "react";

// Bottom sheet on mobile, centered dialog on desktop. Closes on backdrop
// click and Escape.
export default function Modal({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="w-full max-w-[480px] rounded-t-2xl border border-line bg-panel p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-2xl sm:pb-4"
      >
        {children}
      </div>
    </div>
  );
}
