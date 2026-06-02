"use client";

import { useState, useRef, DragEvent } from "react";
import type { TranslationDict } from "@/lib/i18n";
import type { ChapterSection } from "@/lib/types";

export interface TxtResult {
  chapters: ChapterSection[];
  rawText: string;
  fileName: string;
}

interface Props {
  t: TranslationDict;
  onParsed: (result: TxtResult) => void;
}

export default function BookUpload({ t, onParsed }: Props) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (ext !== "txt") {
      setError(`不支持的文件格式: .${ext}（仅支持 .txt）`);
      return;
    }
    setParsing(true);
    try {
      const text = await file.text();
      if (!text.trim()) {
        setError("文件内容为空");
        return;
      }
      const section: ChapterSection = {
        index: 1,
        title: file.name.replace(/\.txt$/i, ""),
        kind: "body",
        text,
        startOffset: 0,
        endOffset: text.length,
      };
      onParsed({ chapters: [section], rawText: text, fileName: file.name });
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

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
          ${dragging ? "border-tertiary bg-tertiary/10" : parsing ? "border-tertiary/50" : "border-secondary/20 hover:border-secondary/40"}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !parsing && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          disabled={parsing}
        />
        {parsing ? (
          <div className="space-y-2">
            <p className="text-secondary text-sm">⏳ 读取文件中…</p>
            <div className="w-full bg-secondary/10 rounded-full h-1.5">
              <div className="bg-tertiary h-1.5 rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-secondary text-sm">📤 拖拽 TXT 文件到此处，或点击选择</p>
            <p className="text-muted text-xs">支持 .txt</p>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-2 p-2 bg-danger/10 text-danger text-xs rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
