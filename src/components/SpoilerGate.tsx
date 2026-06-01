"use client";

import type { TranslationDict } from "@/lib/i18n";

interface Props {
  t: TranslationDict;
  currentChapter: number;
  onChange: (chapter: number) => void;
  characterCount: number;
  revealedCount: number;
}

export default function SpoilerGate({ t, currentChapter, onChange, characterCount, revealedCount }: Props) {
  const hidden = characterCount - revealedCount;

  return (
    <div className="bg-surface rounded-xl border border-secondary/10 p-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-primary whitespace-nowrap">{t.spoilerGate}</span>
        <span className="text-muted text-xs whitespace-nowrap">{t.currentChapter}</span>
        <input
          type="number"
          min={0}
          max={9999}
          value={currentChapter || ""}
          onChange={e => onChange(parseInt(e.target.value) || 0)}
          placeholder="0"
          className="w-16 bg-elevated text-primary text-center rounded-lg px-2 py-1 text-sm border border-secondary/10 focus:border-tertiary focus:outline-none"
        />
        <span className="text-muted text-xs">{t.chapter}</span>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-success">{revealedCount} {t.revealed}</span>
          {hidden > 0 && <span className="text-muted">· {hidden} {t.hidden}</span>}
        </div>
      </div>
    </div>
  );
}
