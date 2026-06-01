export type Lang = "zh" | "en";

export interface TranslationDict {
  appName: string;
  tagline: string;
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
  characterGallery: string;
  characterDesc: string;
  sceneMaps: string;
  sceneMapsDesc: string;
  keyMoments: string;
  keyMomentsDesc: string;
  addCharacter: string;
  addSceneMap: string;
  addKeyMoment: string;
  name_: string;
  description: string;
  style: string;
  illustrated: string;
  realistic: string;
  lineArt: string;
  pixel: string;
  saveGenerate: string;
  generating: string;
  noImage: string;
  noAssets: string;
  styleDesc: Record<string, string>;
  uploadBook: string;
  uploadDesc: string;
  dragDrop: string;
  parsing: string;
  parseDone: string;
  extractBtn: string;
  extracting: string;
  extractionResults: string;
  characters: string;
  scenes: string;
  moments: string;
  approveGenerate: string;
  generateAll: string;
  readMode: string;
  libraryMode: string;
  readingView: string;
  close: string;
  assets: string;
  images: string;
  loading: string;
  cancel: string;
  error: string;
  apiKeyMissing: string;
}

const zh: TranslationDict = {
  appName: "米拉",
  tagline: "心象阅读助手",
  newBook: "+ 新建书籍",
  addBook: "添加书籍",
  bookTitle: "书名",
  author: "作者",
  addToLibrary: "加入书库",
  yourLibrary: "我的书库",
  libraryEmpty: "书库空空如也",
  libraryEmptyDesc: "添加一本书，开始搭建你的视觉阅读助手。",
  addFirstBook: "添加第一本书",
  deleteBook: "删除",
  confirmDelete: "确定删除这本书及所有视觉资产？",
  characterGallery: "人物画廊",
  characterDesc: "粘贴人物描写，生成角色肖像。",
  sceneMaps: "场景地图",
  sceneMapsDesc: "粘贴空间描写，生成立面示意图。",
  keyMoments: "关键情节",
  keyMomentsDesc: "粘贴情节段落，生成场景插图。",
  addCharacter: "+ 添加人物",
  addSceneMap: "+ 添加场景",
  addKeyMoment: "+ 添加情节",
  name_: "名称",
  description: "描写",
  style: "风格",
  illustrated: "生动插画（默认）",
  realistic: "写实",
  lineArt: "极简线稿",
  pixel: "像素风",
  saveGenerate: "保存并生成图片",
  generating: "生成中…",
  noImage: "暂无图片",
  noAssets: "还没有任何资产，点击「添加」开始。",
  styleDesc: {
    realistic: "照片级写实，细节丰富，电影感光照",
    illustrated: "生动插画风格，暖色调，笔触感",
    "line-art": "极简线稿，干净墨线，漫画速写风",
    pixel: "像素艺术，16位复古游戏风",
  },
  uploadBook: "导入电子书",
  uploadDesc: "上传 epub / txt / pdf 文件，自动提取文本。",
  dragDrop: "拖拽文件到此处，或点击选择",
  parsing: "解析中…",
  parseDone: "解析完成",
  extractBtn: "AI 智能提取",
  extracting: "提取中…",
  extractionResults: "提取结果",
  characters: "人物",
  scenes: "场景",
  moments: "情节",
  approveGenerate: "确认并生成图片",
  generateAll: "一键生成全部",
  readMode: "阅读模式",
  libraryMode: "书库",
  readingView: "阅读视图",
  close: "关闭",
  assets: "个资产",
  images: "张图片",
  loading: "加载中…",
  cancel: "取消",
  error: "出错了",
  apiKeyMissing: "未配置 API Key",
};

const en: TranslationDict = {
  appName: "Mira",
  tagline: "Visual Reading Companion",
  newBook: "+ New Book",
  addBook: "Add a Book",
  bookTitle: "Book Title",
  author: "Author",
  addToLibrary: "Add to Library",
  yourLibrary: "Your Library",
  libraryEmpty: "Your library is empty",
  libraryEmptyDesc: "Add a book to start building your visual reading companion.",
  addFirstBook: "Add Your First Book",
  deleteBook: "Delete",
  confirmDelete: "Delete this book and all its visual assets?",
  characterGallery: "Character Gallery",
  characterDesc: "Paste a character description to generate a portrait.",
  sceneMaps: "Scene Maps",
  sceneMapsDesc: "Paste a spatial description to generate a layout diagram.",
  keyMoments: "Key Moments",
  keyMomentsDesc: "Paste a plot paragraph to generate a scene illustration.",
  addCharacter: "+ Add Character",
  addSceneMap: "+ Add Scene",
  addKeyMoment: "+ Add Moment",
  name_: "Name",
  description: "Description",
  style: "Style",
  illustrated: "Illustrated (default)",
  realistic: "Realistic",
  lineArt: "Minimal Line Art",
  pixel: "Pixel Art",
  saveGenerate: "Save & Generate Image",
  generating: "Generating…",
  noImage: "No image",
  noAssets: "No assets yet.",
  styleDesc: {
    realistic: "Photorealistic, detailed, cinematic lighting",
    illustrated: "Vivid book illustration style, warm colors",
    "line-art": "Minimalist line art, clean ink lines, manga sketch",
    pixel: "Pixel art, 16-bit retro game style",
  },
  uploadBook: "Import E-book",
  uploadDesc: "Upload epub / txt / pdf to extract text automatically.",
  dragDrop: "Drag & drop file here, or click to select",
  parsing: "Parsing…",
  parseDone: "Parsing complete",
  extractBtn: "AI Extract",
  extracting: "Extracting…",
  extractionResults: "Extraction Results",
  characters: "Characters",
  scenes: "Scenes",
  moments: "Moments",
  approveGenerate: "Confirm & Generate Images",
  generateAll: "Generate All",
  readMode: "Reading Mode",
  libraryMode: "Library",
  readingView: "Reading View",
  close: "Close",
  assets: "assets",
  images: "images",
  loading: "Loading…",
  cancel: "Cancel",
  error: "Error",
  apiKeyMissing: "API Key not configured",
};

export const translations: Record<Lang, TranslationDict> = { zh, en };

export function t(lang: Lang, key: keyof TranslationDict): string {
  return translations[lang][key] as string;
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
