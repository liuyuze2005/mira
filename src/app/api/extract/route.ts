import { NextRequest, NextResponse } from "next/server";
import { chunkText, mergeCharacterCards, mergeSceneCards } from "@/lib/extractor";
import { generateId } from "@/lib/store";
import type { CharacterCard, SceneCard, MomentCard, Confidence } from "@/lib/types";

// ── Config ──
const CHUNK_SIZE = 4000;
const MAX_CONCURRENT = 3;

function getEnv() {
  const apiKey = process.env.EXTRACT_API_KEY || process.env.IMAGE_GEN_API_KEY;
  const rawBase = process.env.EXTRACT_BASE_URL || process.env.IMAGE_GEN_BASE_URL || "https://api.openai.com/v1";
  const apiBase = rawBase.replace(/\/chat\/completions\/?$/, "");
  const model = process.env.EXTRACT_MODEL || "gpt-4o-mini";
  return { apiKey, apiBase, model };
}

// ── LLM call with confidence-aware prompt ──
async function extractFromChunk(
  chunk: string,
  chunkIndex: number,
  totalChunks: number,
  env: ReturnType<typeof getEnv>
): Promise<{ characters: CharacterCard[]; scenes: SceneCard[]; moments: MomentCard[] }> {
  const prompt = `You are a literary analyst. From the following book excerpt (chunk ${chunkIndex + 1}/${totalChunks}), extract:

1. **Characters** — name, aliases, role (protagonist/supporting/minor), physical appearance (face, hair, clothing, age, body, distinctive features), personality traits.
2. **Scenes** — location name, type ("atmosphere" for mood-setting descriptions or "spatial-layout" for architectural/spatial descriptions with layout info), description.
3. **Key Moments** — important plot events with strong visual imagery. Include the original text passage.

For EVERY field you output, include a **confidence** marker:
- "explicit" — directly stated in the text (e.g., "he was tall" → hair color explicit)
- "inferred" — reasonably deduced from context (e.g., "she wore silk" → wealthy, elegant)
- "unknown" — no basis in the text, leave the field empty

Also include **sourceQuotes** for each character and scene: a short excerpt from the text that supports your extraction, with the confidence level.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "characters": [
    {
      "name": "Character Name",
      "aliases": ["alias1"],
      "role": "protagonist",
      "appearance": { "face": "...", "hair": "...", "clothing": "...", "age": "...", "body": "...", "distinctiveFeatures": ["scar on left cheek"] },
      "personality": ["brave", "impulsive"],
      "sourceQuotes": [{ "text": "...", "confidence": "explicit" }]
    }
  ],
  "scenes": [
    {
      "name": "Scene Name",
      "type": "atmosphere",
      "description": "...",
      "sourceQuotes": [{ "text": "...", "confidence": "explicit" }]
    }
  ],
  "moments": [
    {
      "name": "Moment Name",
      "passage": "original text passage up to 200 characters"
    }
  ]
}

Max 5 characters, 3 scenes, 3 moments per chunk. Use the source language of the text for all output.

BOOK TEXT:
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

  // Enrich with IDs and chapter info
  const now = Date.now();
  const chars: CharacterCard[] = (json.characters || []).map((c: Record<string, unknown>) => ({
    id: generateId(),
    name: String(c.name || "Unknown"),
    aliases: (c.aliases as string[]) || [],
    role: (c.role as CharacterCard["role"]) || "minor",
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
    chapter: chunkIndex + 1,
    sourceQuotes: (s.sourceQuotes || []) as SceneCard["sourceQuotes"],
    imagePrompt: "",
    createdAt: now,
  }));

  const mom: MomentCard[] = (json.moments || []).map((m: Record<string, unknown>) => ({
    id: generateId(),
    name: String(m.name || "Moment"),
    passage: String(m.passage || ""),
    chapter: chunkIndex + 1,
    imagePrompt: "",
    createdAt: now,
  }));

  return { characters: chars, scenes: scn, moments: mom };
}

// ── POST: single-pass or pipeline ──
export async function POST(req: NextRequest) {
  try {
    const { text, pipeline = true, chapter } = await req.json();
    if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

    const env = getEnv();
    if (!env.apiKey) {
      return NextResponse.json({ error: "No extraction API key configured" }, { status: 500 });
    }

    const currentChapter = chapter ?? 1;

    if (!pipeline) {
      // Single pass (legacy mode)
      const maxInput = 60_000;
      const inputText = text.length > maxInput ? text.slice(0, maxInput) : text;
      const result = await extractFromChunk(inputText, 0, 1, env);
      return NextResponse.json({
        characters: result.characters.map(c => ({ ...c, firstMentionChapter: currentChapter })),
        scenes: result.scenes.map(s => ({ ...s, chapter: currentChapter })),
        moments: result.moments.map(m => ({ ...m, chapter: currentChapter })),
        pipeline: false,
      });
    }

    // ── Pipeline mode: chunk → extract → merge ──
    const chunks = chunkText(text, CHUNK_SIZE);
    if (chunks.length === 0) {
      return NextResponse.json({ characters: [], scenes: [], moments: [], pipeline: true, totalChunks: 0 });
    }

    // Extract chunks in parallel batches
    const allCharacters: CharacterCard[] = [];
    const allScenes: SceneCard[] = [];
    const allMoments: MomentCard[] = [];

    for (let i = 0; i < chunks.length; i += MAX_CONCURRENT) {
      const batch = chunks.slice(i, i + MAX_CONCURRENT);
      const results = await Promise.all(
        batch.map((chunk, bi) => extractFromChunk(chunk, i + bi, chunks.length, env))
      );
      for (const r of results) {
        allCharacters.push(...r.characters);
        allScenes.push(...r.scenes);
        allMoments.push(...r.moments);
      }
    }

    // Merge & deduplicate
    const mergedCharacters = mergeCharacterCards(allCharacters);
    const mergedScenes = mergeSceneCards(allScenes);

    return NextResponse.json({
      characters: mergedCharacters,
      scenes: mergedScenes,
      moments: allMoments,
      pipeline: true,
      totalChunks: chunks.length,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
