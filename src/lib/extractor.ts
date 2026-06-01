import type { CharacterCard, SceneCard, MomentCard, Confidence } from "./types";

// ── Text Chunking ──
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

// ── Merge duplicate characters ──
export function mergeCharacterCards(cards: CharacterCard[]): CharacterCard[] {
  const merged = new Map<string, CharacterCard>();
  for (const card of cards) {
    const key = card.name.toLowerCase();
    if (merged.has(key)) {
      const existing = merged.get(key)!;
      existing.aliases = Array.from(new Set([...existing.aliases, ...card.aliases]));
      for (const [trait, value] of Object.entries(card.appearance)) {
        if (value && !(existing.appearance as Record<string, unknown>)[trait]) {
          (existing.appearance as Record<string, unknown>)[trait] = value;
        }
      }
      existing.personality = [...new Set([...existing.personality, ...card.personality])];
      existing.sourceQuotes = [...existing.sourceQuotes, ...card.sourceQuotes];
      if (existing.role === "minor" && card.role !== "minor") existing.role = card.role;
      if (card.firstMentionChapter && (!existing.firstMentionChapter || card.firstMentionChapter < existing.firstMentionChapter))
        existing.firstMentionChapter = card.firstMentionChapter;
      if (card.lastUpdateChapter && (!existing.lastUpdateChapter || card.lastUpdateChapter > existing.lastUpdateChapter))
        existing.lastUpdateChapter = card.lastUpdateChapter;
    } else {
      merged.set(key, { ...card });
    }
  }
  return Array.from(merged.values());
}

// ── Merge duplicate scenes ──
export function mergeSceneCards(cards: SceneCard[]): SceneCard[] {
  const merged = new Map<string, SceneCard>();
  for (const c of cards) {
    const key = c.name.toLowerCase();
    if (merged.has(key)) {
      const existing = merged.get(key)!;
      existing.sourceQuotes = [...existing.sourceQuotes, ...c.sourceQuotes];
      if (!existing.description || existing.description.length < c.description.length)
        existing.description = c.description;
    } else {
      merged.set(key, { ...c });
    }
  }
  return Array.from(merged.values());
}

// ── Filter by chapter (no-spoiler) ──
export function filterByChapter(
  characters: CharacterCard[],
  scenes: SceneCard[],
  moments: MomentCard[],
  maxChapter: number
) {
  return {
    characters: characters.filter(c => !c.firstMentionChapter || c.firstMentionChapter <= maxChapter),
    scenes: scenes.filter(s => s.chapter <= maxChapter),
    moments: moments.filter(m => m.chapter <= maxChapter),
  };
}

// ── Build image prompt from character card ──
export function buildCharacterPrompt(card: CharacterCard, style?: { visualStyle?: string; period?: string; colorPalette?: string; avoid?: string[] }): string {
  const a = card.appearance;
  const traits = [
    a.face, a.hair, a.clothing, a.age, a.body,
    ...(a.distinctiveFeatures || []),
  ].filter(Boolean).join(", ");
  const neg = style?.avoid?.length ? `. Avoid: ${style.avoid.join(", ")}` : "";
  const palette = style?.colorPalette ? `. Color palette: ${style.colorPalette}` : "";
  const era = style?.period ? `. Time period: ${style.period}` : "";
  return `Character portrait of "${card.name}": ${card.personality.slice(0, 3).join(", ")} personality. Appearance: ${traits}. ${style?.visualStyle || "illustrated"} style${era}${palette}${neg}`;
}

// ── Build image prompt from scene card ──
export function buildScenePrompt(card: SceneCard, style?: { visualStyle?: string; period?: string; colorPalette?: string; avoid?: string[] }): string {
  const neg = style?.avoid?.length ? ` Avoid: ${style.avoid.join(", ")}` : "";
  const palette = style?.colorPalette ? ` Color palette: ${style.colorPalette}` : "";
  if (card.type === "spatial-layout") {
    return `Top-down floor plan / isometric schematic layout of "${card.name}": ${card.description}. Architectural reference map, labeled areas, clean diagrammatic style${neg}`;
  }
  return `Atmospheric scene of "${card.name}": ${card.description}. ${style?.visualStyle || "illustrated"} style${style?.period ? `. Time period: ${style.period}` : ""}${palette}${neg}`;
}

// ── Build image prompt from moment card ──
export function buildMomentPrompt(card: MomentCard, style?: { visualStyle?: string; period?: string; colorPalette?: string; avoid?: string[] }): string {
  const neg = style?.avoid?.length ? ` Avoid: ${style.avoid.join(", ")}` : "";
  const palette = style?.colorPalette ? ` Color palette: ${style.colorPalette}` : "";
  return `Story illustration of "${card.name}": ${card.passage}. Dramatic composition, storytelling focus. ${style?.visualStyle || "illustrated"} style${style?.period ? `. Time period: ${style.period}` : ""}${palette}${neg}`;
}

// ── Sort cards by chapter ──
export function sortByChapter<T extends { chapter?: number; firstMentionChapter?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.chapter ?? a.firstMentionChapter ?? 999) - (b.chapter ?? b.firstMentionChapter ?? 999));
}
