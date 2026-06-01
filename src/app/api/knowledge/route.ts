import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/store";
import type { CharacterCard, SceneCard, MomentCard, Confidence } from "@/lib/types";

function getEnv() {
  const apiKey = process.env.EXTRACT_API_KEY || process.env.IMAGE_GEN_API_KEY;
  const apiBase = process.env.EXTRACT_BASE_URL || process.env.IMAGE_GEN_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.EXTRACT_MODEL || "gpt-4o-mini";
  return { apiKey, apiBase, model };
}

export async function POST(req: NextRequest) {
  try {
    const { title, author, chapter = 1, language = "zh" } = await req.json();
    if (!title) return NextResponse.json({ error: "Book title required" }, { status: 400 });

    const env = getEnv();
    if (!env.apiKey) {
      return NextResponse.json({ error: "No LLM API key configured" }, { status: 500 });
    }

    const prompt = language === "zh"
      ? `你是一位文学专家。请根据你的知识，列出《${title}》${author ? `（作者：${author}）` : ""}中的：

1. **主要人物**（最多15个）——姓名、别名、角色定位（主角/配角/次要）、外貌描写（面部、发型、服饰、年龄、体型、特征）、性格特点。
2. **重要场景**（最多8个）——场景名称、类型（"atmosphere"氛围描写 或 "spatial-layout"空间布局）、场景描述。
3. **关键情节**（最多8个）——情节名称、简要描述（用于生成插图的视觉提示）。

所有内容都必须标注**置信度**：
- "explicit" = 原著中明确描写/广泛公认的设定
- "inferred" = 根据上下文合理推断
- "unknown" = 无依据，留空

为每个人物和场景提供 **sourceQuotes**（你记忆中的引文或公认描述）和置信度。

只返回 JSON，不要其他文字：
{
  "characters": [{ "name": "...", "aliases": [...], "role": "protagonist", "appearance": { "face": "...", "hair": "...", "clothing": "...", "age": "...", "body": "...", "distinctiveFeatures": [...] }, "personality": [...], "sourceQuotes": [{ "text": "...", "confidence": "explicit" }] }],
  "scenes": [{ "name": "...", "type": "atmosphere", "description": "...", "sourceQuotes": [{ "text": "...", "confidence": "explicit" }] }],
  "moments": [{ "name": "...", "passage": "..." }],
  "sourceNotes": "简短说明你的知识来源"
}`
      : `You are a literary expert. From your knowledge of "${title}"${author ? ` by ${author}` : ""}, list:

1. **Major characters** (up to 15) — name, aliases, role (protagonist/supporting/minor), physical appearance, personality traits.
2. **Important scenes** (up to 8) — name, type ("atmosphere" or "spatial-layout"), description.
3. **Key moments** (up to 8) — name, brief description suitable for illustration prompts.

Include confidence markers for everything:
- "explicit" = explicitly described in the text / widely accepted canon
- "inferred" = reasonably deduced
- "unknown" = no basis, leave empty

Include sourceQuotes with confidence for each character and scene.

Return ONLY JSON:
{
  "characters": [...],
  "scenes": [...],
  "moments": [...],
  "sourceNotes": "brief note on your knowledge source"
}`;

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
      return NextResponse.json({ error: `API error: ${response.status} ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Empty response from LLM" }, { status: 500 });

    const json = JSON.parse(content.replace(/```json\s*|\s*```/g, "").trim());
    const now = Date.now();

    const characters: CharacterCard[] = (json.characters || []).map((c: Record<string, unknown>) => ({
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

    const scenes: SceneCard[] = (json.scenes || []).map((s: Record<string, unknown>) => ({
      id: generateId(),
      name: String(s.name || "Unknown"),
      type: (s.type as SceneCard["type"]) || "atmosphere",
      description: String(s.description || ""),
      chapter: 1,
      sourceQuotes: (s.sourceQuotes || []) as SceneCard["sourceQuotes"],
      imagePrompt: "",
      createdAt: now,
    }));

    const moments: MomentCard[] = (json.moments || []).map((m: Record<string, unknown>) => ({
      id: generateId(),
      name: String(m.name || "Moment"),
      passage: String(m.passage || ""),
      chapter: 1,
      imagePrompt: "",
      createdAt: now,
    }));

    return NextResponse.json({
      characters,
      scenes,
      moments,
      source: "llm" as const,
      sourceNotes: json.sourceNotes || "From LLM training knowledge",
      needsWebSearch: characters.length < 3,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
