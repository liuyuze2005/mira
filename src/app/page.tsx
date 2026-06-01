"use client";

import { useEffect, useState } from "react";
import type { Book, CharacterCard, SceneCard, MomentCard, BookProfile, BookConcept, ChapterSection } from "@/lib/types";
import { getBooks, saveBook, deleteBook, createBook, getBook } from "@/lib/store";
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
import ChapterList from "@/components/ChapterList";
import BookOverview from "@/components/BookOverview";
import MapView from "@/components/MapView";
import ReaderView from "@/components/ReaderView";
import type { MapGraph } from "@/lib/types";

interface ParseResult { text: string; fullLength: number; truncated: boolean; fileName: string; format: string; }
interface QueueItem { id: string; label: string; status: "queued" | "generating" | "done" | "failed"; }

export default function Home() {
  const [lang, setLang] = useState<Lang>("zh");
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [loading, setLoading] = useState(true);

  // Knowledge-first
  const [knowing, setKnowing] = useState(false);

  // Upload → Parse → Chapters
  const [parsedText, setParsedText] = useState<ParseResult | null>(null);
  const [parsingChapters, setParsingChapters] = useState(false);
  const [extractedChapters, setExtractedChapters] = useState<Set<number>>(new Set());
  const [extractingChapter, setExtractingChapter] = useState<number | null>(null);

  // Overview
  const [generatingOverview, setGeneratingOverview] = useState(false);

  // Queue
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueRunning, setQueueRunning] = useState(false);
  const [generatingSingle, setGeneratingSingle] = useState<string | null>(null);

  // Style
  const [globalStyle, setGlobalStyle] = useState<BookProfile["style"]>();

  useEffect(() => { setLang(getSystemLang()); }, []);
  useEffect(() => {
    getBooks().then(bs => {
      setBooks(bs);
      bs.forEach(b => {
        if (b.chapters?.length > 0) {
          const extracted = new Set<number>();
          b.characters.forEach(c => c.chaptersAppearedIn?.forEach(ch => extracted.add(ch)));
          setExtractedChapters(prev => new Set([...prev, ...extracted]));
        }
      });
    }).finally(() => setLoading(false));
  }, []);

  const t = translations[lang];

  // ── Knowledge-First ──
  const handleKnowledge = async () => {
    if (!selectedBook) return;
    setKnowing(true);
    try {
      const res = await fetch("/api/knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: selectedBook.title, author: selectedBook.author, language: lang }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const updated = { ...selectedBook, characters: data.characters || [], scenes: data.scenes || [], moments: data.moments || [], knowledgeSource: "llm" as const };
      await saveBook(updated);
      setSelectedBook(updated);
    } catch (e) { alert(String(e)); } finally { setKnowing(false); }
  };

  // ── Overview ──
  const handleOverview = async () => {
    if (!selectedBook) return;
    setGeneratingOverview(true);
    try {
      const firstBody = selectedBook.chapters.find(c => c.kind === "body");
      const res = await fetch("/api/overview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: selectedBook.title, author: selectedBook.author, sampleText: firstBody?.text || "", language: lang }) });
      const concept: BookConcept = await res.json();
      if (!concept.genre) throw new Error("Failed to generate overview");
      const updated = { ...selectedBook, concept };
      await saveBook(updated);
      setSelectedBook(updated);
    } catch (e) { alert(String(e)); } finally { setGeneratingOverview(false); }
  };

  // ── Parse Chapters ──
  const handleParseChapters = async () => {
    if (!parsedText || !selectedBook) return;
    setParsingChapters(true);
    try {
      const res = await fetch("/api/chapters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: parsedText.text }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const chapters: ChapterSection[] = data.chapters || [];
      const updated = { ...selectedBook, chapters, rawText: parsedText.text };
      await saveBook(updated);
      setSelectedBook(updated);
    } catch (e) { alert(String(e)); } finally { setParsingChapters(false); }
  };

  // ── Extract One Chapter ──
  const handleExtractChapter = async (chapterIndex: number) => {
    if (!selectedBook || extractingChapter) return;
    const chapter = selectedBook.chapters.find(c => c.index === chapterIndex);
    if (!chapter || chapter.kind !== "body") return;

    setExtractingChapter(chapterIndex);
    try {
      const res = await fetch("/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: chapter.text, chapter: chapterIndex, existingCharacters: selectedBook.characters, pipeline: true }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const updated = {
        ...selectedBook,
        characters: data.characters || [],
        scenes: [...selectedBook.scenes.filter(s => s.chapter !== chapterIndex), ...(data.scenes || [])],
        moments: [...selectedBook.moments.filter(m => m.chapter !== chapterIndex), ...(data.moments || [])],
        knowledgeSource: "text-extraction" as const,
      };
      await saveBook(updated);
      setSelectedBook(updated);

      setExtractedChapters(prev => new Set([...prev, chapterIndex]));
    } catch (e) { alert(String(e)); } finally { setExtractingChapter(null); }
  };

  // ── Select Chapter → set reading position ──
  const handleSelectChapter = async (chapterIndex: number) => {
    if (!selectedBook) return;
    const updated = { ...selectedBook, currentChapter: chapterIndex };
    await saveBook(updated);
    setSelectedBook(updated);
  };

  // ── Generate Map ──
  const [generatingMap, setGeneratingMap] = useState(false);
  const handleGenerateMap = async () => {
    if (!selectedBook || !selectedBook.chapters?.length) return;
    setGeneratingMap(true);
    try {
      const res = await fetch("/api/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapters: selectedBook.chapters, currentChapter: selectedBook.currentChapter, existingMap: selectedBook.mapGraph }),
      });
      const mapGraph: MapGraph = await res.json();
      if (!mapGraph.nodes) throw new Error("Map generation failed");
      const updated = { ...selectedBook, mapGraph };
      await saveBook(updated);
      setSelectedBook(updated);
    } catch (e) { alert(String(e)); } finally { setGeneratingMap(false); }
  };

  // ── Delete single card ──
  const handleDeleteCharacter = async (id: string) => {
    if (!selectedBook) return;
    const updated = { ...selectedBook, characters: selectedBook.characters.filter(c => c.id !== id) };
    await saveBook(updated);
    setSelectedBook(updated);
  };
  const handleDeleteScene = async (id: string) => {
    if (!selectedBook) return;
    const updated = { ...selectedBook, scenes: selectedBook.scenes.filter(s => s.id !== id) };
    await saveBook(updated);
    setSelectedBook(updated);
  };
  const handleDeleteMoment = async (id: string) => {
    if (!selectedBook) return;
    const updated = { ...selectedBook, moments: selectedBook.moments.filter(m => m.id !== id) };
    await saveBook(updated);
    setSelectedBook(updated);
  };

  // ── Ask Mira ──
  const [recapModal, setRecapModal] = useState<{
    summary: string; recentCharacters: string[]; currentLocation: string;
    unresolvedQuestions: string[]; visualCues: string[];
  } | null>(null);

  const handleAsk = async (question: string, selection: string) => {
    const chapter = selectedBook?.chapters.find(c => c.index === selectedBook.currentChapter);
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question, selection,
        bookTitle: selectedBook?.title,
        bookAuthor: selectedBook?.author,
        chapterTitle: chapter?.title,
        currentChapter: selectedBook?.currentChapter,
        characters: selectedBook?.characters || [],
        scenes: selectedBook?.scenes || [],
        language: lang,
      }),
    });
    return res.json();
  };

  const handleRecap = async () => {
    if (!selectedBook) return;
    try {
      const readChapters = selectedBook.chapters
        .filter(c => c.kind === "body" && c.index <= (selectedBook.currentChapter || 1))
        .map(c => ({ title: c.title, text: c.text }));
      const res = await fetch("/api/recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookTitle: selectedBook.title,
          bookAuthor: selectedBook.author,
          currentChapter: selectedBook.currentChapter,
          chaptersRead: readChapters,
          characters: selectedBook.characters || [],
          scenes: selectedBook.scenes || [],
          moments: selectedBook.moments || [],
          language: lang,
        }),
      });
      const data = await res.json();
      setRecapModal(data);
    } catch (e) { alert(String(e)); }
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

  // ── Single Generate ──
  const handleGenerateSingle = async (cardId: string) => {
    if (!selectedBook || generatingSingle) return;
    setGeneratingSingle(cardId);
    try {
      const style = globalStyle || selectedBook.profile?.style;
      let prompt = "";
      const char = selectedBook.characters.find(c => c.id === cardId);
      const scn = selectedBook.scenes.find(s => s.id === cardId);
      const mom = selectedBook.moments.find(m => m.id === cardId);
      if (char) prompt = buildCharacterPrompt(char, style);
      else if (scn) prompt = buildScenePrompt(scn, style);
      else if (mom) prompt = buildMomentPrompt(mom, style);
      if (style?.customPrompt) prompt += ` ${style.customPrompt}`;
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, style: style?.visualStyle }) });
      const data = await res.json();
      if (data.imageUrl) {
        const current = await getBook(selectedBook.id);
        if (current) {
          const updateCard = <T extends { id: string; imageUrl?: string }>(cards: T[]): T[] => cards.map(c => c.id === cardId ? { ...c, imageUrl: data.imageUrl } as T : c);
          const updated = { ...current, characters: updateCard(current.characters), scenes: updateCard(current.scenes), moments: updateCard(current.moments) };
          await saveBook(updated);
          setSelectedBook(updated);
        }
      }
    } catch { } finally { setGeneratingSingle(null); }
  };

  // ── Generate Queue ──
  const startGenerateQueue = async () => {
    if (!selectedBook || queueRunning) return;
    setQueueRunning(true);
    const style = globalStyle || selectedBook.profile?.style;
    const items: QueueItem[] = [
      ...selectedBook.characters.filter(c => !c.imageUrl).map(c => ({ id: c.id, label: c.name, status: "queued" as const })),
      ...selectedBook.scenes.filter(s => !s.imageUrl).map(s => ({ id: s.id, label: s.name, status: "queued" as const })),
      ...selectedBook.moments.filter(m => !m.imageUrl).map(m => ({ id: m.id, label: m.name, status: "queued" as const })),
    ];
    setQueue(items);
    for (const item of items) {
      setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: "generating" } : i));
      try {
        let prompt = ""; const char = selectedBook.characters.find(c => c.id === item.id); const scn = selectedBook.scenes.find(s => s.id === item.id); const mom = selectedBook.moments.find(m => m.id === item.id);
        if (char) prompt = buildCharacterPrompt(char, style); else if (scn) prompt = buildScenePrompt(scn, style); else if (mom) prompt = buildMomentPrompt(mom, style);
        if (style?.customPrompt) prompt += ` ${style.customPrompt}`;
        const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, style: style?.visualStyle }) });
        const data = await res.json();
        if (data.imageUrl) { const current = await getBook(selectedBook.id); if (current) { const update = <T extends { id: string; imageUrl?: string }>(cards: T[]): T[] => cards.map(c => c.id === item.id ? { ...c, imageUrl: data.imageUrl } as T : c); const upd = { ...current, characters: update(current.characters), scenes: update(current.scenes), moments: update(current.moments) }; await saveBook(upd); setSelectedBook(upd); } }
        setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: data.imageUrl ? "done" : "failed" } : i));
      } catch { setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: "failed" } : i)); }
    }
    setQueueRunning(false);
  };

  const handleRetryQueueItem = async (id: string) => {
    if (!selectedBook) return;
    setQueue(prev => prev.map(i => i.id === id ? { ...i, status: "generating" } : i));
    try {
      const style = globalStyle || selectedBook.profile?.style; let prompt = "";
      const char = selectedBook.characters.find(c => c.id === id); const scn = selectedBook.scenes.find(s => s.id === id); const mom = selectedBook.moments.find(m => m.id === id);
      if (char) prompt = buildCharacterPrompt(char, style); else if (scn) prompt = buildScenePrompt(scn, style); else if (mom) prompt = buildMomentPrompt(mom, style);
      if (style?.customPrompt) prompt += ` ${style.customPrompt}`;
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, style: style?.visualStyle }) });
      const data = await res.json();
      if (data.imageUrl) { const current = await getBook(selectedBook.id); if (current) { const update = <T extends { id: string; imageUrl?: string }>(cards: T[]): T[] => cards.map(c => c.id === id ? { ...c, imageUrl: data.imageUrl } as T : c); const upd = { ...current, characters: update(current.characters), scenes: update(current.scenes), moments: update(current.moments) }; await saveBook(upd); setSelectedBook(upd); } }
      setQueue(prev => prev.map(i => i.id === id ? { ...i, status: data.imageUrl ? "done" : "failed" } : i));
    } catch { setQueue(prev => prev.map(i => i.id === id ? { ...i, status: "failed" } : i)); }
  };

  // ── Save profile ──
  const handleSaveProfile = async (style: BookProfile["style"]) => {
    setGlobalStyle(style);
    if (!selectedBook) return;
    const updated = { ...selectedBook, profile: { totalChapters: selectedBook.chapters?.length || selectedBook.profile?.totalChapters || 0, chapterTitles: selectedBook.chapters?.map(c => c.title) || selectedBook.profile?.chapterTitles || [], style } };
    await saveBook(updated);
    setSelectedBook(updated);
  };

  // ── Spoiler filtering ──
  const currentChapterFilter = selectedBook?.currentChapter || 0;
  const filtered = currentChapterFilter > 0
    ? filterByChapter(selectedBook?.characters || [], selectedBook?.scenes || [], selectedBook?.moments || [], currentChapterFilter)
    : { characters: selectedBook?.characters || [], scenes: selectedBook?.scenes || [], moments: selectedBook?.moments || [] };

  const hasContent = (selectedBook?.characters?.length || 0) > 0;
  const hasChapters = (selectedBook?.chapters?.length || 0) > 0;

  // ── Book Library View ──
  if (!selectedBook) {
    return (
      <div className="min-h-screen bg-neutral">
        <header className="sticky top-0 z-10 bg-neutral border-b border-secondary/10 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div><h1 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-primary">{t.appName}</h1><p className="text-muted text-sm">{t.tagline}</p></div>
            <div className="flex items-center gap-2"><LanguageSwitcher current={lang} onChange={setLang} /><button onClick={() => setShowAddBook(true)} className="px-4 py-2.5 bg-tertiary text-neutral rounded-xl font-semibold text-sm hover:bg-[#E5C06A] transition-colors">{t.newBook}</button></div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6">
          {loading ? <p className="text-muted text-center py-12">{t.loading}</p> : books.length === 0 ? (
            <div className="text-center py-16"><p className="text-secondary text-lg mb-2">{t.libraryEmpty}</p><p className="text-muted mb-6">{t.libraryEmptyDesc}</p><button onClick={() => setShowAddBook(true)} className="px-6 py-3 bg-tertiary text-neutral rounded-xl font-semibold">{t.addFirstBook}</button></div>
          ) : (
            <div className="grid gap-3">{books.map(book => (
              <button key={book.id} onClick={() => setSelectedBook(book)} className="text-left bg-surface hover:bg-elevated rounded-xl p-4 border border-secondary/10 transition-colors">
                <h3 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-primary">{book.title}</h3>
                <p className="text-secondary text-sm">{book.author}</p>
                <p className="text-muted text-xs mt-2">
                  {book.characters.length} {t.knownChars} · {book.scenes.length} {t.knownScenes} · {book.moments.length} {t.knownMoments}
                  {book.chapters?.length ? ` · ${book.chapters.filter(c => c.kind === "body").length} ${t.chapters}` : ""}
                  {book.knowledgeSource === "llm" && <span className="ml-2 text-tertiary text-[10px]">({t.sourceLLM})</span>}
                </p>
              </button>
            ))}</div>
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
  return (
    <div className="min-h-screen bg-neutral">
      <header className="sticky top-0 z-10 bg-neutral border-b border-secondary/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button onClick={() => setSelectedBook(null)} className="text-secondary hover:text-primary transition-colors p-1">{t.back}</button>
          <div className="flex-1 min-w-0"><h1 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-primary truncate">{selectedBook.title}</h1><p className="text-secondary text-sm truncate">{selectedBook.author}</p></div>
          <LanguageSwitcher current={lang} onChange={setLang} />
          <button onClick={() => handleDeleteBook(selectedBook.id)} className="text-muted hover:text-danger text-sm transition-colors p-1">🗑</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* ── Phase 1: No content yet ── */}
        {!hasContent && !hasChapters && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-surface rounded-xl border border-secondary/10 p-6 text-center space-y-3">
              <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-primary">{t.knowledgeTitle}</h2>
              <p className="text-muted text-sm max-w-md mx-auto">{t.knowledgeDesc}</p>
              <button onClick={handleKnowledge} disabled={knowing} className="px-6 py-3 bg-tertiary text-neutral rounded-xl font-semibold hover:bg-[#E5C06A] transition-colors disabled:opacity-50">{knowing ? t.knowing : t.knowBtn}</button>
              <div className="mt-6 pt-6 border-t border-secondary/10"><BookUpload t={t} onParsed={setParsedText} /></div>
            </div>

            {parsedText && (
              <div className="bg-surface rounded-xl border border-secondary/10 p-4 text-center space-y-3">
                <p className="text-sm text-success font-medium">{t.parseDone}: {parsedText.fileName}</p>
                <button onClick={handleParseChapters} disabled={parsingChapters} className="px-6 py-3 bg-tertiary text-neutral rounded-xl font-semibold hover:bg-[#E5C06A] transition-colors disabled:opacity-50">
                  {parsingChapters ? t.parsingChapters : `📑 ${t.parseChapters}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Phase 2: Chapters parsed ── */}
        {hasChapters && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside className="lg:w-72 flex-shrink-0 space-y-4">
              <ChapterList
                t={t}
                chapters={selectedBook.chapters}
                currentChapter={selectedBook.currentChapter}
                onSelectChapter={handleSelectChapter}
                extractedChapters={extractedChapters}
                extractingChapter={extractingChapter}
              />

              {/* Overview */}
              {selectedBook.concept && <BookOverview t={t} concept={selectedBook.concept} />}
              {!selectedBook.concept && (
                <button onClick={handleOverview} disabled={generatingOverview}
                  className="w-full py-2.5 bg-elevated text-secondary hover:text-primary rounded-xl text-sm border border-secondary/10 transition-colors disabled:opacity-50">
                  {generatingOverview ? t.knowing : `📖 ${t.overviewTitle}`}
                </button>
              )}

              {/* Refresh: AI Knowledge extraction */}
              {selectedBook.knowledgeSource === "text-extraction" && (
                <button onClick={handleKnowledge} disabled={knowing}
                  className="w-full py-2 bg-elevated text-muted hover:text-secondary rounded-xl text-xs border border-secondary/10 transition-colors disabled:opacity-50">
                  {knowing ? t.knowing : `🔄 ${t.knowBtn}`}
                </button>
              )}
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Current Chapter Actions */}
              {selectedBook.currentChapter > 0 && (
                <div className="bg-surface rounded-xl border border-secondary/10 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-secondary text-sm">{t.chapterProgress.replace("{current}", String(selectedBook.currentChapter)).replace("{total}", String(selectedBook.chapters.filter(c => c.kind === "body").length))}</span>
                    {selectedBook.chapters.find(c => c.index === selectedBook.currentChapter)?.title && (
                      <p className="text-primary text-sm mt-0.5">{selectedBook.chapters.find(c => c.index === selectedBook.currentChapter)!.title}</p>
                    )}
                    {extractedChapters.has(selectedBook.currentChapter) && <span className="text-success text-[10px]">✓ {t.extractChapter}</span>}
                  </div>
                  {!extractedChapters.has(selectedBook.currentChapter) && selectedBook.chapters.find(c => c.index === selectedBook.currentChapter)?.kind === "body" && (
                    <button onClick={() => handleExtractChapter(selectedBook.currentChapter)} disabled={extractingChapter !== null}
                      className="px-4 py-2 bg-tertiary text-neutral rounded-xl font-semibold text-sm hover:bg-[#E5C06A] transition-colors disabled:opacity-50">
                      {extractingChapter === selectedBook.currentChapter ? t.extractingChapter : `🤖 ${t.extractChapter}`}
                    </button>
                  )}
                </div>
              )}

              {/* Spoiler Gate */}
              {hasContent && (
                <SpoilerGate t={t} currentChapter={currentChapterFilter} onChange={(ch) => handleSelectChapter(ch)} characterCount={selectedBook.characters.length} revealedCount={filtered.characters.length} />
              )}

              {/* Prompt Editor */}
              <PromptEditor t={t} onApply={handleSaveProfile} />

              {/* ── Reader View ── */}
              {selectedBook.currentChapter > 0 && (() => {
                const chapter = selectedBook.chapters.find(c => c.index === selectedBook.currentChapter);
                if (!chapter) return null;
                return (
                  <ReaderView
                    t={t}
                    chapter={chapter}
                    bookTitle={selectedBook.title}
                    bookAuthor={selectedBook.author}
                    characters={selectedBook.characters}
                    scenes={selectedBook.scenes}
                    moments={selectedBook.moments}
                    currentChapter={selectedBook.currentChapter}
                    onAsk={handleAsk}
                    onRecap={handleRecap}
                  />
                );
              })()}

              {/* Cards */}
              {hasContent && (
                <>
                  {filtered.characters.length > 0 && (
                    <section>
                      <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-primary mb-3">{t.characterGallery}</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {filtered.characters.map(c => <CharacterCardComp key={c.id} card={c} t={t} isGenerating={generatingSingle === c.id} onGenerate={handleGenerateSingle} onDelete={handleDeleteCharacter} />)}
                      </div>
                    </section>
                  )}
                  {filtered.scenes.length > 0 && (
                    <section>
                      <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-primary mb-3">{t.sceneGallery}</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filtered.scenes.map(s => <SceneCardComp key={s.id} card={s} t={t} isGenerating={generatingSingle === s.id} onGenerate={handleGenerateSingle} onDelete={handleDeleteScene} />)}
                      </div>
                    </section>
                  )}
                  {filtered.moments.length > 0 && (
                    <section>
                      <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-primary mb-3">{t.keyMoments}</h2>
                      <div className="space-y-2">
                        {filtered.moments.map(m => (
                          <div key={m.id} className="bg-surface rounded-xl border border-secondary/10 p-3 group relative">
                            <p className="text-primary font-medium text-sm">{m.name}</p>
                            <p className="text-muted text-xs italic mt-1">&ldquo;{m.passage.slice(0, 200)}{m.passage.length > 200 ? "…" : ""}&rdquo;</p>
                            {m.imageUrl && <img src={m.imageUrl} alt={m.name} className="mt-2 rounded-lg max-h-48 object-cover" />}
                            <button onClick={() => handleDeleteMoment(m.id)} className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center bg-neutral/70 text-muted hover:text-danger rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* ── Map ── */}
                  {selectedBook.mapGraph && selectedBook.mapGraph.nodes.length > 0 && (
                    <section>
                      <MapView graph={selectedBook.mapGraph} onUpdate={(g) => { const u = { ...selectedBook, mapGraph: g }; saveBook(u); setSelectedBook(u); }} />
                    </section>
                  )}
                  {!selectedBook.mapGraph && selectedBook.chapters.length > 0 && (
                    <button onClick={handleGenerateMap} disabled={generatingMap}
                      className="w-full py-3 bg-elevated text-secondary hover:text-primary rounded-xl text-sm border border-secondary/10 transition-colors disabled:opacity-50">
                      {generatingMap ? "⏳ 正在生成地图…" : "🗺 生成场景地图"}
                    </button>
                  )}

                  {/* Generate Queue */}
                  <GenerateQueue t={t} items={queue} onGenerateAll={startGenerateQueue} onRetry={handleRetryQueueItem} onClear={() => setQueue([])} isGenerating={queueRunning} />
                  {queue.length === 0 && (
                    <button onClick={startGenerateQueue} className="w-full py-3 bg-tertiary text-neutral rounded-xl font-semibold text-sm hover:bg-[#E5C06A] transition-colors">
                      🎨 {t.generateAll} ({selectedBook.characters.filter(c => !c.imageUrl).length + selectedBook.scenes.filter(s => !s.imageUrl).length + selectedBook.moments.filter(m => !m.imageUrl).length} {t.assets})
                    </button>
                  )}

                  {/* Upload more */}
                  <details className="bg-surface rounded-xl border border-secondary/10">
                    <summary className="p-4 cursor-pointer text-secondary hover:text-primary text-sm transition-colors">📤 {t.uploadBook}</summary>
                    <div className="px-4 pb-4"><BookUpload t={t} onParsed={setParsedText} /></div>
                  </details>

                  {/* Knowledge source */}
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{t.sourceNotes}:</span>
                    <span className="px-2 py-0.5 bg-elevated rounded-full">{selectedBook.knowledgeSource === "llm" ? t.sourceLLM : t.sourceExtract}</span>
                  </div>

                  {/* Export */}
                  <ExportPack t={t} book={selectedBook} />
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Recap Modal */}
      {recapModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral/80 backdrop-blur-sm" onClick={() => setRecapModal(null)} />
          <div className="relative bg-surface rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto border border-secondary/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-primary">📺 继续阅读前回顾</h2>
              <button onClick={() => setRecapModal(null)} className="text-muted hover:text-primary text-lg">✕</button>
            </div>
            <p className="text-primary text-sm leading-relaxed">{recapModal.summary}</p>

            {recapModal.recentCharacters?.length > 0 && (
              <div>
                <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-1">上次出现的人物</p>
                <ul className="space-y-1 text-sm text-primary/80">
                  {recapModal.recentCharacters.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}

            {recapModal.currentLocation && (
              <div>
                <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-1">当前地点</p>
                <p className="text-sm text-primary/80">{recapModal.currentLocation}</p>
              </div>
            )}

            {recapModal.unresolvedQuestions?.length > 0 && (
              <div>
                <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-1">未解决的问题</p>
                <ul className="space-y-1 text-sm text-amber-400/80">
                  {recapModal.unresolvedQuestions.map((q, i) => <li key={i}>？{q}</li>)}
                </ul>
              </div>
            )}

            {recapModal.visualCues?.length > 0 && (
              <div>
                <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-1">👁 值得注意的视觉线索</p>
                <ul className="space-y-1 text-sm text-primary/80">
                  {recapModal.visualCues.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared Components ──
function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto border border-secondary/10">
        <div className="flex items-center justify-between mb-4"><h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-primary">{title}</h2><button onClick={onClose} className="text-muted hover:text-primary transition-colors text-lg">✕</button></div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, name, placeholder, required, autoFocus }: { label: string; name: string; placeholder: string; required?: boolean; autoFocus?: boolean }) {
  return <div><label className="block text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">{label}</label><input name={name} required={required} autoFocus={autoFocus} placeholder={placeholder} className="w-full bg-elevated text-primary rounded-xl px-4 py-3 text-sm placeholder:text-muted/50 border border-secondary/10 focus:border-tertiary focus:outline-none transition-colors" /></div>;
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return <button type="submit" className="w-full py-3 bg-tertiary text-neutral rounded-xl font-semibold text-sm hover:bg-[#E5C06A] transition-colors">{children}</button>;
}
