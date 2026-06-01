"use client";

import { useEffect, useState, useCallback } from "react";
import type { Book, CharacterCard, SceneCard, MomentCard, BookProfile } from "@/lib/types";
import { getBooks, saveBook, deleteBook, createBook, generateId, getBook } from "@/lib/store";
import { filterByChapter, buildCharacterPrompt, buildScenePrompt, buildMomentPrompt } from "@/lib/extractor";
import { Lang, getSystemLang, translations, TranslationDict } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BookUpload from "@/components/BookUpload";
import CharacterCardComp from "@/components/CharacterCard";
import SceneCardComp from "@/components/SceneCard";
import SpoilerGate from "@/components/SpoilerGate";
import PromptEditor from "@/components/PromptEditor";
import GenerateQueue from "@/components/GenerateQueue";
import ExportPack from "@/components/ExportPack";

// ── Types ──
interface ParseResult { text: string; fullLength: number; truncated: boolean; fileName: string; format: string; }
interface QueueItem { id: string; label: string; status: "queued" | "generating" | "done" | "failed"; }

// ── Main ──
export default function Home() {
  const [lang, setLang] = useState<Lang>("zh");
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [loading, setLoading] = useState(true);

  // Knowledge-first
  const [knowing, setKnowing] = useState(false);

  // Upload
  const [parsedText, setParsedText] = useState<ParseResult | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState("");

  // Spoiler
  const [currentChapter, setCurrentChapter] = useState(0);

  // Queue
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueRunning, setQueueRunning] = useState(false);

  // Style
  const [globalStyle, setGlobalStyle] = useState<BookProfile["style"]>();

  // Init
  useEffect(() => { setLang(getSystemLang()); }, []);
  useEffect(() => { getBooks().then(setBooks).finally(() => setLoading(false)); }, []);

  const t = translations[lang];

  // ── Knowledge-First Extraction ──
  const handleKnowledge = async () => {
    if (!selectedBook) return;
    setKnowing(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: selectedBook.title, author: selectedBook.author, language: lang }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const updated = {
        ...selectedBook,
        characters: data.characters || [],
        scenes: data.scenes || [],
        moments: data.moments || [],
        knowledgeSource: "llm" as const,
      };
      await saveBook(updated);
      setSelectedBook(updated);
    } catch (e) {
      alert(String(e));
    } finally {
      setKnowing(false);
    }
  };

  // ── Upload → Extract ──
  const handleExtract = async () => {
    if (!parsedText || !selectedBook) return;
    setExtracting(true);
    setExtractProgress("");
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: parsedText.text, pipeline: true }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.pipeline && data.totalChunks) {
        setExtractProgress(`${data.totalChunks} chunks processed`);
      }

      const updated = {
        ...selectedBook,
        characters: [...selectedBook.characters, ...(data.characters || [])],
        scenes: [...selectedBook.scenes, ...(data.scenes || [])],
        moments: [...selectedBook.moments, ...(data.moments || [])],
        knowledgeSource: "text-extraction" as const,
      };
      await saveBook(updated);
      setSelectedBook(updated);
      setParsedText(null);
    } catch (e) {
      alert(String(e));
    } finally {
      setExtracting(false);
    }
  };

  // ── Book Actions ──
  const handleAddBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
    const author = (form.elements.namedItem("author") as HTMLInputElement).value.trim();
    if (!title) return;
    const book = createBook(title, author || "Unknown Author");
    await saveBook(book);
    setBooks(await getBooks());
    setShowAddBook(false);
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    await deleteBook(id);
    setSelectedBook(null);
    setBooks(await getBooks());
  };

  // ── Generate Queue ──
  const startGenerateQueue = async () => {
    if (!selectedBook || queueRunning) return;
    setQueueRunning(true);

    const style = globalStyle || selectedBook.profile?.style;
    const profile = selectedBook.profile;

    const items: QueueItem[] = [
      ...selectedBook.characters.filter(c => !c.imageUrl).map(c => ({ id: c.id, label: c.name, status: "queued" as const })),
      ...selectedBook.scenes.filter(s => !s.imageUrl).map(s => ({ id: s.id, label: s.name, status: "queued" as const })),
      ...selectedBook.moments.filter(m => !m.imageUrl).map(m => ({ id: m.id, label: m.name, status: "queued" as const })),
    ];
    setQueue(items);

    for (const item of items) {
      setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: "generating" } : i));

      try {
        let prompt = "";
        const char = selectedBook.characters.find(c => c.id === item.id);
        const scn = selectedBook.scenes.find(s => s.id === item.id);
        const mom = selectedBook.moments.find(m => m.id === item.id);

        if (char) prompt = buildCharacterPrompt(char, style);
        else if (scn) prompt = buildScenePrompt(scn, style);
        else if (mom) prompt = buildMomentPrompt(mom, style);

        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, style: style?.visualStyle }),
        });
        const data = await res.json();

        if (data.imageUrl) {
          const current = await getBook(selectedBook.id);
          if (current) {
            const updateCard = <T extends { id: string; imageUrl?: string }>(cards: T[]): T[] =>
              cards.map(c => c.id === item.id ? { ...c, imageUrl: data.imageUrl } as T : c);
            const updated = {
              ...current,
              characters: updateCard(current.characters),
              scenes: updateCard(current.scenes),
              moments: updateCard(current.moments),
            };
            await saveBook(updated);
            setSelectedBook(updated);
          }
        }

        setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: data.imageUrl ? "done" : "failed" } : i));
      } catch {
        setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: "failed" } : i));
      }
    }
    setQueueRunning(false);
  };

  const handleRetryQueueItem = async (id: string) => {
    setQueue(prev => prev.map(i => i.id === id ? { ...i, status: "queued" } : i));
    // Re-run generate for this single item
    if (!selectedBook) return;
    const style = globalStyle || selectedBook.profile?.style;
    const char = selectedBook.characters.find(c => c.id === id);
    const scn = selectedBook.scenes.find(s => s.id === id);
    const mom = selectedBook.moments.find(m => m.id === id);

    let prompt = "";
    if (char) prompt = buildCharacterPrompt(char, style);
    else if (scn) prompt = buildScenePrompt(scn, style);
    else if (mom) prompt = buildMomentPrompt(mom, style);

    setQueue(prev => prev.map(i => i.id === id ? { ...i, status: "generating" } : i));
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: style?.visualStyle }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        const current = await getBook(selectedBook.id);
        if (current) {
          const update = <T extends { id: string; imageUrl?: string }>(cards: T[]): T[] =>
            cards.map(c => c.id === id ? { ...c, imageUrl: data.imageUrl } as T : c);
          const updated = { ...current, characters: update(current.characters), scenes: update(current.scenes), moments: update(current.moments) };
          await saveBook(updated);
          setSelectedBook(updated);
        }
      }
      setQueue(prev => prev.map(i => i.id === id ? { ...i, status: data.imageUrl ? "done" : "failed" } : i));
    } catch {
      setQueue(prev => prev.map(i => i.id === id ? { ...i, status: "failed" } : i));
    }
  };

  // ── Save profile ──
  const handleSaveProfile = async (style: BookProfile["style"]) => {
    setGlobalStyle(style);
    if (!selectedBook) return;
    const updated = {
      ...selectedBook,
      profile: {
        totalChapters: selectedBook.profile?.totalChapters || 120,
        chapterTitles: selectedBook.profile?.chapterTitles || [],
        style,
      },
    };
    await saveBook(updated);
    setSelectedBook(updated);
  };

  // ── Spoiler filtering ──
  const filtered = currentChapter > 0
    ? filterByChapter(selectedBook?.characters || [], selectedBook?.scenes || [], selectedBook?.moments || [], currentChapter)
    : { characters: selectedBook?.characters || [], scenes: selectedBook?.scenes || [], moments: selectedBook?.moments || [] };

  // ── Book Library View ──
  if (!selectedBook) {
    return (
      <div className="min-h-screen bg-neutral">
        <header className="sticky top-0 z-10 bg-neutral border-b border-secondary/10 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-primary">{t.appName}</h1>
              <p className="text-muted text-sm">{t.tagline}</p>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher current={lang} onChange={setLang} />
              <button onClick={() => setShowAddBook(true)} className="px-4 py-2.5 bg-tertiary text-neutral rounded-xl font-semibold text-sm hover:bg-[#E5C06A] transition-colors">
                {t.newBook}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          {loading ? (
            <p className="text-muted text-center py-12">{t.loading}</p>
          ) : books.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-secondary text-lg mb-2">{t.libraryEmpty}</p>
              <p className="text-muted mb-6">{t.libraryEmptyDesc}</p>
              <button onClick={() => setShowAddBook(true)} className="px-6 py-3 bg-tertiary text-neutral rounded-xl font-semibold">
                {t.addFirstBook}
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {books.map(book => (
                <button key={book.id} onClick={() => setSelectedBook(book)}
                  className="text-left bg-surface hover:bg-elevated rounded-xl p-4 border border-secondary/10 transition-colors">
                  <h3 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-primary">{book.title}</h3>
                  <p className="text-secondary text-sm">{book.author}</p>
                  <p className="text-muted text-xs mt-2">
                    {book.characters.length} {t.knownChars} · {book.scenes.length} {t.knownScenes} · {book.moments.length} {t.knownMoments}
                    {book.knowledgeSource === "llm" && <span className="ml-2 text-tertiary text-[10px]">({t.sourceLLM})</span>}
                  </p>
                </button>
              ))}
            </div>
          )}
        </main>

        {showAddBook && (
          <Modal onClose={() => setShowAddBook(false)} title={t.addBook}>
            <form onSubmit={handleAddBook} className="space-y-4">
              <Input label={t.bookTitle} name="title" placeholder="e.g. 红楼梦 / The Three-Body Problem" required autoFocus />
              <Input label={t.author} name="author" placeholder="e.g. 曹雪芹 / Liu Cixin" />
              <SubmitButton>{t.addToLibrary}</SubmitButton>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  // ── Book Detail View ──
  const hasContent = selectedBook.characters.length > 0 || selectedBook.scenes.length > 0;

  return (
    <div className="min-h-screen bg-neutral">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-neutral border-b border-secondary/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => setSelectedBook(null)} className="text-secondary hover:text-primary transition-colors p-1">{t.back}</button>
          <div className="flex-1 min-w-0">
            <h1 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-primary truncate">{selectedBook.title}</h1>
            <p className="text-secondary text-sm truncate">{selectedBook.author}</p>
          </div>
          <LanguageSwitcher current={lang} onChange={setLang} />
          <button onClick={() => handleDeleteBook(selectedBook.id)} className="text-muted hover:text-danger text-sm transition-colors p-1">🗑</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* ── Knowledge-First Panel ── */}
        {!hasContent && (
          <div className="bg-surface rounded-xl border border-secondary/10 p-6 text-center space-y-3">
            <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-primary">{t.knowledgeTitle}</h2>
            <p className="text-muted text-sm max-w-md mx-auto">{t.knowledgeDesc}</p>
            <button
              onClick={handleKnowledge}
              disabled={knowing}
              className="px-6 py-3 bg-tertiary text-neutral rounded-xl font-semibold hover:bg-[#E5C06A] transition-colors disabled:opacity-50"
            >
              {knowing ? t.knowing : t.knowBtn}
            </button>

            {/* Upload fallback */}
            <div className="mt-6 pt-6 border-t border-secondary/10">
              <BookUpload t={t} onParsed={setParsedText} />
              {parsedText && !extracting && (
                <div className="mt-3 bg-elevated rounded-lg p-3 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-success font-medium">{t.parseDone}: {parsedText.fileName}</p>
                    <button onClick={() => setParsedText(null)} className="text-muted hover:text-secondary text-xs">{t.close}</button>
                  </div>
                  <button onClick={handleExtract} disabled={extracting}
                    className="px-4 py-2 bg-tertiary text-neutral rounded-lg font-semibold text-sm hover:bg-[#E5C06A] transition-colors disabled:opacity-50">
                    {extracting ? `${t.extracting} (${extractProgress})` : t.extractBtn}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Content exists: show cards ── */}
        {hasContent && (
          <>
            {/* Spoiler Gate */}
            <SpoilerGate
              t={t}
              currentChapter={currentChapter}
              onChange={setCurrentChapter}
              characterCount={selectedBook.characters.length}
              revealedCount={filtered.characters.length}
            />

            {/* Prompt Editor */}
            <PromptEditor t={t} onApply={handleSaveProfile} />

            {/* ── Characters ── */}
            {filtered.characters.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-primary">{t.characterGallery}</h2>
                    <p className="text-muted text-xs">{t.characterDesc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filtered.characters.map(c => (
                    <CharacterCardComp key={c.id} card={c} t={t} />
                  ))}
                </div>
                {currentChapter > 0 && filtered.characters.length < selectedBook.characters.length && (
                  <p className="text-muted text-xs mt-2 text-center">
                    {selectedBook.characters.length - filtered.characters.length} {t.hidden}
                  </p>
                )}
              </section>
            )}

            {/* ── Scenes ── */}
            {filtered.scenes.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-primary">{t.sceneGallery}</h2>
                    <p className="text-muted text-xs">{t.sceneDesc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.scenes.map(s => (
                    <SceneCardComp key={s.id} card={s} t={t} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Moments ── */}
            {filtered.moments.length > 0 && (
              <section>
                <div className="mb-3">
                  <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-primary">{t.keyMoments}</h2>
                  <p className="text-muted text-xs">{t.keyMomentsDesc}</p>
                </div>
                <div className="space-y-2">
                  {filtered.moments.map(m => (
                    <div key={m.id} className="bg-surface rounded-xl border border-secondary/10 p-3">
                      <p className="text-primary font-medium text-sm">{m.name}</p>
                      <p className="text-muted text-xs italic mt-1">
                        &ldquo;{m.passage.slice(0, 200)}{m.passage.length > 200 ? "…" : ""}&rdquo;
                      </p>
                      {m.imageUrl && (
                        <img src={m.imageUrl} alt={m.name} className="mt-2 rounded-lg max-h-48 object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Generate Queue ── */}
            <GenerateQueue
              t={t}
              items={queue}
              onGenerateAll={startGenerateQueue}
              onRetry={handleRetryQueueItem}
              onClear={() => setQueue([])}
              isGenerating={queueRunning}
            />

            {/* Initial Generate All button when no queue */}
            {queue.length === 0 && (
              <button
                onClick={startGenerateQueue}
                className="w-full py-3 bg-tertiary text-neutral rounded-xl font-semibold text-sm hover:bg-[#E5C06A] transition-colors"
              >
                🎨 {t.generateAll} ({
                  selectedBook.characters.filter(c => !c.imageUrl).length +
                  selectedBook.scenes.filter(s => !s.imageUrl).length +
                  selectedBook.moments.filter(m => !m.imageUrl).length
                } {t.assets})
              </button>
            )}

            {/* ── Upload More (for text extraction augmentation) ── */}
            <details className="bg-surface rounded-xl border border-secondary/10">
              <summary className="p-4 cursor-pointer text-secondary hover:text-primary text-sm transition-colors">
                📤 {t.uploadBook}
              </summary>
              <div className="px-4 pb-4">
                <BookUpload t={t} onParsed={setParsedText} />
                {parsedText && !extracting && (
                  <div className="mt-3 bg-elevated rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-success font-medium">{t.parseDone}: {parsedText.fileName}</p>
                      <button onClick={() => setParsedText(null)} className="text-muted hover:text-secondary text-xs">{t.close}</button>
                    </div>
                    <button onClick={handleExtract} disabled={extracting}
                      className="px-4 py-2 bg-tertiary text-neutral rounded-lg font-semibold text-sm hover:bg-[#E5C06A] transition-colors disabled:opacity-50">
                      {extracting ? `${t.extracting} (${extractProgress})` : t.extractBtn}
                    </button>
                  </div>
                )}
              </div>
            </details>

            {/* ── Knowledge source indicator ── */}
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>{t.sourceNotes}:</span>
              <span className="px-2 py-0.5 bg-elevated rounded-full">
                {selectedBook.knowledgeSource === "llm" ? t.sourceLLM : t.sourceExtract}
              </span>
            </div>

            {/* ── Export ── */}
            <ExportPack t={t} book={selectedBook} />

            {/* ── Re-extract with AI knowledge ── */}
            {selectedBook.knowledgeSource === "text-extraction" && (
              <button
                onClick={handleKnowledge}
                disabled={knowing}
                className="w-full py-2.5 bg-elevated text-secondary hover:text-primary rounded-xl text-sm border border-secondary/10 transition-colors disabled:opacity-50"
              >
                {knowing ? t.knowing : "🔄 " + t.knowBtn}
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── Shared Components ──
function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto border border-secondary/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-primary">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors text-lg">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, name, placeholder, required, autoFocus }: {
  label: string; name: string; placeholder: string; required?: boolean; autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">{label}</label>
      <input name={name} required={required} autoFocus={autoFocus} placeholder={placeholder}
        className="w-full bg-elevated text-primary rounded-xl px-4 py-3 text-sm placeholder:text-muted/50 border border-secondary/10 focus:border-tertiary focus:outline-none transition-colors" />
    </div>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return <button type="submit" className="w-full py-3 bg-tertiary text-neutral rounded-xl font-semibold text-sm hover:bg-[#E5C06A] transition-colors">{children}</button>;
}
