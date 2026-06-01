export type Lang = "zh" | "en";

export interface TranslationDict {
  appName: string;
  tagline: string;
  // Library
  newBook: string;
  addBook: string;
  bookTitle: string;
  author: string;
  addToLibrary: string;
  yourLibrary: string;
  libraryEmpty: string;
  libraryEmptyDesc: string;
  addFirstBook: string;
  deleteBook: string;
  confirmDelete: string;
  // Knowledge-first
  knowledgeTitle: string;
  knowledgeDesc: string;
  knowBtn: string;
  knowing: string;
  knownChars: string;
  knownScenes: string;
  knownMoments: string;
  sourceLLM: string;
  sourceExtract: string;
  sourceNotes: string;
  // Upload
  uploadBook: string;
  uploadDesc: string;
  dragDrop: string;
  parsing: string;
  parseDone: string;
  extractBtn: string;
  extracting: string;
  pipelineMode: string;
  chunkProgress: string;
  // Cards
  characterGallery: string;
  characterDesc: string;
  sceneGallery: string;
  sceneDesc: string;
  keyMoments: string;
  keyMomentsDesc: string;
  explicit: string;
  inferred: string;
  unknown: string;
  sourceQuote: string;
  noSourceQuote: string;
  protagonist: string;
  supporting: string;
  minor: string;
  atmosphere: string;
  spatialLayout: string;
  // Spoiler
  spoilerGate: string;
  currentChapter: string;
  chapter: string;
  revealed: string;
  hidden: string;
  lockedUntilChapter: string;
  // Generation
  generateQueue: string;
  generateAll: string;
  generating: string;
  generateDone: string;
  generateFailed: string;
  queueEmpty: string;
  queued: string;
  // Prompt editor
  promptEditor: string;
  visualStyle: string;
  period: string;
  colorPalette: string;
  avoidPrompt: string;
  customPrompt: string;
  customPromptDesc: string;
  saveStyle: string;
  styleSaved: string;
  resetStyle: string;
  // Export
  exportPack: string;
  exportDesc: string;
  exportBtn: string;
  // Assets
  style: string;
  illustrated: string;
  realistic: string;
  lineArt: string;
  pixel: string;
  saveGenerate: string;
  generate: string;
  noImage: string;
  noAssets: string;
  styleDesc: Record<string, string>;
  // General
  addCharacter: string;
  addScene: string;
  addMoment: string;
  name_: string;
  description: string;
  extractionResults: string;
  characters: string;
  scenes: string;
  moments: string;
  approveGenerate: string;
  readMode: string;
  libraryMode: string;
  readingView: string;
  close: string;
  back: string;
  assets: string;
  images: string;
  loading: string;
  cancel: string;
  retry: string;
  error: string;
  apiKeyMissing: string;
}

const zh: TranslationDict = {
  appName: "米拉",
  tagline: "心象阅读助手",
  // Library
  newBook: "+ 新建书籍",
  addBook: "添加书籍",
  bookTitle: "书名",
  author: "作者",
  addToLibrary: "加入书库",
  yourLibrary: "我的书库",
  libraryEmpty: "书库空空如也",
  libraryEmptyDesc: "输入书名，Mira 会用 AI 知识为你生成视觉辅助包。",
  addFirstBook: "开始探索",
  deleteBook: "删除",
  confirmDelete: "确定删除这本书及所有视觉资产？",
  // Knowledge-first
  knowledgeTitle: "AI 知识提取",
  knowledgeDesc: "输入书名和作者，Mira 会从 AI 知识库中提取人物、场景和关键情节。不需要上传电子书。",
  knowBtn: "🔍 让 AI 分析这本书",
  knowing: "AI 正在分析…",
  knownChars: "个人物",
  knownScenes: "个场景",
  knownMoments: "个情节",
  sourceLLM: "AI 知识库",
  sourceExtract: "文本提取",
  sourceNotes: "知识来源",
  // Upload
  uploadBook: "导入电子书（可选）",
  uploadDesc: "如果 AI 知识不足（冷门书），你可以上传 epub / txt / pdf 补充。",
  dragDrop: "拖拽文件到此处，或点击选择",
  parsing: "解析中…",
  parseDone: "解析完成",
  extractBtn: "🤖 AI 智能提取",
  extracting: "提取中…",
  pipelineMode: "分段提取",
  chunkProgress: "正在处理第 {current}/{total} 段",
  // Cards
  characterGallery: "人物画廊",
  characterDesc: "角色肖像，含原文溯源。",
  sceneGallery: "场景卡片",
  sceneDesc: "氛围图与空间平面图。",
  keyMoments: "关键情节",
  keyMomentsDesc: "重要时刻的场景插图。",
  explicit: "原文明确",
  inferred: "AI 推测",
  unknown: "未知",
  sourceQuote: "原文依据",
  noSourceQuote: "无原文引用",
  protagonist: "主角",
  supporting: "配角",
  minor: "次要",
  atmosphere: "氛围图",
  spatialLayout: "空间图",
  // Spoiler
  spoilerGate: "📖 无剧透模式",
  currentChapter: "当前读到第",
  chapter: "章",
  revealed: "已解锁",
  hidden: "已隐藏",
  lockedUntilChapter: "第 {chapter} 章起解锁",
  // Generation
  generateQueue: "生图队列",
  generateAll: "一键生成全部",
  generating: "生成中…",
  generateDone: "生成完成",
  generateFailed: "生成失败",
  queueEmpty: "队列为空",
  queued: "排队中",
  // Prompt editor
  promptEditor: "风格设定",
  visualStyle: "视觉风格",
  period: "时代背景",
  colorPalette: "色调",
  avoidPrompt: "避免出现",
  customPrompt: "自定义提示词（高级）",
  customPromptDesc: "附加到每张图提示词末尾的文本",
  saveStyle: "保存风格设定",
  styleSaved: "风格已保存 ✓",
  resetStyle: "恢复默认",
  // Export
  exportPack: "导出视觉包",
  exportDesc: "下载全部角色卡、场景卡和插图，打包为 JSON。",
  exportBtn: "📦 导出 Visual Companion Pack",
  // Assets
  style: "风格",
  illustrated: "生动插画（默认）",
  realistic: "写实",
  lineArt: "极简线稿",
  pixel: "像素风",
  saveGenerate: "保存并生成图片",
  generate: "生成",
  noImage: "暂无图片",
  noAssets: "还没有内容。用 AI 知识提取或导入电子书开始。",
  styleDesc: {
    realistic: "照片级写实，细节丰富，电影感光照",
    illustrated: "生动插画风格，暖色调，笔触感",
    "line-art": "极简线稿，干净墨线，漫画速写风",
    pixel: "像素艺术，16位复古游戏风",
  },
  // General
  addCharacter: "+ 添加人物",
  addScene: "+ 添加场景",
  addMoment: "+ 添加情节",
  name_: "名称",
  description: "描述",
  extractionResults: "提取结果",
  characters: "人物",
  scenes: "场景",
  moments: "情节",
  approveGenerate: "确认并生成图片",
  readMode: "阅读模式",
  libraryMode: "书库",
  readingView: "阅读视图",
  close: "关闭",
  back: "← 返回",
  assets: "个资产",
  images: "张图片",
  loading: "加载中…",
  cancel: "取消",
  retry: "重试",
  error: "出错了",
  apiKeyMissing: "未配置 API Key",
};

const en: TranslationDict = {
  appName: "Mira",
  tagline: "Visual Reading Companion",
  // Library
  newBook: "+ New Book",
  addBook: "Add a Book",
  bookTitle: "Book Title",
  author: "Author",
  addToLibrary: "Add to Library",
  yourLibrary: "Your Library",
  libraryEmpty: "Your library is empty",
  libraryEmptyDesc: "Enter a book title — Mira uses AI knowledge to generate a Visual Companion Pack. No upload needed.",
  addFirstBook: "Get Started",
  deleteBook: "Delete",
  confirmDelete: "Delete this book and all visual assets?",
  // Knowledge-first
  knowledgeTitle: "AI Knowledge Extraction",
  knowledgeDesc: "Enter a book title and author, and Mira will extract characters, scenes, and key moments from its AI knowledge base. No ebook upload required.",
  knowBtn: "🔍 Analyze with AI",
  knowing: "AI is analyzing…",
  knownChars: "characters",
  knownScenes: "scenes",
  knownMoments: "moments",
  sourceLLM: "AI Knowledge",
  sourceExtract: "Text Extraction",
  sourceNotes: "Source Notes",
  // Upload
  uploadBook: "Import E-book (optional)",
  uploadDesc: "If AI knowledge is insufficient (obscure books), upload epub / txt / pdf as a supplement.",
  dragDrop: "Drag & drop file here, or click to select",
  parsing: "Parsing…",
  parseDone: "Parsing complete",
  extractBtn: "🤖 AI Extract",
  extracting: "Extracting…",
  pipelineMode: "Pipeline extraction",
  chunkProgress: "Processing chunk {current}/{total}",
  // Cards
  characterGallery: "Character Gallery",
  characterDesc: "Character portraits with source tracing.",
  sceneGallery: "Scene Cards",
  sceneDesc: "Atmosphere & spatial layout illustrations.",
  keyMoments: "Key Moments",
  keyMomentsDesc: "Scene illustrations of pivotal moments.",
  explicit: "Explicit",
  inferred: "Inferred",
  unknown: "Unknown",
  sourceQuote: "Source",
  noSourceQuote: "No source quote",
  protagonist: "Protagonist",
  supporting: "Supporting",
  minor: "Minor",
  atmosphere: "Atmosphere",
  spatialLayout: "Spatial Layout",
  // Spoiler
  spoilerGate: "📖 No-Spoiler Mode",
  currentChapter: "Currently at chapter",
  chapter: "",
  revealed: "Revealed",
  hidden: "Hidden",
  lockedUntilChapter: "Unlocks at chapter {chapter}",
  // Generation
  generateQueue: "Generation Queue",
  generateAll: "Generate All",
  generating: "Generating…",
  generateDone: "Done",
  generateFailed: "Failed",
  queueEmpty: "Queue is empty",
  queued: "Queued",
  // Prompt editor
  promptEditor: "Style Settings",
  visualStyle: "Visual Style",
  period: "Time Period",
  colorPalette: "Color Palette",
  avoidPrompt: "Avoid",
  customPrompt: "Custom Prompt (advanced)",
  customPromptDesc: "Appended to every image generation prompt",
  saveStyle: "Save Style",
  styleSaved: "Style saved ✓",
  resetStyle: "Reset to Default",
  // Export
  exportPack: "Export Pack",
  exportDesc: "Download all character cards, scene cards, and illustrations as a JSON bundle.",
  exportBtn: "📦 Export Visual Companion Pack",
  // Assets
  style: "Style",
  illustrated: "Illustrated (default)",
  realistic: "Realistic",
  lineArt: "Minimal Line Art",
  pixel: "Pixel Art",
  saveGenerate: "Save & Generate Image",
  generate: "Generate",
  noImage: "No image",
  noAssets: "No content yet. Use AI knowledge extraction or import an e-book to start.",
  styleDesc: {
    realistic: "Photorealistic, detailed, cinematic lighting",
    illustrated: "Vivid book illustration style, warm colors",
    "line-art": "Minimalist line art, clean ink lines, manga sketch",
    pixel: "Pixel art, 16-bit retro game style",
  },
  // General
  addCharacter: "+ Add Character",
  addScene: "+ Add Scene",
  addMoment: "+ Add Moment",
  name_: "Name",
  description: "Description",
  extractionResults: "Extraction Results",
  characters: "Characters",
  scenes: "Scenes",
  moments: "Moments",
  approveGenerate: "Confirm & Generate",
  readMode: "Reading Mode",
  libraryMode: "Library",
  readingView: "Reading View",
  close: "Close",
  back: "← Back",
  assets: "assets",
  images: "images",
  loading: "Loading…",
  cancel: "Cancel",
  retry: "Retry",
  error: "Error",
  apiKeyMissing: "API Key not configured",
};

export const translations: Record<Lang, TranslationDict> = { zh, en };

export function t(lang: Lang, key: keyof TranslationDict): string {
  return (translations[lang][key] as string) || key;
}

export function getSystemLang(): Lang {
  if (typeof window === "undefined") return "zh";
  const stored = localStorage.getItem("mira-lang") as Lang | null;
  if (stored === "zh" || stored === "en") return stored;
  const nav = navigator.language.toLowerCase();
  return nav.startsWith("zh") ? "zh" : "en";
}

export function setLang(lang: Lang) {
  localStorage.setItem("mira-lang", lang);
}
