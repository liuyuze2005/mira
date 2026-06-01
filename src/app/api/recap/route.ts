import { NextRequest, NextResponse } from "next/server";
import type { CharacterCard, SceneCard, MomentCard } from "@/lib/types";

function getEnv() {
  const apiKey = process.env.EXTRACT_API_KEY || process.env.IMAGE_GEN_API_KEY;
  const rawBase = process.env.EXTRACT_BASE_URL || process.env.IMAGE_GEN_BASE_URL || "https://api.openai.com/v1";
  const apiBase = rawBase.replace(/\/chat\/completions\/?$/, "");
  const model = process.env.EXTRACT_MODEL || "gpt-4o-mini";
  return { apiKey, apiBase, model };
}

export async function POST(req: NextRequest) {
  try {
    const { bookTitle, bookAuthor, currentChapter, chaptersRead, characters, scenes, moments, language } = await req.json();
    if (!bookTitle) return NextResponse.json({ error: "Missing bookTitle" }, { status: 400 });

    const env = getEnv();
    if (!env.apiKey) return NextResponse.json({ error: "No LLM API key configured" }, { status: 500 });

    // Characters that appeared
    const activeChars = (characters || []).filter((c: CharacterCard) =>
      c.chaptersAppearedIn?.some((ch: number) => ch <= (currentChapter || 0))
    ).slice(0, 10);

    const charList = activeChars.map((c: CharacterCard) =>
      `- ${c.name}：${c.role === "protagonist" ? "主角" : c.role === "supporting" ? "重要配角" : "次要"}，${c.personality.slice(0, 2).join("，") || "暂无性格描述"}`
    ).join("\n");

    const sceneList = (scenes || []).filter((s: SceneCard) => s.chapter <= (currentChapter || 0)).slice(0, 6)
      .map((s: SceneCard) => s.name).join("、") || "暂无";

    const momentList = (moments || []).filter((m: MomentCard) => m.chapter <= (currentChapter || 0)).slice(0, 5)
      .map((m: MomentCard) => m.name).join(" / ") || "暂无";

    const chaptersText = (chaptersRead || []).slice(0, 20).map((c: { title: string; text: string }) =>
      `【${c.title}】${c.text.slice(0, 800)}`
    ).join("\n").slice(0, 12000);

    const prompt = `你是 Mira，一个无剧透阅读回顾助手。

用户正在阅读《${bookTitle}》${bookAuthor ? `（作者：${bookAuthor}）` : ""}。
用户当前读到第 ${currentChapter} 章。

请基于以下内容生成一个"继续阅读前回顾"。严格遵守无剧透规则：只能总结用户已读内容，不能透露后续剧情。

已读章节内容：
${chaptersText}

当前已知人物：
${charList || "暂无"}

已知场景：${sceneList}
最近重要情节：${momentList}

请返回以下 JSON（只返回 JSON）：
{
  "summary": "无剧透概要（2-4句话，回顾到目前为止发生了什么）",
  "recentCharacters": ["人物名：当前状态描述"],
  "currentLocation": "用户当前所在的位置",
  "unresolvedQuestions": ["尚未解答的疑问"],
  "visualCues": ["接下来阅读时值得注意的视觉线索"],
  "spoilerSafe": true
}

${language === "zh" ? "所有内容用中文。" : "All content in English."}`;

    const response = await fetch(`${env.apiBase}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.apiKey}` },
      body: JSON.stringify({
        model: env.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Empty response" }, { status: 500 });

    const json = JSON.parse(content.replace(/```json\s*|\s*```/g, "").trim());

    return NextResponse.json({
      summary: json.summary || "",
      recentCharacters: json.recentCharacters || [],
      currentLocation: json.currentLocation || "",
      unresolvedQuestions: json.unresolvedQuestions || [],
      visualCues: json.visualCues || [],
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
