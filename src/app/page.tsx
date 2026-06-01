"use client";

import { useEffect, useState, useCallback } from "react";
import type { Book, VisualAsset, AssetType, ImageStyle } from "@/lib/types";
import { getBooks, saveBook, deleteBook, createBook, createAsset, generateId } from "@/lib/store";
import { Lang, getSystemLang, translations, TranslationDict } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BookUpload from "@/components/BookUpload";

interface ParseResult { text: string; fullLength: number; truncated: boolean; fileName: string; format: string; }

export default function Home() {
  const [lang, setLang] = useState<Lang>("zh");
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState<AssetType | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [parsedText, setParsedText] = useState<ParseResult | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<{ characters: { name: string; description: string; traits: string }[]; scenes: { name: string; description: string }[]; moments: { name: string; passage: string }[] } | null>(null);

  const handleExtract = async () => {
    if (!parsedText) return;
    setExtracting(true);
    try {
      const res = await fetch("/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: parsedText.text }) });
      const data = await res.json();
      setExtracted(data);
    } catch {} finally { setExtracting(false); }
  };

  const handleBatchGenerate = async () => {
    if (!extracted || !selectedBook) return;
    const newAssets = [
      ...extracted.characters.map(c => createAsset("character", c.name, c.description + (c.traits ? ` Traits: ${c.traits}` : ""))),
      ...extracted.scenes.map(s => createAsset("scene-map", s.name, s.description)),
      ...extracted.moments.map(m => createAsset("key-moment", m.name, m.passage)),
    ];
    const updatedBook = { ...selectedBook, assets: [...selectedBook.assets, ...newAssets] };
    await saveBook(updatedBook);
    setSelectedBook(updatedBook);
    setExtracted(null);

    // Generate images one by one
    for (const asset of newAssets) {
      setGenerating(asset.id);
      try {
        const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: asset.type, label: asset.label, description: asset.description }) });
        const data = await res.json();
        if (data.imageUrl) {
          const current = await (await import("@/lib/store")).getBook(selectedBook.id);
          if (current) {
            const withImage = { ...current, assets: current.assets.map(a => a.id === asset.id ? { ...a, imageUrl: data.imageUrl } : a) };
            await saveBook(withImage);
            setSelectedBook(withImage);
          }
        }
      } finally { setGenerating(null); }
    }
  };

  const t = translations[lang];

  useEffect(() => { setLang(getSystemLang()); }, []);
  useEffect(() => { getBooks().then(setBooks).finally(() => setLoading(false)); }, []);

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

  const handleAddAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBook || !showAddAsset) return;
    const form = e.currentTarget;
    const label = (form.elements.namedItem("label") as HTMLInputElement).value.trim();
    const description = (form.elements.namedItem("description") as HTMLTextAreaElement).value.trim();
    const style = (form.elements.namedItem("style") as HTMLSelectElement).value as ImageStyle;
    if (!label || !description) return;

    const asset = createAsset(showAddAsset, label, description, style);
    const updatedBook = { ...selectedBook, assets: [...selectedBook.assets, asset] };
    await saveBook(updatedBook);
    setSelectedBook(updatedBook);
    setShowAddAsset(null);

    setGenerating(asset.id);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: asset.type, label, description, style }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        const withImage = { ...updatedBook, assets: updatedBook.assets.map(a => a.id === asset.id ? { ...a, imageUrl: data.imageUrl } : a) };
        await saveBook(withImage);
        setSelectedBook(withImage);
      }
    } finally {
      setGenerating(null);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!selectedBook) return;
    const updated = { ...selectedBook, assets: selectedBook.assets.filter(a => a.id !== assetId) };
    await saveBook(updated);
    setSelectedBook(updated);
  };

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
                    {book.assets.length} {t.assets}{book.assets.some(a => a.imageUrl) ? ` · ${book.assets.filter(a => a.imageUrl).length} ${t.images}` : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </main>

        {showAddBook && (
          <Modal onClose={() => setShowAddBook(false)} title={t.addBook}>
            <form onSubmit={handleAddBook} className="space-y-4">
              <Input label={t.bookTitle} name="title" placeholder="e.g. 红楼梦" required autoFocus />
              <Input label={t.author} name="author" placeholder="e.g. 曹雪芹" />
              <SubmitButton>{t.addToLibrary}</SubmitButton>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  // ── Book Detail View ──
  const assetsByType = (type: AssetType) => selectedBook.assets.filter(a => a.type === type);

  return (
    <div className="min-h-screen bg-neutral">
      <header className="sticky top-0 z-10 bg-neutral border-b border-secondary/10 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => setSelectedBook(null)} className="text-secondary hover:text-primary transition-colors p-1">←</button>
          <div className="flex-1 min-w-0">
            <h1 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-primary truncate">{selectedBook.title}</h1>
            <p className="text-secondary text-sm truncate">{selectedBook.author}</p>
          </div>
          <LanguageSwitcher current={lang} onChange={setLang} />
          <button onClick={() => handleDeleteBook(selectedBook.id)} className="text-muted hover:text-danger text-sm transition-colors p-1">🗑</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Book Upload */}
        <BookUpload t={t} onParsed={setParsedText} />
        {parsedText && !extracted && (
          <div className="bg-surface rounded-xl border border-secondary/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-success font-medium">{t.parseDone}: {parsedText.fileName} ({parsedText.fullLength.toLocaleString()} chars{parsedText.truncated ? ", truncated" : ""})</p>
              <button onClick={() => setParsedText(null)} className="text-muted hover:text-secondary text-sm">{t.close}</button>
            </div>
            <p className="text-muted text-sm mb-3">{lang === "zh" ? "让 AI 从文本中自动识别人物、场景和关键情节" : "Let AI extract characters, scenes, and key moments"}</p>
            <button onClick={handleExtract} disabled={extracting}
              className="px-4 py-2 bg-tertiary text-neutral rounded-xl font-semibold text-sm hover:bg-[#E5C06A] transition-colors disabled:opacity-50">
              {extracting ? t.extracting : t.extractBtn}
            </button>
          </div>
        )}

        {extracted && (
          <div className="bg-surface rounded-xl border border-secondary/10 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-primary">{t.extractionResults}</h3>
              <button onClick={() => setExtracted(null)} className="text-muted hover:text-secondary text-sm">{t.close}</button>
            </div>
            {extracted.characters.length > 0 && (
              <div>
                <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-2">{t.characters} ({extracted.characters.length})</p>
                <div className="space-y-2">
                  {extracted.characters.map((c, i) => (
                    <div key={i} className="bg-elevated rounded-lg p-3 text-sm">
                      <p className="text-primary font-medium">{c.name}</p>
                      <p className="text-muted">{c.description}</p>
                      {c.traits && <p className="text-secondary text-xs mt-1">{c.traits}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {extracted.scenes.length > 0 && (
              <div>
                <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-2">{t.scenes} ({extracted.scenes.length})</p>
                <div className="space-y-2">
                  {extracted.scenes.map((s, i) => (
                    <div key={i} className="bg-elevated rounded-lg p-3 text-sm">
                      <p className="text-primary font-medium">{s.name}</p>
                      <p className="text-muted">{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {extracted.moments.length > 0 && (
              <div>
                <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-2">{t.moments} ({extracted.moments.length})</p>
                <div className="space-y-2">
                  {extracted.moments.map((m, i) => (
                    <div key={i} className="bg-elevated rounded-lg p-3 text-sm">
                      <p className="text-primary font-medium">{m.name}</p>
                      <p className="text-muted italic">"{m.passage.slice(0, 150)}{m.passage.length > 150 ? "…" : ""}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handleBatchGenerate}
              className="w-full py-3 bg-tertiary text-neutral rounded-xl font-semibold text-sm hover:bg-[#E5C06A] transition-colors">
              {t.generateAll} ({extracted.characters.length + extracted.scenes.length + extracted.moments.length} {t.assets})
            </button>
          </div>
        )}

        <AssetSection title={t.characterGallery} desc={t.characterDesc} type="character"
          assets={assetsByType("character")} generating={generating} onAdd={() => setShowAddAsset("character")} onDelete={handleDeleteAsset} t={t} />
        <AssetSection title={t.sceneMaps} desc={t.sceneMapsDesc} type="scene-map"
          assets={assetsByType("scene-map")} generating={generating} onAdd={() => setShowAddAsset("scene-map")} onDelete={handleDeleteAsset} t={t} />
        <AssetSection title={t.keyMoments} desc={t.keyMomentsDesc} type="key-moment"
          assets={assetsByType("key-moment")} generating={generating} onAdd={() => setShowAddAsset("key-moment")} onDelete={handleDeleteAsset} t={t} />
      </main>

      {showAddAsset && (
        <Modal onClose={() => setShowAddAsset(null)} title={assetTypeLabels[showAddAsset][lang]}>
          <form onSubmit={handleAddAsset} className="space-y-4">
            <Input label={t.name_} name="label" placeholder={getPlaceholders(lang)[showAddAsset].label} required autoFocus />
            <div>
              <label className="block text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">{t.description}</label>
              <textarea name="description" rows={4} required placeholder={getPlaceholders(lang)[showAddAsset].description}
                className="w-full bg-elevated text-primary rounded-xl px-4 py-3 text-sm resize-none placeholder:text-muted/50 border border-secondary/10 focus:border-tertiary focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">{t.style}</label>
              <select name="style" defaultValue="illustrated"
                className="w-full bg-elevated text-primary rounded-xl px-4 py-3 text-sm border border-secondary/10 focus:border-tertiary focus:outline-none transition-colors">
                <option value="illustrated">{t.illustrated}</option>
                <option value="realistic">{t.realistic}</option>
                <option value="line-art">{t.lineArt}</option>
                <option value="pixel">{t.pixel}</option>
              </select>
            </div>
            <SubmitButton>{t.saveGenerate}</SubmitButton>
          </form>
        </Modal>
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

function AssetSection({ title, desc, type, assets, generating, onAdd, onDelete, t }: {
  title: string; desc: string; type: AssetType; assets: VisualAsset[]; generating: string | null;
  onAdd: () => void; onDelete: (id: string) => void; t: TranslationDict;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-primary">{title}</h2>
          <p className="text-muted text-xs">{desc}</p>
        </div>
        <button onClick={onAdd} className="px-3 py-1.5 bg-elevated text-secondary hover:text-primary rounded-lg text-sm transition-colors border border-secondary/10">+ Add</button>
      </div>
      {assets.length === 0 ? (
        <p className="text-muted text-sm italic py-4 text-center bg-surface rounded-xl border border-secondary/10">{t.noAssets}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {assets.map(asset => (
            <AssetCard key={asset.id} asset={asset} isGenerating={generating === asset.id} onDelete={() => onDelete(asset.id)} t={t} />
          ))}
        </div>
      )}
    </section>
  );
}

function AssetCard({ asset, isGenerating, onDelete, t }: {
  asset: VisualAsset; isGenerating: boolean; onDelete: () => void;
  t: TranslationDict;
}) {
  return (
    <div className="bg-surface rounded-xl overflow-hidden border border-secondary/10 group">
      <div className="aspect-square bg-elevated flex items-center justify-center relative">
        {isGenerating ? (
          <div className="animate-amber-pulse w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-tertiary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted text-xs">{t.generating}</p>
            </div>
          </div>
        ) : asset.imageUrl ? (
          <>
            <img src={asset.imageUrl} alt={asset.label} className="w-full h-full object-cover" />
            <button onClick={onDelete}
              className="absolute top-1 right-1 p-1 bg-neutral/80 text-muted hover:text-danger rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-xs">×</button>
          </>
        ) : (
          <p className="text-muted text-xs text-center p-4">{t.noImage}</p>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-primary text-xs font-medium truncate">{asset.label}</p>
        <p className="text-muted text-[10px] truncate">{asset.style}</p>
      </div>
    </div>
  );
}

const assetTypeLabels: Record<AssetType, Record<Lang, string>> = {
  character: { zh: "添加人物", en: "Add Character" },
  "scene-map": { zh: "添加场景", en: "Add Scene Map" },
  "key-moment": { zh: "添加情节", en: "Add Key Moment" },
};

function getPlaceholders(lang: Lang): Record<AssetType, { label: string; description: string }> {
  return {
    character: {
      label: "e.g. 林黛玉 / Sherlock Holmes",
      description: lang === "zh"
        ? "粘贴书中的人物描写。例如：「两弯似蹙非蹙笼烟眉，一双似喜非喜含情目…」"
        : "Paste the character description from the book."
    },
    "scene-map": {
      label: "e.g. 大观园全景 / Hogwarts Great Hall",
      description: lang === "zh"
        ? "粘贴场景空间描写。例如：「贾府分为宁国府和荣国府，大观园位于两府之间…」"
        : "Paste the spatial description from the book."
    },
    "key-moment": {
      label: "e.g. 黛玉葬花 / The Final Battle",
      description: lang === "zh"
        ? "粘贴情节段落。例如：「黛玉肩上担着花锄，锄上挂着花囊…」"
        : "Paste the plot paragraph from the book."
    },
  };
}
