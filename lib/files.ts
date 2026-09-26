// Browser file-saving helpers. The File System Access API
// (window.showSaveFilePicker) lets the user choose where a file is saved; it's
// available in Chromium browsers (Chrome, Edge, ...). Elsewhere we fall back to
// a plain anchor download (which goes to the browser's download folder).

type SavePicker = (opts: {
  suggestedName: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}>;

function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Saves `blob` to a location the user picks (Chromium) or downloads it
 * (other browsers). Returns the filename used, or "" if the user cancelled the
 * picker.
 */
export async function saveBlob(
  blob: Blob,
  suggestedName: string,
  opts: { mime: string; description: string; extensions: string[] }
): Promise<string> {
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker })
    .showSaveFilePicker;
  if (picker) {
    try {
      const handle = await picker.call(window, {
        suggestedName,
        types: [
          { description: opts.description, accept: { [opts.mime]: opts.extensions } },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return suggestedName;
    } catch (err) {
      // The user dismissed the dialog -> don't fall back to a download.
      if ((err as { name?: string })?.name === "AbortError") return "";
      // Any other error -> fall through to a plain download.
    }
  }
  downloadBlob(blob, suggestedName);
  return suggestedName;
}
