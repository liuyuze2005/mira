import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

    const apiKey = process.env.EXTRACT_API_KEY || process.env.IMAGE_GEN_API_KEY;
    const apiBase = process.env.EXTRACT_BASE_URL || process.env.IMAGE_GEN_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.EXTRACT_MODEL || "gpt-4o-mini";

    if (!apiKey) {
      return NextResponse.json({ error: "No extraction API key configured" }, { status: 500 });
    }

    // Truncate text to fit context window
    const maxInput = 60_000;
    const inputText = text.length > maxInput ? text.slice(0, maxInput) : text;

    const prompt = `You are a literary analyst. From the following book excerpt, extract:
1. Characters — name + brief physical description (appearance, clothing, distinguishing features) + personality traits. Only include characters with enough descriptive text to generate a visual portrait.
2. Scenes — location name + spatial description (layout, relative positions, atmosphere). Focus on settings described with enough detail to draw a map or layout.
3. Key Moments — important plot events with strong visual imagery. Include the original text passage.

Return ONLY valid JSON in this exact format, with no additional text:
{
  "characters": [
    { "name": "...", "description": "...", "traits": "..." }
  ],
  "scenes": [
    { "name": "...", "description": "..." }
  ],
  "moments": [
    { "name": "...", "passage": "..." }
  ]
}

Return empty arrays for any category with no clear results. Max 8 characters, 5 scenes, 5 moments.

BOOK TEXT:
${inputText}`;

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
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
    if (!content) return NextResponse.json({ error: "Empty response from LLM" }, { status: 500 });

    // Parse the JSON (handle markdown code fences)
    const json = JSON.parse(content.replace(/```json\s*|\s*```/g, "").trim());

    return NextResponse.json({
      characters: json.characters || [],
      scenes: json.scenes || [],
      moments: json.moments || [],
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
