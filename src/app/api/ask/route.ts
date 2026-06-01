import { NextRequest, NextResponse } from "next/server";
import type { CharacterCard, SceneCard } from "@/lib/types";

function getEnv() {
  const apiKey = process.env.EXTRACT_API_KEY || process.env.IMAGE_GEN_API_KEY;
  const rawBase = process.env.EXTRACT_BASE_URL || process.env.IMAGE_GEN_BASE_URL || "https://api.openai.com/v1";
  const apiBase = rawBase.replace(/\/chat\/completions\/?$/, "");
  const model = process.env.EXTRACT_MODEL || "gpt-4o-mini";
  return { apiKey, apiBase, model };
}

export async function POST(req: NextRequest) {
  try {
    const { question, selection, bookTitle, bookAuthor, chapterTitle, currentChapter, characters, scenes, language } = await req.json();
    if (!selection || !question) return NextResponse.json({ error: "Missing selection or question" }, { status: 400 });

    const env = getEnv();
    if (!env.apiKey) return NextResponse.json({ error: "No LLM API key configured" }, { status: 500 });

    // Build known characters context
    const knownChars = (characters || []).slice(0, 15).map((c: CharacterCard) =>
      `${c.name}（${c.role === "protagonist" ? "主角" : c.role === "supporting" ? "重要配角" : "次要角色"}）：${c.personality.slice(0, 3).join("，")}`
    ).join("\n");

    const knownScenes = (scenes || []).slice(0, 10).map((s: SceneCard) => s.name).join("、");

    const prompt = `你是 Mira，一个无剧透 AI 阅读助手。
用户正在阅读《${bookTitle}》${bookAuthor ? `（作者：${bookAuthor}）` : ""}。
当前章节：${chapterTitle || `第 ${currentChapter} 章`}

已知角色：
${knownChars || "暂无"}

已知场景：${knownScenes || "暂无"}

用户选中了以下文本：
"""
${selection.slice(0, 1500)}
"""

用户的提问：${question}

请回答用户的问题。严格遵循以下规则：
1. 只能基于已读内容（已知角色、已知场景、用户选中的文本）回答
2. 绝对不透露后续剧情、人物命运、身份反转、结局
3. 如果问题涉及后文信息，回答"目前读到这里还无法确定"
4. 回答简洁，2-5 句话即可
5. 如果从文本中能分析出视觉细节，尽量描述具体

${language === "zh" ? "用中文回答。" : "Answer in English."}`;

    const response = await fetch(`${env.apiBase}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.apiKey}` },
      body: JSON.stringify({
        model: env.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "抱歉，无法回答。";

    // Check if the answer contains a spoiler warning
    const spoilerPatterns = [/无法确定/, /读到这里还/, /目前还不/, /后续章节/, /不剧透/];
    const spoilerWarning = spoilerPatterns.some(p => p.test(answer)) ? null : undefined;

    return NextResponse.json({ answer, spoilerWarning });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
