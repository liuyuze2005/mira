"use client";

import type { CharacterCard as CharCard } from "@/lib/types";
import type { TranslationDict } from "@/lib/i18n";

const confidenceColors: Record<string, string> = {
  explicit: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  inferred: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  unknown: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function CharacterCard({
  card,
  t,
  isSpoilerLocked,
  isGenerating,
  onGenerate,
  onDelete,
}: {
  card: CharCard;
  t: TranslationDict;
  isSpoilerLocked?: { locked: boolean; reason: string };
  isGenerating?: boolean;
  onGenerate?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  if (isSpoilerLocked?.locked) {
    return (
      <div className="bg-surface rounded-xl border border-secondary/10 p-4 opacity-40">
        <p className="text-muted text-xs text-center">{isSpoilerLocked.reason}</p>
      </div>
    );
  }

  const a = card.appearance;
  const traits = [a.face, a.hair, a.clothing, a.age, a.body, ...(a.distinctiveFeatures || [])].filter(Boolean);
  const roleLabel = { protagonist: t.protagonist, supporting: t.supporting, minor: t.minor }[card.role];

  return (
    <div className="bg-surface rounded-xl border border-secondary/10 overflow-hidden hover:border-tertiary/30 transition-colors group">
      {/* Image */}
      <div className="aspect-[3/4] bg-elevated relative">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <p className="text-muted text-xs">{t.noImage}</p>
            {onGenerate && (
              <button
                onClick={(e) => { e.stopPropagation(); onGenerate(card.id); }}
                disabled={isGenerating}
                className="px-3 py-1.5 bg-tertiary/80 text-neutral rounded-lg text-xs hover:bg-tertiary transition-colors disabled:opacity-40"
              >
                {isGenerating ? "⏳" : "🖼"} {t.generate}
              </button>
            )}
          </div>
        )}
        {/* Role badge */}
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-neutral/70 backdrop-blur text-secondary text-[10px] rounded-full">
          {roleLabel}
        </span>
        {/* Delete */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
            className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center bg-neutral/70 text-muted hover:text-danger rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        )}
        {/* Chapter badge */}
        {card.firstMentionChapter && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-neutral/70 backdrop-blur text-secondary text-[10px] rounded-full">
            Ch.{card.firstMentionChapter}
          </span>
        )}
        {/* Regenerate overlay */}
        {card.imageUrl && onGenerate && (
          <button
            onClick={(e) => { e.stopPropagation(); onGenerate(card.id); }}
            disabled={isGenerating}
            className="absolute bottom-2 right-2 px-2 py-1 bg-neutral/80 text-secondary hover:text-primary rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40"
          >
            {isGenerating ? "⏳" : "🔄"}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className="font-[family-name:var(--font-serif)] text-primary font-semibold text-sm">
            {card.name}
          </h3>
          {card.aliases.length > 0 && (
            <p className="text-muted text-[10px]">{card.aliases.join(" · ")}</p>
          )}
        </div>

        {/* Personality */}
        {card.personality.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.personality.slice(0, 4).map((p, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-elevated text-secondary text-[10px] rounded-md">
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Appearance traits */}
        {traits.length > 0 && (
          <div className="space-y-0.5">
            {traits.map((tr, i) => (
              <p key={i} className="text-muted text-[11px] leading-tight">{tr}</p>
            ))}
          </div>
        )}

        {/* Source Quotes */}
        {card.sourceQuotes.length > 0 && (
          <details className="text-[10px]">
            <summary className="text-tertiary cursor-pointer hover:text-[#E5C06A] transition-colors">
              {t.sourceQuote} ({card.sourceQuotes.length})
            </summary>
            <div className="mt-1 space-y-1 max-h-24 overflow-y-auto">
              {card.sourceQuotes.map((sq, i) => (
                <div key={i} className={`px-2 py-1 rounded border text-[10px] ${confidenceColors[sq.confidence] || confidenceColors.unknown}`}>
                  <span className="font-semibold mr-1">
                    {sq.confidence === "explicit" ? t.explicit : sq.confidence === "inferred" ? t.inferred : t.unknown}:
                  </span>
                  &ldquo;{sq.text.slice(0, 120)}{sq.text.length > 120 ? "…" : ""}&rdquo;
                </div>
              ))}
            </div>
          </details>
        )}
    </div>
    </div>
  );
}
