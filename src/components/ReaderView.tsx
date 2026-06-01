"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import type { ChapterSection, CharacterCard, SceneCard, MomentCard } from "@/lib/types";
import type { TranslationDict } from "@/lib/i18n";

interface AskResult {
  answer: string;
  spoilerWarning?: string;
}

interface Props {
  t: TranslationDict;
  chapter: ChapterSection;
  bookTitle: string;
  bookAuthor: string;
  characters: CharacterCard[];
  scenes: SceneCard[];
  moments: MomentCard[];
  currentChapter: number;
  totalChapters: number;
  onAsk: (question: string, selection: string) => Promise<AskResult>;
  onRecap?: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

const ASK_ACTIONS = [
  { id: "explain", icon: "💡", label: "解释这段" },
  { id: "who", icon: "👤", label: "这里出现了谁？" },
  { id: "space", icon: "🗺", label: "这段的空间关系？" },
  { id: "visual", icon: "🎨", label: "提取视觉细节" },
  { id: "foreshadow", icon: "🔍", label: "这是伏笔吗？（不剧透）" },
  { id: "custom", icon: "💬", label: "自定义提问…" },
];

export default function ReaderView({
  t, chapter, bookTitle, bookAuthor, characters, scenes, moments,
  currentChapter, totalChapters, onAsk, onRecap, onPrevChapter, onNextChapter,
}: Props) {
  const pageRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.9);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageBreaks, setPageBreaks] = useState<number[]>([0]);
  const [selectedText, setSelectedText] = useState("");
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [spoilerWarning, setSpoilerWarning] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Split chapter text into paragraphs (memoized)
  const paragraphs = useMemo(() =>
    chapter.text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0 && !/^(第[零〇一二三四五六七八九十百千\d]+[章节回]|Chapter\s+\d+)/i.test(p)),
    [chapter.text]
  );

  const totalPages = pageBreaks.length;
  const safePageIndex = Math.min(pageIndex, Math.max(totalPages - 1, 0));

  // ── Pagination: compute pages (returns breaks, does NOT set state) ──
  const computePages = useCallback(() => {
    const el = pageRef.current;
    if (!el || paragraphs.length === 0) return [0];

    const pageHeight = Math.max(200, el.clientHeight - 48);
    const charWidth = fontSize * 0.6;
    const containerWidth = Math.max(300, el.clientWidth - 64);
    const charsPerLine = Math.max(1, Math.floor(containerWidth / charWidth));
    const linesPerPage = Math.max(1, Math.floor(pageHeight / (fontSize * lineHeight)));
    const charsPerPage = charsPerLine * linesPerPage;

    const breaks: number[] = [0];
    let currentChars = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const pLen = paragraphs[i].length + 2;
      if (currentChars + pLen > charsPerPage && currentChars > charsPerPage * 0.3) {
        breaks.push(i);
        currentChars = pLen;
      } else {
        currentChars += pLen;
      }
    }
    return breaks;
  }, [paragraphs, fontSize, lineHeight]);

  // Recalculate after layout is ready
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setPageBreaks(computePages());
      setPageIndex(0);
    });
    return () => cancelAnimationFrame(raf);
  }, [computePages]);

  // Recalculate on resize
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        setPageBreaks(computePages());
      });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [computePages]);

  // ── Page navigation ──
  const goToPage = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, totalPages - 1));
    setPageIndex(clamped);
  };

  const goNextPage = () => {
    if (safePageIndex < totalPages - 1) {
      setPageIndex(safePageIndex + 1);
    } else {
      onNextChapter();
    }
  };

  const goPrevPage = () => {
    if (safePageIndex > 0) {
      setPageIndex(safePageIndex - 1);
    } else {
      onPrevChapter();
    }
  };

  // ── Current page paragraphs ──
  const startIdx = pageBreaks[safePageIndex] || 0;
  const endIdx = safePageIndex + 1 < pageBreaks.length ? pageBreaks[safePageIndex + 1] : paragraphs.length;
  const pageParagraphs = paragraphs.slice(startIdx, endIdx);

  // ── Text selection ──
  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() || "";
    if (text.length < 3) { setPopupPos(null); setSelectedText(""); return; }

    setSelectedText(text);
    setAnswer(null);
    setSpoilerWarning(null);

    if (sel?.rangeCount) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPopupPos({
        x: rect.left + rect.width / 2,
        y: rect.bottom + window.scrollY + 8,
      });
    }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, [handleSelection]);

  // ── Ask Mira ──
  const handleAsk = async (actionId: string) => {
    const questionMap: Record<string, string> = {
      explain: "请解释这段话的含义和上下文。",
      who: "这段话里出现了哪些人物？他们的关系和当前状态是什么？",
      space: "请分析这段话描述的空间关系，谁在哪里，东西怎么摆放的。",
      visual: "请提取这段话中所有可以用于生成图像的视觉细节（人物外貌、场景氛围、物品、光线等）。",
      foreshadow: "这段话是否可能是某种伏笔或暗示？请不要剧透后文，只基于目前已读内容分析。",
    };

    const question = actionId === "custom" ? customQuestion : (questionMap[actionId] || "");
    if (actionId === "custom" && !customQuestion.trim()) return;

    setAsking(true);
    setAnswer(null);
    try {
      const result = await onAsk(question, selectedText);
      setAnswer(result.answer);
      setSpoilerWarning(result.spoilerWarning || null);
    } catch {
      setAnswer("抱歉，AI 暂时无法回答。请稍后重试。");
    } finally {
      setAsking(false);
      setShowCustomInput(false);
      setCustomQuestion("");
    }
  };

  const closePopup = () => {
    setPopupPos(null);
    setAnswer(null);
    setSpoilerWarning(null);
    setShowCustomInput(false);
  };

  // ── Keyboard navigation ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (popupPos) return; // don't navigate when popup is open
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goNextPage(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goPrevPage(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [safePageIndex, totalPages, popupPos]);

  return (
    <div className="bg-surface rounded-xl border border-secondary/10 overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-secondary/10 bg-neutral/50">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <button onClick={onPrevChapter} disabled={currentChapter <= 1}
            className="px-2 py-1 hover:text-primary disabled:opacity-30 transition-colors" title="上一章">
            ◀◀
          </button>
          <span className="text-secondary font-medium min-w-[60px] text-center">
            {chapter.title.length > 12 ? chapter.title.slice(0, 12) + "…" : chapter.title}
          </span>
          <button onClick={onNextChapter} disabled={currentChapter >= totalChapters}
            className="px-2 py-1 hover:text-primary disabled:opacity-30 transition-colors" title="下一章">
            ▶▶
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Font controls */}
          <div className="flex items-center gap-0.5">
            <button onClick={() => setFontSize(Math.max(14, fontSize - 2))}
              className="w-7 h-7 flex items-center justify-center text-muted hover:text-primary text-sm rounded transition-colors">
              A-
            </button>
            <button onClick={() => setFontSize(Math.min(26, fontSize + 2))}
              className="w-7 h-7 flex items-center justify-center text-muted hover:text-primary text-sm rounded transition-colors">
              A+
            </button>
            <button onClick={() => setShowSettings(!showSettings)}
              className={`w-7 h-7 flex items-center justify-center text-sm rounded transition-colors ${showSettings ? "text-tertiary bg-tertiary/10" : "text-muted hover:text-primary"}`}>
              ⚙
            </button>
          </div>

          {/* Recap */}
          {onRecap && (
            <button onClick={onRecap}
              className="px-2.5 py-1 bg-elevated text-secondary hover:text-primary rounded-lg text-[11px] border border-secondary/10 transition-colors">
              📺 回顾
            </button>
          )}
        </div>
      </div>

      {/* ── Settings panel ── */}
      {showSettings && (
        <div className="px-4 py-3 border-b border-secondary/10 bg-elevated/30 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted">字号</span>
            <span className="text-primary font-mono">{fontSize}px</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted">行高</span>
            <button onClick={() => setLineHeight(Math.max(1.4, lineHeight - 0.1))}
              className="px-1.5 text-muted hover:text-primary transition-colors">−</button>
            <span className="text-primary font-mono">{lineHeight.toFixed(1)}</span>
            <button onClick={() => setLineHeight(Math.min(2.5, lineHeight + 0.1))}
              className="px-1.5 text-muted hover:text-primary transition-colors">+</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted">页</span>
            <span className="text-primary font-mono">{safePageIndex + 1}/{totalPages}</span>
          </div>
        </div>
      )}

      {/* ── Page content ── */}
      <div
        ref={pageRef}
        className="relative"
        style={{ minHeight: "55vh" }}
      >
        <div
          className="px-8 py-6 overflow-hidden select-text"
          style={{
            minHeight: "55vh",
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            fontFamily: "Georgia, 'Noto Serif SC', 'Songti SC', serif",
          }}
        >
          {pageParagraphs.map((p, i) => (
            <p key={i} className="indent-8 text-primary/85 mb-2">
              {p}
            </p>
          ))}

          {/* Empty page placeholder */}
          {pageParagraphs.length === 0 && (
            <div className="flex items-center justify-center h-64 text-muted text-sm">
              正在计算分页…
            </div>
          )}
        </div>

        {/* Click zones for prev/next page */}
        <div className="absolute inset-y-0 left-0 w-1/4 cursor-pointer z-10"
          onClick={goPrevPage} title="上一页" />
        <div className="absolute inset-y-0 right-0 w-1/4 cursor-pointer z-10"
          onClick={goNextPage} title="下一页" />
      </div>

      {/* ── Footer navigation ── */}
      <div className="border-t border-secondary/10 px-4 py-2.5 flex items-center justify-between bg-neutral/50">
        <button onClick={goPrevPage} disabled={safePageIndex === 0 && currentChapter <= 1}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-secondary hover:text-primary disabled:opacity-30 transition-colors rounded-lg">
          ◀ 上一页
        </button>

        {/* Progress bar */}
        <div className="flex-1 mx-4">
          <div className="w-full bg-secondary/10 rounded-full h-1">
            <div className="bg-tertiary/60 h-1 rounded-full transition-all duration-300"
              style={{ width: `${totalPages > 1 ? (safePageIndex / (totalPages - 1)) * 100 : 0}%` }} />
          </div>
          <div className="text-muted text-[10px] text-center mt-0.5">
            {safePageIndex + 1} / {totalPages} 页 · 第 {currentChapter}/{totalChapters} 章
          </div>
        </div>

        <button onClick={goNextPage} disabled={safePageIndex === totalPages - 1 && currentChapter >= totalChapters}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-secondary hover:text-primary disabled:opacity-30 transition-colors rounded-lg">
          下一页 ▶
        </button>
      </div>

      {/* ── Ask Mira popup ── */}
      {popupPos && selectedText && (
        <div className="fixed z-50" style={{ left: popupPos.x, top: popupPos.y, transform: "translateX(-50%)" }}>
          <div className="bg-elevated border border-secondary/20 rounded-xl shadow-xl p-3 w-72 max-w-[90vw]">
            <p className="text-muted text-[11px] italic mb-2 border-b border-secondary/10 pb-2 max-h-16 overflow-hidden">
              &ldquo;{selectedText.slice(0, 100)}{selectedText.length > 100 ? "…" : ""}&rdquo;
            </p>

            <p className="text-secondary text-[10px] font-semibold uppercase tracking-wider mb-1.5">Ask Mira</p>

            {!asking && !answer && !showCustomInput && (
              <div className="space-y-1">
                {ASK_ACTIONS.map(action => (
                  <button key={action.id}
                    onClick={() => action.id === "custom" ? setShowCustomInput(true) : handleAsk(action.id)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-primary hover:bg-tertiary/10 transition-colors flex items-center gap-2">
                    <span>{action.icon}</span><span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}

            {showCustomInput && (
              <div className="space-y-2">
                <input value={customQuestion} onChange={e => setCustomQuestion(e.target.value)}
                  placeholder="输入你的问题…" autoFocus
                  className="w-full bg-neutral text-primary rounded-lg px-3 py-2 text-xs placeholder:text-muted/50 border border-secondary/10 focus:border-tertiary focus:outline-none" />
                <div className="flex gap-1">
                  <button onClick={() => handleAsk("custom")} className="flex-1 py-1.5 bg-tertiary text-neutral rounded-lg text-xs font-semibold">提问</button>
                  <button onClick={() => setShowCustomInput(false)} className="px-3 py-1.5 bg-elevated text-muted rounded-lg text-xs">{t.cancel}</button>
                </div>
              </div>
            )}

            {asking && (
              <div className="flex items-center gap-2 py-3 text-muted text-xs">
                <span className="animate-spin">⏳</span> AI 正在思考…
              </div>
            )}

            {answer && (
              <div className="space-y-2">
                {spoilerWarning && (
                  <div className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[10px] rounded border border-amber-500/20">
                    ⚠️ {spoilerWarning}
                  </div>
                )}
                <div className="text-primary text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {answer}
                </div>
                <div className="flex gap-1">
                  <button onClick={closePopup} className="flex-1 py-1.5 bg-elevated text-muted hover:text-secondary rounded-lg text-xs transition-colors">{t.close}</button>
                  <button onClick={() => { setAnswer(null); setShowCustomInput(false); }} className="px-3 py-1.5 bg-elevated text-secondary hover:text-primary rounded-lg text-xs transition-colors">↩ 再问</button>
                </div>
              </div>
            )}

            {!asking && !answer && (
              <button onClick={closePopup} className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-muted hover:text-primary text-xs">✕</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
