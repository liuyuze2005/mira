"use client";

import type { SceneCard as ScnCard } from "@/lib/types";
import type { TranslationDict } from "@/lib/i18n";

export default function SceneCard({
  card,
  t,
}: {
  card: ScnCard;
  t: TranslationDict;
}) {
  const typeLabel = card.type === "spatial-layout" ? t.spatialLayout : t.atmosphere;
  const typeIcon = card.type === "spatial-layout" ? "🗺" : "🌄";

  return (
    <div className="bg-surface rounded-xl border border-secondary/10 overflow-hidden hover:border-tertiary/30 transition-colors">
      <div className="aspect-video bg-elevated relative">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-muted text-xs">{t.noImage}</p>
          </div>
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-neutral/70 backdrop-blur text-secondary text-[10px] rounded-full">
          {typeIcon} {typeLabel}
        </span>
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
