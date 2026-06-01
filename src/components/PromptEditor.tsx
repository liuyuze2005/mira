"use client";

import { useState } from "react";
import type { BookProfile } from "@/lib/types";
import type { TranslationDict } from "@/lib/i18n";

const STORAGE_KEY = "mira-style-profile";

const defaultProfile: BookProfile["style"] = {
  visualStyle: "illustrated",
  period: "",
  colorPalette: "",
  avoid: [],
};

function loadStyle(): BookProfile["style"] {
  if (typeof window === "undefined") return defaultProfile;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

function saveStyle(style: BookProfile["style"]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(style));
}

interface Props {
  t: TranslationDict;
  onApply: (style: BookProfile["style"]) => void;
}

export default function PromptEditor({ t, onApply }: Props) {
  const [style, setStyle] = useState<BookProfile["style"]>(loadStyle);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveStyle(style);
    onApply(style);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setStyle(defaultProfile);
    saveStyle(defaultProfile);
    onApply(defaultProfile);
  };

  return (
    <details className="bg-surface rounded-xl border border-secondary/10">
      <summary className="p-4 cursor-pointer hover:text-tertiary transition-colors">
        <span className="font-[family-name:var(--font-serif)] text-primary font-semibold">🎨 {t.promptEditor}</span>
      </summary>
      <div className="px-4 pb-4 space-y-3">
        {/* Visual Style */}
        <div>
          <label className="block text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">{t.visualStyle}</label>
          <select
            value={style.visualStyle}
            onChange={e => setStyle({ ...style, visualStyle: e.target.value as BookProfile["style"]["visualStyle"] })}
            className="w-full bg-elevated text-primary rounded-lg px-3 py-2 text-sm border border-secondary/10 focus:border-tertiary focus:outline-none"
          >
            <option value="illustrated">{t.illustrated}</option>
            <option value="realistic">{t.realistic}</option>
            <option value="line-art">{t.lineArt}</option>
            <option value="pixel">{t.pixel}</option>
          </select>
        </div>

        {/* Period */}
        <div>
          <label className="block text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">{t.period}</label>
          <input
            value={style.period}
            onChange={e => setStyle({ ...style, period: e.target.value })}
            placeholder="e.g. 18th century / 清末 / Modern day"
            className="w-full bg-elevated text-primary rounded-lg px-3 py-2 text-sm placeholder:text-muted/50 border border-secondary/10 focus:border-tertiary focus:outline-none"
          />
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">{t.colorPalette}</label>
          <input
            value={style.colorPalette}
            onChange={e => setStyle({ ...style, colorPalette: e.target.value })}
            placeholder="e.g. warm earth tones, gold and crimson / muted pastels"
            className="w-full bg-elevated text-primary rounded-lg px-3 py-2 text-sm placeholder:text-muted/50 border border-secondary/10 focus:border-tertiary focus:outline-none"
          />
        </div>

        {/* Avoid */}
        <div>
          <label className="block text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">{t.avoidPrompt}</label>
          <input
            value={style.avoid.join(", ")}
            onChange={e => setStyle({ ...style, avoid: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            placeholder="e.g. anime, cartoon, realistic humans"
            className="w-full bg-elevated text-primary rounded-lg px-3 py-2 text-sm placeholder:text-muted/50 border border-secondary/10 focus:border-tertiary focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-tertiary text-neutral rounded-lg font-semibold text-sm hover:bg-[#E5C06A] transition-colors"
          >
            {saved ? t.styleSaved : t.saveStyle}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-elevated text-muted hover:text-secondary rounded-lg text-sm border border-secondary/10 transition-colors"
          >
            {t.resetStyle}
          </button>
        </div>
      </div>
    </details>
  );
}
