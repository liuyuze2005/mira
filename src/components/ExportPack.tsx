"use client";

import type { Book } from "@/lib/types";
import type { TranslationDict } from "@/lib/i18n";
import { buildCharacterPrompt, buildScenePrompt, buildMomentPrompt } from "@/lib/extractor";

interface Props {
  t: TranslationDict;
  book: Book;
}

export default function ExportPack({ t, book }: Props) {
  const handleExport = () => {
    const style = book.profile?.style;

    const pack = {
      meta: {
        title: book.title,
        author: book.author,
        exportedAt: new Date().toISOString(),
        source: book.knowledgeSource,
        totalCharacters: book.characters.length,
        totalScenes: book.scenes.length,
        totalMoments: book.moments.length,
      },
      style: style || null,
      characters: book.characters.map(c => ({
        name: c.name,
        aliases: c.aliases,
        role: c.role,
        appearance: c.appearance,
        personality: c.personality,
        sourceQuotes: c.sourceQuotes,
        imagePrompt: buildCharacterPrompt(c, style),
        imageUrl: c.imageUrl || null,
        firstMentionChapter: c.firstMentionChapter,
      })),
      scenes: book.scenes.map(s => ({
        name: s.name,
        type: s.type,
        description: s.description,
        sourceQuotes: s.sourceQuotes,
        imagePrompt: buildScenePrompt(s, style),
        imageUrl: s.imageUrl || null,
        chapter: s.chapter,
      })),
      moments: book.moments.map(m => ({
        name: m.name,
        passage: m.passage,
        imagePrompt: buildMomentPrompt(m, style),
        imageUrl: m.imageUrl || null,
        chapter: m.chapter,
      })),
    };

    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mira-${book.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_")}-companion-pack.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasContent = book.characters.length > 0 || book.scenes.length > 0 || book.moments.length > 0;

  return (
    <div className="bg-surface rounded-xl border border-secondary/10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-serif)] text-primary font-semibold text-sm">📦 {t.exportPack}</h3>
          <p className="text-muted text-xs mt-0.5">{t.exportDesc}</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!hasContent}
          className="px-4 py-2 bg-tertiary text-neutral rounded-xl font-semibold text-sm hover:bg-[#E5C06A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t.exportBtn}
        </button>
      </div>
    </div>
  );
}
