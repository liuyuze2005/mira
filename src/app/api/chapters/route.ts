import { NextRequest, NextResponse } from "next/server";
import type { ChapterSection, SectionKind } from "@/lib/types";

// ── Regex patterns for chapter headers ──
const CHAPTER_PATTERNS = [
  // Chinese: 第一章, 第1章, 第一章 xxx, 第 1 章
  /第[\s]*[零〇一二三四五六七八九十百千0-9]+[\s]*[章回节卷]/,
  // English: Chapter 1, CHAPTER I, Ch. 1
  /Chapter\s+\d+/i,
  /CHAPTER\s+[IVX]+/,
  // Numbered: 1. xxx, 一、xxx
  /^\d+[\.\、\s]\s*\S+/m,
  // Special: 序章, 终章, 楔子, 尾声
  /^(序章|终章|楔子|尾声|引子|缘起)/m,
  /^(Prologue|Epilogue|Interlude)/im,
];

// ── Back-matter indicators ──
const BACK_MATTER_PATTERNS = [
  /(后记|跋|附录|注释|参考资料|索引|致谢|出版后记|译后记)/,
  /(Afterword|Appendix|Notes|References|Index|Acknowledgements|Colophon|Postscript)/i,
];

// ── Front-matter indicators ──
const FRONT_MATTER_PATTERNS = [
  /(前言|序[言文]?|译者序|作者序|导读|凡例|目录|代序|自序|他序|写在前面)/,
  /(Preface|Foreword|Introduction|Translator'?s Note|Author'?s Note|Prologue|Acknowledgment)/i,
];

// ── Parse chapters from plain text ──
function parseChapters(text: string): ChapterSection[] {
  const chapters: ChapterSection[] = [];

  // Find all potential chapter boundaries
  const boundaries: { pos: number; header: string }[] = [];

  for (const pattern of CHAPTER_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      // Avoid duplicates at same position
      if (!boundaries.some(b => Math.abs(b.pos - match!.index) < 10)) {
        boundaries.push({ pos: match.index, header: match[0] });
      }
    }
  }

  // Also check for explicit headers
  const headerRegex = /^(.{0,50})[\r\n]+/gm;
  let m: RegExpExecArray | null;
  while ((m = headerRegex.exec(text)) !== null) {
    const header = m[1].trim();
    if (
      header.length >= 2 && header.length <= 60 &&
      !header.startsWith("<") && !header.startsWith("{") &&
      /[第章回节卷]|Chapter|CHAPTER|序|楔|尾|后/.test(header) &&
      !boundaries.some(b => Math.abs(b.pos - m!.index) < 20)
    ) {
      boundaries.push({ pos: m.index, header });
    }
  }

  // Sort by position
  boundaries.sort((a, b) => a.pos - b.pos);

  // If no chapters found, treat as single section
  if (boundaries.length === 0) {
    return [{
      index: 1,
      title: "Full Text",
      kind: "unknown",
      text: text.trim(),
      startOffset: 0,
      endOffset: text.length,
    }];
  }

  // Split text at boundaries
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i].pos;
    const end = i + 1 < boundaries.length ? boundaries[i + 1].pos : text.length;
    const chapterText = text.slice(start, end).trim();
    const header = boundaries[i].header;

    // Extract title: the first line after the header
    const firstLineEnd = chapterText.indexOf("\n");
    const titleLine = firstLineEnd > 0
      ? chapterText.slice(0, firstLineEnd).trim()
      : chapterText.slice(0, 60);

    chapters.push({
      index: i + 1,
      title: titleLine.length <= 60 ? titleLine : header,
      kind: "body", // default, will be reclassified
      text: chapterText,
      startOffset: start,
      endOffset: end,
    });
  }

  return chapters;
}

// ── Classify sections ──
function classifySections(chapters: ChapterSection[]): ChapterSection[] {
  if (chapters.length <= 1) {
    chapters[0].kind = "body";
    return chapters;
  }

  const n = chapters.length;

  for (let i = 0; i < n; i++) {
    const title = chapters[i].title;
    const text = chapters[i].text.slice(0, 500);

    // Check back-matter
    if (BACK_MATTER_PATTERNS.some(p => p.test(title) || p.test(text))) {
      chapters[i].kind = "back-matter";
      continue;
    }

    // Check front-matter  
    if (FRONT_MATTER_PATTERNS.some(p => p.test(title) || p.test(text))) {
      chapters[i].kind = "front-matter";
      continue;
    }

    // Heuristic: first 1-2 sections without chapter numbers → front-matter
    if (i < 2 && !/第.*[章回]|Chapter\s+\d/i.test(title) && n > 3) {
      chapters[i].kind = "front-matter";
      continue;
    }

    // Heuristic: last section with back-matter keywords
    if (i >= n - 2) {
      if (/(后记|跋|附录|致谢|Afterword|Appendix)/i.test(title)) {
        chapters[i].kind = "back-matter";
        continue;
      }
    }

    // Default: body
    chapters[i].kind = "body";
  }

  return chapters;
}

// ── POST ──
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

    let chapters = parseChapters(text);
    chapters = classifySections(chapters);

    const bodyChapters = chapters.filter(c => c.kind === "body");
    const frontMatter = chapters.filter(c => c.kind === "front-matter");
    const backMatter = chapters.filter(c => c.kind === "back-matter");

    return NextResponse.json({
      chapters,
      summary: {
        totalFound: chapters.length,
        bodyChapters: bodyChapters.length,
        frontMatterSections: frontMatter.length,
        backMatterSections: backMatter.length,
        frontMatterTitles: frontMatter.map(c => c.title),
        bodyTitles: bodyChapters.map(c => c.title),
        backMatterTitles: backMatter.map(c => c.title),
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
