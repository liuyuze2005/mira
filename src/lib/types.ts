// ── Confidence & Source Tracing ──
export type Confidence = "explicit" | "inferred" | "unknown";

export interface SourceQuote {
  text: string;
  chapter: number;
  confidence: Confidence;
}

// ── Appearance ──
export interface AppearanceTraits {
  face?: string;
  hair?: string;
  clothing?: string;
  age?: string;
  body?: string;
  distinctiveFeatures?: string[];
}

// ── Core Cards ──
export interface CharacterCard {
  id: string;
  name: string;
  aliases: string[];
  role: "protagonist" | "supporting" | "minor";
  firstMentionChapter?: number;
  lastUpdateChapter?: number;
  chaptersAppearedIn: number[];
  appearance: AppearanceTraits;
  personality: string[];
  sourceQuotes: SourceQuote[];
  imagePrompt: string;
  imageUrl?: string;
  createdAt: number;
}

export interface SceneCard {
  id: string;
  name: string;
  type: "atmosphere" | "spatial-layout";
  description: string;
  chapter: number;
  sourceQuotes: SourceQuote[];
  imagePrompt: string;
  imageUrl?: string;
  createdAt: number;
}

export interface MomentCard {
  id: string;
  name: string;
  passage: string;
  chapter: number;
  imagePrompt: string;
  imageUrl?: string;
  createdAt: number;
}

// ── Chapter Structure ──
export type SectionKind = "front-matter" | "body" | "back-matter" | "unknown";

export interface ChapterSection {
  index: number;          // 1-based chapter number
  title: string;          // chapter title
  kind: SectionKind;      // classification
  text: string;           // full chapter text
  startOffset: number;    // position in source text
  endOffset: number;
}

// ── Book Concept (overview, not per-chapter) ──
export interface BookConcept {
  genre: string;          // e.g. "武侠", "科幻", "literary fiction"
  era: string;            // e.g. "清末民初", "22nd century"
  narrativeStyle: string; // e.g. "第一人称", "多视角", "linear"
  coreCharacters: { name: string; role: string; brief: string }[];
  setting: string;        // e.g. "一个架空的封建王朝", "近未来东京"
  themes: string[];       // e.g. ["成长", "阶级", "命运"]
}

// ── Book Profile ──
export interface BookProfile {
  totalChapters: number;
  chapterTitles: string[];
  style: {
    visualStyle: "realistic" | "illustrated" | "line-art" | "pixel";
    period: string;
    colorPalette: string;
    avoid: string[];
    customPrompt: string;
  };
}

// ── Knowledge Source ──
export type KnowledgeSource = "llm" | "text-extraction";

// ── Book (v1.1 — chapter-aware) ──
export interface Book {
  id: string;
  title: string;
  author: string;
  // Chapters
  chapters: ChapterSection[];
  currentChapter: number;          // user's reading position (0 = not set)
  // Book-level concept
  concept?: BookConcept;
  // Accumulated cards
  characters: CharacterCard[];
  scenes: SceneCard[];
  moments: MomentCard[];
  // Metadata
  profile?: BookProfile;
  knowledgeSource: KnowledgeSource;
  rawText?: string;                // full text for chapter parsing
  createdAt: number;
}

// ── Legacy (for migration) ──
export interface VisualAsset {
  id: string;
  type: "character" | "scene-map" | "key-moment";
  label: string;
  description: string;
  style: "realistic" | "illustrated" | "line-art" | "pixel";
  imageUrl: string | null;
  characterTraits?: string;
  referenceImageUrl?: string;
  createdAt: number;
}

export interface LegacyBook {
  id: string;
  title: string;
  author: string;
  assets: VisualAsset[];
  createdAt: number;
}

export type AssetType = VisualAsset["type"];
export type ImageStyle = VisualAsset["style"];
