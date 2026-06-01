"use client";

import type { TranslationDict } from "@/lib/i18n";

interface QueueItem {
  id: string;
  label: string;
  status: "queued" | "generating" | "done" | "failed";
}

interface Props {
  t: TranslationDict;
  items: QueueItem[];
  onGenerateAll: () => void;
  onRetry: (id: string) => void;
  onClear: () => void;
  isGenerating: boolean;
}

export default function GenerateQueue({ t, items, onGenerateAll, onRetry, onClear, isGenerating }: Props) {
  if (items.length === 0) return null;

  const done = items.filter(i => i.status === "done").length;
  const failed = items.filter(i => i.status === "failed").length;
  const total = items.length;

  return (
    <div className="bg-surface rounded-xl border border-secondary/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-serif)] text-primary font-semibold text-sm">
          🖼 {t.generateQueue} ({done}/{total})
        </h3>
        <div className="flex gap-1">
          {failed > 0 && (
            <button onClick={() => items.filter(i => i.status === "failed").forEach(i => onRetry(i.id))} className="text-amber-400 text-xs hover:text-amber-300">
              {t.retry} ({failed})
            </button>
          )}
          {!isGenerating && done === total && (
            <button onClick={onClear} className="text-muted text-xs hover:text-secondary">{t.close}</button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-tertiary rounded-full transition-all duration-500"
          style={{ width: `${(done / Math.max(total, 1)) * 100}%` }}
        />
      </div>

      {/* Item list */}
      <div className="max-h-48 overflow-y-auto space-y-1">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 text-xs">
            <span className="w-4 text-center">
              {item.status === "generating" && <span className="animate-spin inline-block">⏳</span>}
              {item.status === "done" && "✅"}
              {item.status === "failed" && "❌"}
              {item.status === "queued" && "⏸"}
            </span>
            <span className="text-primary flex-1 truncate">{item.label}</span>
            <span className="text-muted">
              {item.status === "generating" ? t.generating : item.status === "failed" ? t.generateFailed : item.status === "done" ? t.generateDone : t.queued}
            </span>
          </div>
        ))}
      </div>

      {/* Action button */}
      {!isGenerating && done < total && (
        <button
          onClick={onGenerateAll}
          className="w-full py-2.5 bg-tertiary text-neutral rounded-xl font-semibold text-sm hover:bg-[#E5C06A] transition-colors"
        >
          {t.generateAll} ({total - done} {t.assets})
        </button>
      )}
    </div>
  );
}
