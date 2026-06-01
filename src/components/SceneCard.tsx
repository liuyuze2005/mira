"use client";

import type { SceneCard as ScnCard } from "@/lib/types";
import type { TranslationDict } from "@/lib/i18n";

export default function SceneCard({
  card,
  t,
  isGenerating,
  onGenerate,
}: {
  card: ScnCard;
  t: TranslationDict;
  isGenerating?: boolean;
  onGenerate?: (id: string) => void;
}) {
  const typeLabel = card.type === "spatial-layout" ? t.spatialLayout : t.atmosphere;
  const typeIcon = card.type === "spatial-layout" ? "🗺" : "🌄";

  return (
    <div className="bg-surface rounded-xl border border-secondary/10 overflow-hidden hover:border-tertiary/30 transition-colors group">
      <div className="aspect-video bg-elevated relative">
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
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-neutral/70 backdrop-blur text-secondary text-[10px] rounded-full">
          {typeIcon} {typeLabel}
        </span>
        {/* Regenerate */}
        {card.imageUrl && onGenerate && (
          <button
            onClick={(e) => { e.stopPropagation(); onGenerate(card.id); }}
            disabled={isGenerating}
            className="absolute bottom-2 right-2 px-2 py-1 bg-neutral/80 text-secondary hover:text-primary rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isGenerating ? "⏳" : "🔄"}
          </button>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-[family-name:var(--font-serif)] text-primary font-semibold text-sm mb-1">
          {card.name}
        </h3>
        <p className="text-muted text-xs leading-relaxed line-clamp-3">{card.description}</p>

        {card.sourceQuotes.length > 0 && (
          <details className="mt-2 text-[10px]">
            <summary className="text-tertiary cursor-pointer hover:text-[#E5C06A] transition-colors">
              {t.sourceQuote} ({card.sourceQuotes.length})
            </summary>
            <div className="mt-1 space-y-1">
              {card.sourceQuotes.map((sq, i) => (
                <div key={i} className="px-2 py-1 bg-elevated rounded text-muted text-[10px]">
                  &ldquo;{sq.text.slice(0, 100)}&rdquo;
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
