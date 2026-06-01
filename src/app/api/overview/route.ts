import { NextRequest, NextResponse } from "next/server";
import type { BookConcept } from "@/lib/types";

function getEnv() {
  const apiKey = process.env.EXTRACT_API_KEY || process.env.IMAGE_GEN_API_KEY;
  const rawBase = process.env.EXTRACT_BASE_URL || process.env.IMAGE_GEN_BASE_URL || "https://api.openai.com/v1";
  const apiBase = rawBase.replace(/\/chat\/completions\/?$/, "");
  const model = process.env.EXTRACT_MODEL || "gpt-4o-mini";
  return { apiKey, apiBase, model };
}

export async function POST(req: NextRequest) {
  try {
    const { title, author, sampleText, language = "zh" } = await req.json();
    if (!title) return NextResponse.json({ error: "Book title required" }, { status: 400 });

    const env = getEnv();
    if (!env.apiKey) return NextResponse.json({ error: "No LLM API key configured" }, { status: 500 });

    // Use first ~3000 chars of first body chapter as sample
    const textSample = (sampleText || "").slice(0, 3000);

    const prompt = language === "zh"
      ? `你是一位文学编辑。请根据以下信息，为《${title}》${author ? `（作者：${author}）` : ""}建立一个总体概念。

${textSample ? `以下是正文第一章的开头片段（仅作参考，帮助你判断题材和风格）：\n${textSample}\n` : ""}

请返回以下 JSON（只返回 JSON，不要其他文字）：
{
  "genre": "题材类型（如：武侠、科幻、现实主义文学、悬疑推理、奇幻、历史小说等）",
  "era": "时代背景简述（如：清末民初、近未来东京、架空唐朝等）",
  "narrativeStyle": "叙事风格（如：第三人称线性叙事、第一人称倒叙、多视角POV等）",
  "coreCharacters": [
    { "name": "主要角色名", "role": "角色定位（主角/反派/核心配角）", "brief": "一句话角色简介" }
  ],
  "setting": "世界观/场景简述（如：一个架空的封建王朝；当代上海弄堂；22世纪火星殖民地）",
  "themes": ["主题1", "主题2", "主题3"]
}

注意事项：
- coreCharacters 只列最重要的 3-6 个角色
- themes 列出 2-5 个核心主题
- 如果你对这本书有足够的知识，优先使用你的知识；文本片段仅用于补充判断` 
      : `You are a literary editor. Build an overall concept for "${title}"${author ? ` by ${author}` : ""}.

${textSample ? `Here's a sample from the first chapter for context:\n${textSample}\n` : ""}

Return ONLY JSON:
{
  "genre": "genre (e.g., sci-fi, literary fiction, mystery, fantasy, historical fiction)",
  "era": "time period and setting context",
  "narrativeStyle": "narrative style (e.g., third-person linear, first-person, multi-POV)",
  "coreCharacters": [
    { "name": "Character name", "role": "protagonist/antagonist/key supporting", "brief": "One-line description" }
  ],
  "setting": "world/location overview",
  "themes": ["theme1", "theme2"]
}

Use your knowledge of the book primarily. The text sample is supplementary.`;

    const response = await fetch(`${env.apiBase}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.apiKey}` },
      body: JSON.stringify({
        model: env.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `API error: ${response.status} ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Empty response" }, { status: 500 });

    const json = JSON.parse(content.replace(/```json\s*|\s*```/g, "").trim());

    const concept: BookConcept = {
      genre: json.genre || "Unknown",
      era: json.era || "",
      narrativeStyle: json.narrativeStyle || "",
      coreCharacters: (json.coreCharacters || []).map((c: Record<string, string>) => ({
        name: c.name || "",
        role: c.role || "",
        brief: c.brief || "",
      })),
      setting: json.setting || "",
      themes: json.themes || [],
    };

    return NextResponse.json(concept);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
