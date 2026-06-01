"use client";

import { useState, useRef, DragEvent } from "react";
import type { TranslationDict } from "@/lib/i18n";

interface ParseResult {
  text: string;
  fullLength: number;
  truncated: boolean;
  fileName: string;
  format: string;
}

export default function BookUpload({
  t,
  onParsed,
}: {
  t: TranslationDict;
  onParsed: (result: ParseResult) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      onParsed(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setParsing(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="bg-surface rounded-xl border border-secondary/10 p-4">
      <h3 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-primary mb-1">{t.uploadBook}</h3>
      <p className="text-muted text-sm mb-4">{t.uploadDesc}</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? "border-tertiary bg-tertiary/5" : "border-secondary/20 hover:border-secondary/40"
        }`}
      >
        <input ref={inputRef} type="file" accept=".epub,.txt,.pdf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {parsing ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-tertiary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted text-sm">{t.parsing}</p>
          </div>
        ) : (
          <p className="text-muted text-sm">{t.dragDrop}</p>
        )}
      </div>

      {error && <p className="text-danger text-sm mt-3">{t.error}: {error}</p>}
    </div>
  );
}
