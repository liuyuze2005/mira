import { NextRequest, NextResponse } from "next/server";
import { chunkText, mergeCharacterCards, mergeSceneCards } from "@/lib/extractor";
import { generateId } from "@/lib/store";
import type { CharacterCard, SceneCard, MomentCard } from "@/lib/types";

const CHUNK_SIZE = 4000;
const MAX_CONCURRENT = 3;

function getEnv() {
  const apiKey = process.env.EXTRACT_API_KEY || process.env.IMAGE_GEN_API_KEY;
  const rawBase = process.env.EXTRACT_BASE_URL || process.env.IMAGE_GEN_BASE_URL || "https://api.openai.com/v1";
  const apiBase = rawBase.replace(/\/chat\/completions\/?$/, "");
  const model = process.env.EXTRACT_MODEL || "gpt-4o-mini";
  return { apiKey, apiBase, model };
}

async function extractFromChunk(
  chunk: string,
  chunkIndex: number,
  totalChunks: number,
  currentChapter: number,
  env: ReturnType<typeof getEnv>
): Promise<{ characters: CharacterCard[]; scenes: SceneCard[]; moments: MomentCard[] }> {
  const prompt = `You are a literary analyst. From chapter ${currentChapter} of a book (chunk ${chunkIndex + 1}/${totalChunks}), extract ONLY what appears in THIS chapter:

1. **Characters** — name, aliases, role (protagonist/supporting/minor), physical appearance (face, hair, clothing, age, body, distinctive features), personality traits.
2. **Scenes** — location name, type ("atmosphere" or "spatial-layout"), description.
3. **Key Moments** — important plot events with strong visual imagery. Include the original text passage.

For EVERY field, include a **confidence** marker:
- "explicit" — directly stated
- "inferred" — reasonably deduced

Include **sourceQuotes** with confidence for each character and scene.

Return ONLY valid JSON:
{
  "characters": [
    {
      "name": "...", "aliases": [...], "role": "protagonist",
      "appearance": { "face": "...", "hair": "...", "clothing": "...", "age": "...", "body": "...", "distinctiveFeatures": [...] },
      "personality": [...],
      "sourceQuotes": [{ "text": "...", "confidence": "explicit" }]
    }
  ],
  "scenes": [
    { "name": "...", "type": "atmosphere", "description": "...", "sourceQuotes": [...] }
  ],
  "moments": [
    { "name": "...", "passage": "original text up to 200 chars" }
  ]
}

Max 5 characters, 3 scenes, 3 moments per chunk. Use the source language for output.

CHAPTER ${currentChapter} TEXT:
${chunk.slice(0, CHUNK_SIZE)}`;

  const response = await fetch(`${env.apiBase}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.apiKey}` },
    body: JSON.stringify({
      model: env.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from LLM");

  const json = JSON.parse(content.replace(/```json\s*|\s*```/g, "").trim());
  const now = Date.now();

  const chars: CharacterCard[] = (json.characters || []).map((c: Record<string, unknown>) => ({
    id: generateId(),
    name: String(c.name || "Unknown"),
    aliases: (c.aliases as string[]) || [],
    role: (c.role as CharacterCard["role"]) || "minor",
    firstMentionChapter: currentChapter,
    chaptersAppearedIn: [currentChapter],
    appearance: (c.appearance || {}) as CharacterCard["appearance"],
    personality: (c.personality as string[]) || [],
    sourceQuotes: (c.sourceQuotes || []) as CharacterCard["sourceQuotes"],
    imagePrompt: "",
    createdAt: now,
  }));

  const scn: SceneCard[] = (json.scenes || []).map((s: Record<string, unknown>) => ({
    id: generateId(),
    name: String(s.name || "Unknown"),
    type: (s.type as SceneCard["type"]) || "atmosphere",
    description: String(s.description || ""),
    chapter: currentChapter,
    sourceQuotes: (s.sourceQuotes || []) as SceneCard["sourceQuotes"],
    imagePrompt: "",
    createdAt: now,
  }));

  const mom: MomentCard[] = (json.moments || []).map((m: Record<string, unknown>) => ({
    id: generateId(),
    name: String(m.name || "Moment"),
    passage: String(m.passage || ""),
    chapter: currentChapter,
    imagePrompt: "",
    createdAt: now,
  }));

  return { characters: chars, scenes: scn, moments: mom };
}

// ── Merge extracted data with existing cards ──
function mergeWithExisting(
  existing: CharacterCard[],
  newChars: CharacterCard[],
  chapter: number
): CharacterCard[] {
  const map = new Map<string, CharacterCard>();

  // Index existing by lowercase name
  for (const c of existing) {
    map.set(c.name.toLowerCase(), { ...c });
  }

  for (const nc of newChars) {
    const key = nc.name.toLowerCase();
    if (map.has(key)) {
      const ex = map.get(key)!;
      // Update appearance (new info takes priority for explicit)
      for (const [trait, value] of Object.entries(nc.appearance)) {
        if (value && !(ex.appearance as Record<string, unknown>)[trait]) {
          (ex.appearance as Record<string, unknown>)[trait] = value;
        }
      }
      // Merge personality
      ex.personality = [...new Set([...ex.personality, ...nc.personality])];
      // Merge source quotes
      ex.sourceQuotes = [...ex.sourceQuotes, ...nc.sourceQuotes];
      // Track chapters
      if (!ex.chaptersAppearedIn.includes(chapter)) {
        ex.chaptersAppearedIn.push(chapter);
      }
      ex.lastUpdateChapter = chapter;
      // Promote role if new has higher
      if (ex.role === "minor" && nc.role !== "minor") ex.role = nc.role;
      if (ex.role === "supporting" && nc.role === "protagonist") ex.role = nc.role;
    } else {
      map.set(key, nc);
    }
  }

  return Array.from(map.values());
}

export async function POST(req: NextRequest) {
  try {
    const {
      text,
      chapter = 1,
      existingCharacters,
      pipeline = true,
    } = await req.json();

    if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

    const env = getEnv();
    if (!env.apiKey) {
      return NextResponse.json({ error: "No extraction API key configured" }, { status: 500 });
    }

    const existingChars: CharacterCard[] = existingCharacters || [];

    if (!pipeline) {
      const maxInput = 60_000;
      const result = await extractFromChunk(text.slice(0, maxInput), 0, 1, chapter, env);
      const mergedChars = mergeWithExisting(existingChars, result.characters, chapter);
      return NextResponse.json({
        characters: mergedChars,
        scenes: result.scenes,
        moments: result.moments,
        pipeline: false,
      });
    }

    // Pipeline mode: chunk within chapter → extract → merge
    const chunks = chunkText(text, CHUNK_SIZE);
    if (chunks.length === 0) {
      return NextResponse.json({ characters: [], scenes: [], moments: [], pipeline: true, totalChunks: 0 });
    }

    const allCharacters: CharacterCard[] = [];
    const allScenes: SceneCard[] = [];
    const allMoments: MomentCard[] = [];

    for (let i = 0; i < chunks.length; i += MAX_CONCURRENT) {
      const batch = chunks.slice(i, i + MAX_CONCURRENT);
      const results = await Promise.all(
        batch.map((chunk, bi) => extractFromChunk(chunk, i + bi, chunks.length, chapter, env))
      );
      for (const r of results) {
        allCharacters.push(...r.characters);
        allScenes.push(...r.scenes);
        allMoments.push(...r.moments);
      }
    }

    const mergedChars = mergeCharacterCards(allCharacters);
    // Merge with existing characters from previous chapters
    const finalChars = mergeWithExisting(existingChars, mergedChars, chapter);
    const mergedScenes = mergeSceneCards(allScenes);

    return NextResponse.json({
      characters: finalChars,
      scenes: mergedScenes,
      moments: allMoments,
      pipeline: true,
      totalChunks: chunks.length,
      chapter,
      newCharsThisChapter: allCharacters.length,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
