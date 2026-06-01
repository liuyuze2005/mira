import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { type, label, description, style } = await req.json();
    if (!type || !description) {
      return NextResponse.json({ error: "Missing type or description" }, { status: 400 });
    }

    // Build prompt based on asset type and style
    const stylePrompts: Record<string, string> = {
      realistic: "photorealistic, detailed, 8K quality, cinematic lighting",
      illustrated: "vivid book illustration style, warm colors, expressive brushwork, painterly",
      "line-art": "minimalist line art, clean ink lines, manga sketch style, black and white with subtle shading",
      pixel: "pixel art, 16-bit retro game style, limited color palette, crisp pixels",
    };

    let basePrompt = "";
    switch (type) {
      case "character":
        basePrompt = `Character portrait of "${label}": ${description}. Full body or half-body portrait, consistent facial features, front-facing or three-quarter view.`;
        break;
      case "scene-map":
        basePrompt = `Top-down floor plan / isometric schematic layout of "${label}": ${description}. Architectural reference map, labeled areas, clean diagrammatic style, showing spatial relationships and relative positions.`;
        break;
      case "key-moment":
        basePrompt = `Story illustration of "${label}": ${description}. Dramatic composition, storytelling focus, key moment from narrative.`;
        break;
    }

    const prompt = `${basePrompt} Style: ${stylePrompts[style] || stylePrompts.illustrated}.`;

    // Try OpenAI-compatible endpoint
    const apiKey = process.env.IMAGE_GEN_API_KEY;
    const apiBase = process.env.IMAGE_GEN_BASE_URL || "https://api.openai.com/v1";

    if (!apiKey) {
      // No API key configured — return a placeholder
      return NextResponse.json({
        imageUrl: null,
        error: "Image generation API key not configured. Set IMAGE_GEN_API_KEY in .env.local",
        prompt,
      });
    }

    const response = await fetch(`${apiBase}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.IMAGE_GEN_MODEL || "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ imageUrl: null, error: `API error: ${response.status} ${err}`, prompt }, { status: 500 });
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url || null;

    return NextResponse.json({ imageUrl, prompt });
  } catch (err: unknown) {
    return NextResponse.json({ imageUrl: null, error: String(err) }, { status: 500 });
  }
}
