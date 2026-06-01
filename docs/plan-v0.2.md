# Mira v0.2 — 智能电子书导入 + 双语界面

> **Goal:** 支持上传 epub/txt/pdf，自动提取人物/场景/情节描写，一键生成整套视觉资料包。UI 支持中英双语。

**Architecture:** 客户端 Next.js SPA + IndexedDB 本地存储 + 三个 API 路由（生图、文件解析、LLM 提取）。所有处理在服务端完成，结果返回前端展示。

**Tech Stack:** Next.js 16 + Tailwind v4 + IndexedDB + epub.js（客户端）+ pdf-parse + mammoth（服务端）+ OpenAI-compatible API（LLM 提取 + 生图）

---

## Phase 1 — 双语化 (i18n)

### Task 1: Create i18n system
**Files:** Create `src/lib/i18n.ts`
**Goal:** Lightweight translation dict + React context, no external deps

```typescript
// src/lib/i18n.ts
export type Lang = "zh" | "en";
export const translations = {
  zh: { appName: "米拉", tagline: "心象阅读助手", ... },
  en: { appName: "Mira", tagline: "Visual Reading Companion", ... },
};
```

### Task 2: Add LanguageSwitcher component
**Files:** Create `src/components/LanguageSwitcher.tsx`
**Goal:** Toggle button in header, persists to localStorage

### Task 3: Apply translations to all UI
**Files:** Modify `src/app/page.tsx` — replace all hardcoded strings with `t("key")`

---

## Phase 2 — 电子书上传与解析

### Task 4: Add ebook parsing API route
**Files:** Create `src/app/api/parse/route.ts`
**Goal:** Accept file upload (epub/txt/pdf), return plain text content

Deps: `npm install mammoth pdf-parse`
- EPUB: Use native `JSZip` to extract XHTML, strip tags
- TXT: Read directly
- PDF: `pdf-parse`

### Task 5: Create BookUpload component
**Files:** Create `src/components/BookUpload.tsx`
**Goal:** Drag-and-drop zone, progress bar, parsed text preview

---

## Phase 3 — LLM 内容提取

### Task 6: Add extraction API route
**Files:** Create `src/app/api/extract/route.ts`
**Goal:** Send book text to LLM, get structured JSON back with characters/scenes/moments

Config: `EXTRACT_API_KEY`, `EXTRACT_BASE_URL`, `EXTRACT_MODEL` in `.env.local`

Prompt design:
```
You are a literary analyst. From the following book text, extract:
1. Characters: name, physical description, personality traits
2. Scenes: location name, spatial description
3. Key moments: important plot events with visual details

Return JSON: { characters: [...], scenes: [...], moments: [...] }
```

### Task 7: Create ExtractionPanel component
**Files:** Create `src/components/ExtractionPanel.tsx`
**Goal:** Show extracted items, let user edit/delete/approve before generating images

---

## Phase 4 — 批量生成

### Task 8: Batch image generation
**Files:** Modify `src/app/api/generate/route.ts`
**Goal:** Accept array of items → generate images in parallel → return all URLs

### Task 9: Connect extraction → gallery
**Files:** Modify `src/app/page.tsx`
**Goal:** One-click "Generate All" button after extraction, progress tracking

---

## Phase 5 — 阅读模式

### Task 10: Reading view with side-by-side visuals
**Files:** Modify `src/app/page.tsx` — add reading mode
**Goal:** Toggle between "Library" and "Read" mode. Reading mode shows book text on left, visual assets in sidebar on right.

---

## File Tree After v0.2

```
src/
  app/
    api/
      generate/route.ts
      parse/route.ts        ← NEW
      extract/route.ts      ← NEW
    globals.css
    layout.tsx              ← modified
    page.tsx                ← modified
  components/
    BookUpload.tsx          ← NEW
    ExtractionPanel.tsx     ← NEW
    LanguageSwitcher.tsx    ← NEW
  lib/
    types.ts                ← modified
    store.ts                ← modified
    i18n.ts                 ← NEW
.env.local.example          ← modified
```

---

## Priority & Estimated Effort

| Phase | Priority | Est. |
|-------|----------|------|
| 1. i18n | 🔴 Must | 30min |
| 2. Ebook parsing | 🔴 Must | 1h |
| 3. LLM extraction | 🔴 Must | 1.5h |
| 4. Batch generation | 🟡 Should | 30min |
| 5. Reading mode | 🟢 Nice | 1h |
