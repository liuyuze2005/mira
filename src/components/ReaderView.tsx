"use client";

import { useRef, useState, useEffect, useCallback } from "react";
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
  onAsk: (question: string, selection: string) => Promise<AskResult>;
  onRecap?: () => void;
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
  currentChapter, onAsk, onRecap,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState("");
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [spoilerWarning, setSpoilerWarning] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Split chapter text into paragraphs
  const paragraphs = chapter.text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0 && !/^(第[零〇一二三四五六七八九十百千\d]+[章节回]|Chapter\s+\d+)/i.test(p)); // skip chapter headers

  // Handle text selection
  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() || "";
    if (text.length < 5) { setPopupPos(null); setSelectedText(""); return; }

    setSelectedText(text);
    setAnswer(null);
    setSpoilerWarning(null);

    // Position popup near selection
    if (sel?.rangeCount) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPopupPos({
        x: rect.left + rect.width / 2,
        y: rect.bottom + window.scrollY + 10,
      });
    }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, [handleSelection]);

  // Handle Ask Mira action
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

  // Close popup
  const closePopup = () => {
    setPopupPos(null);
    setAnswer(null);
    setSpoilerWarning(null);
    setShowCustomInput(false);
  };

  return (
    <div className="bg-surface rounded-xl border border-secondary/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary/10">
        <div>
          <h3 className="font-[family-name:var(--font-serif)] text-primary font-semibold">
            {chapter.title}
          </h3>
          <p className="text-muted text-xs mt-0.5">
            {paragraphs.length} 段 · 约 {chapter.text.length} 字
          </p>
        </div>
        {onRecap && (
          <button
            onClick={onRecap}
            className="px-3 py-1.5 bg-elevated text-secondary hover:text-primary rounded-lg text-xs border border-secondary/10 transition-colors"
          >
            📺 继续阅读前回顾
          </button>
        )}
      </div>

      {/* Reading area */}
      <div
        ref={containerRef}
        className="p-5 leading-relaxed"
        style={{ fontFamily: "Georgia, 'Noto Serif SC', serif" }}
      >
        <div className="space-y-4 text-primary/85 text-[15px]">
          {paragraphs.map((p, i) => (
            <p key={i} data-paragraph={i} className="indent-8">
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* Ask Mira popup */}
      {popupPos && selectedText && (
        <div className="fixed z-50" style={{ left: popupPos.x, top: popupPos.y, transform: "translateX(-50%)" }}>
          <div className="bg-elevated border border-secondary/20 rounded-xl shadow-xl p-3 w-72 max-w-[90vw]">
            {/* Selected text preview */}
            <p className="text-muted text-[11px] italic mb-2 border-b border-secondary/10 pb-2 max-h-16 overflow-hidden">
              &ldquo;{selectedText.slice(0, 100)}{selectedText.length > 100 ? "…" : ""}&rdquo;
            </p>

            {/* Ask Mira */}
            <p className="text-secondary text-[10px] font-semibold uppercase tracking-wider mb-1.5">Ask Mira</p>

            {!asking && !answer && !showCustomInput && (
              <div className="space-y-1">
                {ASK_ACTIONS.map(action => (
                  <button
                    key={action.id}
                    onClick={() => action.id === "custom" ? setShowCustomInput(true) : handleAsk(action.id)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-primary hover:bg-tertiary/10 transition-colors flex items-center gap-2"
                  >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Custom question input */}
            {showCustomInput && (
              <div className="space-y-2">
                <input
                  value={customQuestion}
                  onChange={e => setCustomQuestion(e.target.value)}
                  placeholder="输入你的问题…"
                  autoFocus
                  className="w-full bg-neutral text-primary rounded-lg px-3 py-2 text-xs placeholder:text-muted/50 border border-secondary/10 focus:border-tertiary focus:outline-none"
                />
                <div className="flex gap-1">
                  <button onClick={() => handleAsk("custom")} className="flex-1 py-1.5 bg-tertiary text-neutral rounded-lg text-xs font-semibold">提问</button>
                  <button onClick={() => setShowCustomInput(false)} className="px-3 py-1.5 bg-elevated text-muted rounded-lg text-xs">{t.cancel}</button>
                </div>
              </div>
            )}

            {/* Loading */}
            {asking && (
              <div className="flex items-center gap-2 py-3 text-muted text-xs">
                <span className="animate-spin">⏳</span> AI 正在思考…
              </div>
            )}

            {/* Answer */}
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
                  <button onClick={closePopup} className="flex-1 py-1.5 bg-elevated text-muted hover:text-secondary rounded-lg text-xs transition-colors">
                    {t.close}
                  </button>
                  <button onClick={() => { setAnswer(null); setShowCustomInput(false); }} className="px-3 py-1.5 bg-elevated text-secondary hover:text-primary rounded-lg text-xs transition-colors">
                    ↩ 再问
                  </button>
                </div>
              </div>
            )}

            {/* Close button */}
            {!asking && !answer && (
              <button onClick={closePopup} className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-muted hover:text-primary text-xs">✕</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
