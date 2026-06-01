"use client";

import type { ChapterSection } from "@/lib/types";
import type { TranslationDict } from "@/lib/i18n";

interface Props {
  t: TranslationDict;
  chapters: ChapterSection[];
  currentChapter: number;
  onSelectChapter: (index: number) => void;
  extractedChapters: Set<number>;
  extractingChapter: number | null;
}

const kindLabel: Record<string, string> = {
  "front-matter": "frontMatter",
  "body": "bodyChapters",
  "back-matter": "backMatter",
  "unknown": "bodyChapters",
};

export default function ChapterList({ t, chapters, currentChapter, onSelectChapter, extractedChapters, extractingChapter }: Props) {
  if (chapters.length === 0) return null;

  const bodyChapters = chapters.filter(c => c.kind === "body");

  return (
    <div className="bg-surface rounded-xl border border-secondary/10 overflow-hidden">
      <div className="p-3 border-b border-secondary/10">
        <h3 className="font-[family-name:var(--font-serif)] text-primary font-semibold text-sm">
          📑 {t.chapterList}
        </h3>
        <p className="text-muted text-[10px] mt-0.5">
          {bodyChapters.length} {t.bodyChapters}
          {chapters.filter(c => c.kind === "front-matter").length > 0 &&
            ` · ${chapters.filter(c => c.kind === "front-matter").length} ${t.frontMatter}`}
          {chapters.filter(c => c.kind === "back-matter").length > 0 &&
            ` · ${chapters.filter(c => c.kind === "back-matter").length} ${t.backMatter}`}
        </p>
      </div>

      <div className="max-h-[50vh] overflow-y-auto">
        {chapters.map((ch) => {
          const label = kindLabel[ch.kind] || "bodyChapters";
          const color = ch.kind === "body" ? "bg-tertiary/10 text-tertiary" : "bg-slate-500/10 text-slate-400";
          const isActive = currentChapter === ch.index;
          const isExtracted = extractedChapters.has(ch.index);
          const isExtracting = extractingChapter === ch.index;

          return (
            <button
              key={ch.index}
              onClick={() => onSelectChapter(ch.index)}
              className={`w-full text-left px-3 py-2.5 flex items-center gap-2 transition-colors border-b border-secondary/5 last:border-b-0
                ${isActive ? "bg-tertiary/10 border-l-2 border-l-tertiary" : "hover:bg-elevated border-l-2 border-l-transparent"}
                ${ch.kind !== "body" ? "opacity-60" : ""}`}
            >
              <span className="text-muted text-[10px] w-6 flex-shrink-0">
                {ch.kind === "body" ? `Ch.${ch.index}` : ch.index}
              </span>
              <span className="text-primary text-xs flex-1 truncate">{ch.title}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${color}`}>
                {(t as unknown as Record<string, string>)[label] || label}
              </span>
              {isExtracting && <span className="animate-spin text-xs">⏳</span>}
              {isExtracted && !isExtracting && <span className="text-success text-xs">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
