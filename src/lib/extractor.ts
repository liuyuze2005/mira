// CharacterCard types with source tracing and confidence

export type Confidence = "explicit" | "inferred" | "unknown";

export interface SourceQuote {
  text: string;
  chapter: number;
  confidence: Confidence;
}

export interface AppearanceTraits {
  face?: string;
  hair?: string;
  clothing?: string;
  age?: string;
  body?: string;
  distinctiveFeatures?: string[];
}

export interface CharacterCard {
  id: string;
  name: string;
  aliases: string[];
  role?: "protagonist" | "supporting" | "minor";
  firstMentionChapter?: number;
  lastUpdateChapter?: number;
  appearance: AppearanceTraits & { [key: string]: string | string[] | undefined };
  personality: string[];
  sourceQuotes: SourceQuote[];
  imagePrompt: string;
  imageUrl?: string;
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
}

export interface MomentCard {
  id: string;
  name: string;
  passage: string;
  chapter: number;
  imagePrompt: string;
  imageUrl?: string;
}

export interface ExtractionResult {
  characters: CharacterCard[];
  scenes: SceneCard[];
  moments: MomentCard[];
}

// Chunk text into segments of ~maxLen characters, breaking at paragraph boundaries
export function chunkText(text: string, maxLen = 3000): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if (current.length + p.length > maxLen && current.length > 500) {
      chunks.push(current.trim());
      current = p;
    } else {
      current += (current ? "\n\n" : "") + p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// Merge duplicate characters from multiple chunks
export function mergeCharacterCards(cards: CharacterCard[]): CharacterCard[] {
  const merged = new Map<string, CharacterCard>();

  for (const card of cards) {
    const key = card.name.toLowerCase();
    if (merged.has(key)) {
      const existing = merged.get(key)!;
      // Merge aliases
      existing.aliases = Array.from(new Set([...existing.aliases, ...card.aliases]));
      // Merge appearance traits (keep explicit over inferred)
      for (const [trait, value] of Object.entries(card.appearance)) {
        if (value && !existing.appearance[trait]) {
          existing.appearance[trait] = value;
        }
      }
      // Merge personality
      existing.personality = [...new Set([...existing.personality, ...card.personality])];
      // Merge source quotes
      existing.sourceQuotes = [...existing.sourceQuotes, ...card.sourceQuotes];
      // Update chapter info
      if (card.firstMentionChapter && (!existing.firstMentionChapter || card.firstMentionChapter < existing.firstMentionChapter)) {
        existing.firstMentionChapter = card.firstMentionChapter;
      }
      if (card.lastUpdateChapter && (!existing.lastUpdateChapter || card.lastUpdateChapter > existing.lastUpdateChapter)) {
        existing.lastUpdateChapter = card.lastUpdateChapter;
      }
    } else {
      merged.set(key, { ...card });
    }
  }

  return Array.from(merged.values());
}

// Filter extraction results by chapter (no-spoiler mode)
export function filterByChapter(result: ExtractionResult, maxChapter: number): ExtractionResult {
  return {
    characters: result.characters.filter(c => (c.firstMentionChapter || 0) <= maxChapter),
    scenes: result.scenes.filter(s => s.chapter <= maxChapter),
    moments: result.moments.filter(m => m.chapter <= maxChapter),
  };
}
