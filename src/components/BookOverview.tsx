"use client";

import type { BookConcept } from "@/lib/types";
import type { TranslationDict } from "@/lib/i18n";

interface Props {
  t: TranslationDict;
  concept: BookConcept;
  onClose?: () => void;
}

export default function BookOverview({ t, concept, onClose }: Props) {
  return (
    <div className="bg-surface rounded-xl border border-secondary/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-serif)] text-primary font-semibold text-sm">
          📖 {t.overviewTitle}
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-muted hover:text-secondary text-xs">{t.close}</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted">{t.genre}:</span>
          <span className="text-primary ml-1">{concept.genre}</span>
        </div>
        <div>
          <span className="text-muted">{t.setting}:</span>
          <span className="text-primary ml-1">{concept.setting}</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted">{t.narrativeStyle}:</span>
          <span className="text-primary ml-1">{concept.narrativeStyle}</span>
        </div>
      </div>

      {concept.themes.length > 0 && (
        <div>
          <span className="text-muted text-xs">{t.themes}:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {concept.themes.map((theme, i) => (
              <span key={i} className="px-2 py-0.5 bg-elevated text-secondary text-[10px] rounded-full">
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {concept.coreCharacters.length > 0 && (
        <div>
          <span className="text-muted text-xs">
            {t.knownChars} ({concept.coreCharacters.length}):
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {concept.coreCharacters.map((c, i) => (
              <span key={i} className="px-2 py-0.5 bg-tertiary/10 text-tertiary text-[10px] rounded-full">
                {c.name} · {c.role}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
