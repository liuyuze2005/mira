import { NextRequest, NextResponse } from "next/server";
import type { MapGraph, MapNode, MapEdge, ChapterSection } from "@/lib/types";
import { generateId } from "@/lib/store";

function getEnv() {
  const apiKey = process.env.EXTRACT_API_KEY || process.env.IMAGE_GEN_API_KEY;
  const rawBase = process.env.EXTRACT_BASE_URL || process.env.IMAGE_GEN_BASE_URL || "https://api.openai.com/v1";
  const apiBase = rawBase.replace(/\/chat\/completions\/?$/, "");
  const model = process.env.EXTRACT_MODEL || "gpt-4o-mini";
  return { apiKey, apiBase, model };
}

export async function POST(req: NextRequest) {
  try {
    const { chapters, currentChapter, existingMap, language = "zh" } = await req.json();
    if (!chapters?.length) return NextResponse.json({ error: "No chapters provided" }, { status: 400 });

    const env = getEnv();
    if (!env.apiKey) return NextResponse.json({ error: "No LLM API key configured" }, { status: 500 });

    // Collect all body chapters up to current chapter
    const bodyChapters: ChapterSection[] = chapters
      .filter((c: ChapterSection) => c.kind === "body" && c.index <= (currentChapter || 999))
      .slice(0, 20);

    // Build context from chapter texts (take first 1000 chars of each)
    const chapterContext = bodyChapters.map(c =>
      `【${c.title}】\n${c.text.slice(0, 1000)}`
    ).join("\n\n").slice(0, 20000);

    const existingNodes = existingMap?.nodes?.map((n: MapNode) => n.name).join(", ") || "";

    const prompt = "You are a spatial analyst for literary works. Extract the main locations and their spatial relationships from the text into a structured map.\n\n" +
      (existingNodes ? `Existing locations (extend these, don't create duplicates): ${existingNodes}\n\n` : "") +
      'Return ONLY JSON: {"name":"Main Scene Map","nodes":[{"id":"p1","name":"Location","type":"building/courtyard/room/city","relativePosition":"north side","position":{"x":50,"y":50}}],"edges":[{"from":"p1","to":"p2","label":"corridor"}],"chapterHighlights":["p1"]}\n\n' +
      "Rules: 3-12 nodes. position x,y are 0-100. North = small y, South = large y, East = large x, West = small x. Use the book's original language for node names.\n\n" +
      "Text:\n" + chapterContext;

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
    if (!content) return NextResponse.json({ error: "Empty response" }, { status: 500 });

    const json = JSON.parse(content.replace(/```json\s*|\s*```/g, "").trim());

    // Merge with existing map if provided
    let nodes: MapNode[] = (json.nodes || []).map((n: Record<string, unknown>, i: number) => ({
      id: String(n.id || `node_${i}`),
      name: String(n.name || "Unknown"),
      type: String(n.type || ""),
      relativePosition: String(n.relativePosition || ""),
      position: (n.position as { x: number; y: number }) || { x: 50, y: 50 },
    }));

    if (existingMap?.nodes) {
      const existingIds = new Set(existingMap.nodes.map((n: MapNode) => n.id));
      const newNodes = nodes.filter(n => !existingIds.has(n.id));
      nodes = [...existingMap.nodes, ...newNodes];
    }

    const mapGraph: MapGraph = {
      id: json.id || generateId(),
      name: json.name || "主要场景地图",
      nodes,
      edges: (json.edges || []) as MapEdge[],
      chapterHighlights: json.chapterHighlights || [],
    };

    return NextResponse.json(mapGraph);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
