"use client";

import { Lang, setLang } from "@/lib/i18n";

export default function LanguageSwitcher({ current, onChange }: { current: Lang; onChange: (l: Lang) => void }) {
  const handleSwitch = (l: Lang) => {
    setLang(l);
    onChange(l);
  };

  return (
    <div className="flex gap-1 bg-elevated rounded-lg p-0.5 border border-secondary/10">
      <button
        onClick={() => handleSwitch("zh")}
        className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
          current === "zh"
            ? "bg-tertiary text-neutral"
            : "text-muted hover:text-secondary"
        }`}
      >
        中
      </button>
      <button
        onClick={() => handleSwitch("en")}
        className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
          current === "en"
            ? "bg-tertiary text-neutral"
            : "text-muted hover:text-secondary"
        }`}
      >
        EN
      </button>
    </div>
  );
}
