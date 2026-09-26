export default function Toast({ message }: { message: string | null }) {
  return (
    <div
      aria-live="polite"
      className={`fixed bottom-5 left-1/2 z-[60] w-max max-w-[88vw] -translate-x-1/2 rounded-xl border border-line bg-panel-2 px-4 py-2 text-center text-[12.5px] leading-snug whitespace-normal text-bone transition-opacity duration-300 ${
        message ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {message ?? ""}
    </div>
  );
}
