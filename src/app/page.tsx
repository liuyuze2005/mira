"use client";

import { useEffect, useState, useCallback } from "react";
import type { Book, VisualAsset, AssetType, ImageStyle } from "@/lib/types";
import { getBooks, saveBook, deleteBook, createBook, createAsset, generateId } from "@/lib/store";

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState<AssetType | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Load books on mount
  useEffect(() => { getBooks().then(setBooks).finally(() => setLoading(false)); }, []);

  const refreshBook = useCallback(async (id: string) => {
    const { getBook } = await import("@/lib/store");
    const book = await getBook(id);
    if (book) setSelectedBook(book);
  }, []);

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
    if (!confirm("Delete this book and all its visual assets?")) return;
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

    // 🎨 Generate image
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

  // ── Book Library View ──────────────────────────────────────────
  if (!selectedBook) {
    return (
      <div className="min-h-screen bg-neutral">
        <header className="sticky top-0 z-10 bg-neutral border-b border-secondary/10 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-primary">Mira</h1>
              <p className="text-muted text-sm">Visual Reading Companion</p>
            </div>
            <button
              onClick={() => setShowAddBook(true)}
              className="px-4 py-2.5 bg-tertiary text-neutral rounded-xl font-semibold text-sm hover:bg-[#E5C06A] transition-colors"
            >
              + New Book
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          {loading ? (
            <p className="text-muted text-center py-12">Loading your library…</p>
          ) : books.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-secondary text-lg mb-2">Your library is empty</p>
              <p className="text-muted mb-6">Add a book to start building your visual reading companion.</p>
              <button onClick={() => setShowAddBook(true)} className="px-6 py-3 bg-tertiary text-neutral rounded-xl font-semibold">
                Add Your First Book
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {books.map(book => (
                <button
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className="text-left bg-surface hover:bg-elevated rounded-xl p-4 border border-secondary/10 transition-colors"
                >
                  <h3 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-primary">{book.title}</h3>
                  <p className="text-secondary text-sm">{book.author}</p>
                  <p className="text-muted text-xs mt-2">
                    {book.assets.length} asset{book.assets.length !== 1 ? "s" : ""}
                    {book.assets.some(a => a.imageUrl) ? ` · ${book.assets.filter(a => a.imageUrl).length} images` : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </main>

        {/* Add Book Modal */}
        {showAddBook && (
          <Modal onClose={() => setShowAddBook(false)} title="Add a Book">
            <form onSubmit={handleAddBook} className="space-y-4">
              <Input label="Book Title" name="title" placeholder="e.g. 红楼梦" required autoFocus />
              <Input label="Author" name="author" placeholder="e.g. 曹雪芹" />
              <SubmitButton>Add to Library</SubmitButton>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  // ── Book Detail View ──────────────────────────────────────────
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
          <button onClick={() => handleDeleteBook(selectedBook.id)} className="text-muted hover:text-danger text-sm transition-colors p-1">🗑</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Characters */}
        <AssetSection
          title="Character Gallery"
          description="Paste a character description to generate a portrait."
          type="character"
          assets={assetsByType("character")}
          generating={generating}
          onAdd={() => setShowAddAsset("character")}
          onDelete={handleDeleteAsset}
        />

        {/* Scene Maps */}
        <AssetSection
          title="Scene Maps"
          description="Paste a spatial description to generate a layout diagram."
          type="scene-map"
          assets={assetsByType("scene-map")}
          generating={generating}
          onAdd={() => setShowAddAsset("scene-map")}
          onDelete={handleDeleteAsset}
        />

        {/* Key Moments */}
        <AssetSection
          title="Key Moments"
          description="Paste a plot paragraph to generate a scene illustration."
          type="key-moment"
          assets={assetsByType("key-moment")}
          generating={generating}
          onAdd={() => setShowAddAsset("key-moment")}
          onDelete={handleDeleteAsset}
        />
      </main>

      {/* Add Asset Modal */}
      {showAddAsset && (
        <Modal onClose={() => setShowAddAsset(null)} title={assetTypeLabels[showAddAsset]}>
          <form onSubmit={handleAddAsset} className="space-y-4">
            <Input label="Name" name="label" placeholder={assetTypePlaceholders[showAddAsset].label} required autoFocus />
            <div>
              <label className="block text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                name="description"
                rows={4}
                required
                placeholder={assetTypePlaceholders[showAddAsset].description}
                className="w-full bg-elevated text-primary rounded-xl px-4 py-3 text-sm resize-none placeholder:text-muted/50 border border-secondary/10 focus:border-tertiary focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Style</label>
              <select name="style" defaultValue="illustrated" className="w-full bg-elevated text-primary rounded-xl px-4 py-3 text-sm border border-secondary/10 focus:border-tertiary focus:outline-none transition-colors">
                <option value="illustrated">Illustrated (default)</option>
                <option value="realistic">Realistic</option>
                <option value="line-art">Minimal Line Art</option>
                <option value="pixel">Pixel Art</option>
              </select>
            </div>
            <SubmitButton>Save & Generate Image</SubmitButton>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

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

function Input({ label, name, placeholder, required, autoFocus }: { label: string; name: string; placeholder: string; required?: boolean; autoFocus?: boolean }) {
  return (
    <div>
      <label className="block text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">{label}</label>
      <input
        name={name}
        required={required}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full bg-elevated text-primary rounded-xl px-4 py-3 text-sm placeholder:text-muted/50 border border-secondary/10 focus:border-tertiary focus:outline-none transition-colors"
      />
    </div>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="submit" className="w-full py-3 bg-tertiary text-neutral rounded-xl font-semibold text-sm hover:bg-[#E5C06A] transition-colors">
      {children}
    </button>
  );
}

function AssetSection({ title, description, type, assets, generating, onAdd, onDelete }: {
  title: string; description: string; type: AssetType;
  assets: VisualAsset[]; generating: string | null; onAdd: () => void; onDelete: (id: string) => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-primary">{title}</h2>
          <p className="text-muted text-xs">{description}</p>
        </div>
        <button onClick={onAdd} className="px-3 py-1.5 bg-elevated text-secondary hover:text-primary rounded-lg text-sm transition-colors border border-secondary/10">+ Add</button>
      </div>
      {assets.length === 0 ? (
        <p className="text-muted text-sm italic py-4 text-center bg-surface rounded-xl border border-secondary/10">No {type} assets yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {assets.map(asset => (
            <AssetCard key={asset.id} asset={asset} isGenerating={generating === asset.id} onDelete={() => onDelete(asset.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

function AssetCard({ asset, isGenerating, onDelete }: { asset: VisualAsset; isGenerating: boolean; onDelete: () => void }) {
  return (
    <div className="bg-surface rounded-xl overflow-hidden border border-secondary/10 group">
      <div className="aspect-square bg-elevated flex items-center justify-center relative">
        {isGenerating ? (
          <div className="animate-amber-pulse w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-tertiary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted text-xs">Generating…</p>
            </div>
          </div>
        ) : asset.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.imageUrl} alt={asset.label} className="w-full h-full object-cover" />
            <button
              onClick={onDelete}
              className="absolute top-1 right-1 p-1 bg-neutral/80 text-muted hover:text-danger rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            >×</button>
          </>
        ) : (
          <p className="text-muted text-xs text-center p-4">No image</p>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-primary text-xs font-medium truncate">{asset.label}</p>
        <p className="text-muted text-[10px] truncate">{asset.style}</p>
      </div>
    </div>
  );
}

const assetTypeLabels: Record<AssetType, string> = {
  character: "Add Character",
  "scene-map": "Add Scene Map",
  "key-moment": "Add Key Moment",
};

const assetTypePlaceholders: Record<AssetType, { label: string; description: string }> = {
  character: {
    label: "e.g. 林黛玉",
    description: "Paste the character's description from the book. e.g. \"两弯似蹙非蹙笼烟眉，一双似喜非喜含情目。态生两靥之愁，娇袭一身之病……\"",
  },
  "scene-map": {
    label: "e.g. 大观园全景",
    description: "Paste the spatial description. e.g. \"贾府分为宁国府和荣国府，大观园位于两府之间。从正门进入，迎面是翠嶂假山，绕过假山可见沁芳亭……\"",
  },
  "key-moment": {
    label: "e.g. 黛玉葬花",
    description: "Paste the plot paragraph. e.g. \"黛玉肩上担着花锄，锄上挂着花囊，手内拿着花帚。只见一阵风过，把树头上桃花吹下一大半来……\"",
  },
};
