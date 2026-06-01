import type { Book } from "./types";
import type { LegacyBook } from "./types";

const DB_NAME = "mira-library";
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("books")) {
        db.createObjectStore("books", { keyPath: "id" });
      }
      // v2: no schema change needed (IndexedDB is schemaless for objects),
      // but we bump version to signal migration opportunity
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── CRUD ──
export async function getBooks(): Promise<Book[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("books", "readonly");
    const store = tx.objectStore("books");
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result.map(migrateIfLegacy);
      resolve(all.sort((a, b) => b.createdAt - a.createdAt));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getBook(id: string): Promise<Book | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("books", "readonly");
    const store = tx.objectStore("books");
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result ? migrateIfLegacy(req.result) : undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBook(book: Book): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("books", "readwrite");
    const store = tx.objectStore("books");
    store.put(book);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteBook(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("books", "readwrite");
    const store = tx.objectStore("books");
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Helpers ──
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function createBook(title: string, author: string): Book {
  return {
    id: generateId(),
    title,
    author,
    chapters: [],
    currentChapter: 0,
    characters: [],
    scenes: [],
    moments: [],
    knowledgeSource: "text-extraction",
    createdAt: Date.now(),
  };
}

// ── Migration: legacy VisualAsset-based Book → new Card-based Book ──
function migrateIfLegacy(raw: unknown): Book {
  const r = raw as Record<string, unknown>;
  // Already v2+
  if (r.chapters !== undefined) return raw as Book;
  // Old v2 (no chapters)
  if (r.characters !== undefined && r.scenes !== undefined) {
    return {
      ...(raw as Book),
      chapters: [],
      currentChapter: 0,
    };
  }
  // Legacy
  const legacy = raw as LegacyBook;
  return {
    id: legacy.id,
    title: legacy.title,
    author: legacy.author,
    chapters: [],
    currentChapter: 0,
    characters: [],
    scenes: [],
    moments: [],
    knowledgeSource: "text-extraction",
    createdAt: legacy.createdAt,
  };
}
