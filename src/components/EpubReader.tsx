"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface Props {
  epubBuffer: ArrayBuffer;
  onLocationChange?: (cfi: string, progress: number) => void;
}

export default function EpubReader({ epubBuffer, onLocationChange }: Props) {
  const viewerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renditionRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [fontSize, setFontSize] = useState(100); // percentage

  // ── Init epub.js ──
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const ePub = (await import("epubjs")).default;
      if (cancelled || !viewerRef.current) return;

      const book = ePub(epubBuffer);
      bookRef.current = book;

      const rendition = book.renderTo(viewerRef.current, {
        width: "100%",
        height: "100%",
        spread: "none",
        flow: "paginated",
        manager: "default",
      });

      renditionRef.current = rendition;

      // Apply initial font size
      rendition.themes.fontSize(`${fontSize}%`);

      // Location change handler
      rendition.on("relocated", (location: any) => {
        if (onLocationChange) {
          const total = (book.locations as any).total || 1;
          const current = location.start?.location || 0;
          onLocationChange(location.start.cfi, current / total);
        }
      });

      // Generate locations (needed for progress)
      await book.ready;
      await book.locations.generate(1000);

      const displayed = rendition.display();
      await displayed;

      if (!cancelled) setReady(true);
    };

    init().catch(console.error);

    return () => {
      cancelled = true;
      renditionRef.current?.destroy();
      bookRef.current?.destroy();
    };
  }, [epubBuffer, onLocationChange]);

  // ── Font size changes ──
  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}%`);
  }, [fontSize]);

  // ── Keyboard navigation ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        renditionRef.current?.next();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        renditionRef.current?.prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready]);

  // ── Navigate to a CFI ──
  const goTo = useCallback((cfi: string) => {
    renditionRef.current?.display(cfi);
  }, []);

  const goNext = useCallback(() => renditionRef.current?.next(), []);
  const goPrev = useCallback(() => renditionRef.current?.prev(), []);

  return (
    <div className="bg-surface rounded-xl border border-secondary/10 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-secondary/10 bg-neutral/50">
        <div className="flex items-center gap-1 text-xs text-muted">
          <button onClick={goPrev}
            className="px-2 py-1 hover:text-primary transition-colors rounded">◀</button>
          <button onClick={goNext}
            className="px-2 py-1 hover:text-primary transition-colors rounded">▶</button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setFontSize(Math.max(60, fontSize - 10))}
            className="w-7 h-7 flex items-center justify-center text-muted hover:text-primary text-sm rounded transition-colors">
            A-
          </button>
          <span className="text-muted text-[10px] w-10 text-center">{fontSize}%</span>
          <button onClick={() => setFontSize(Math.min(200, fontSize + 10))}
            className="w-7 h-7 flex items-center justify-center text-muted hover:text-primary text-sm rounded transition-colors">
            A+
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div
        ref={viewerRef}
        className="flex-1"
        style={{ minHeight: "60vh", height: "calc(100vh - 200px)" }}
      />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral/80">
          <span className="text-muted text-sm">⏳ 加载中…</span>
        </div>
      )}
    </div>
  );
}
