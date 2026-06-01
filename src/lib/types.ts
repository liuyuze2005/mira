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

// ── Core Cards (v1.0) ──
export interface CharacterCard {
  id: string;
  name: string;
  aliases: string[];
  role: "protagonist" | "supporting" | "minor";
  firstMentionChapter?: number;
  lastUpdateChapter?: number;
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
};

// ── Knowledge Source ──
export type KnowledgeSource = "llm" | "text-extraction";

// ── Book (v1.0 — replaces old VisualAsset-based model) ──
export interface Book {
  id: string;
  title: string;
  author: string;
  characters: CharacterCard[];
  scenes: SceneCard[];
  moments: MomentCard[];
  profile?: BookProfile;
  knowledgeSource: KnowledgeSource;
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
