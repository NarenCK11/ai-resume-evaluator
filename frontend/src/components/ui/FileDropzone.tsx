import clsx from "clsx";
import { useRef, useState, type DragEvent } from "react";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"];

export function FileDropzone({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onChange(dropped);
  };

  if (file) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-ink-200 bg-ink-50 px-4 py-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <div className="truncate">
            <p className="truncate text-sm font-medium text-ink-800">{file.name}</p>
            <p className="text-xs text-ink-400">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-ink-500 hover:bg-ink-100 hover:text-danger-600"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={clsx(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
        isDragging ? "border-brand-400 bg-brand-50" : "border-ink-200 hover:border-brand-300 hover:bg-ink-50",
      )}
    >
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
      </div>
      <p className="text-sm font-medium text-ink-700">
        <span className="text-brand-600">Click to upload</span> or drag and drop
      </p>
      <p className="mt-1 text-xs text-ink-400">PDF, DOCX, or TXT (max 10MB)</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
