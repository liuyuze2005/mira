import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const JSZip = require("jszip");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    let text = "";

    if (ext === "txt") {
      text = new TextDecoder("utf-8").decode(buffer);
    } else if (ext === "epub") {
      const zip = await JSZip.loadAsync(buffer);
      const textFiles: string[] = [];
      const sorted = Object.keys(zip.files).sort();
      for (const name of sorted) {
        if (/\.(xhtml|html|xml)$/i.test(name) && !name.includes("nav") && !name.includes("toc")) {
          textFiles.push(await zip.files[name].async("text"));
        }
      }
      text = textFiles.join("\n\n")
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
        .replace(/&#?\w+;/g, "").replace(/\s+/g, " ").replace(/\n\s*\n/g, "\n\n").trim();
    } else if (ext === "pdf") {
      try {
        const pdfParse = require("pdf-parse");
        const data = await pdfParse(buffer);
        text = data.text;
      } catch {
        return NextResponse.json({ error: "PDF parsing failed. Ensure pdf-parse is installed: npm install pdf-parse" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: `Unsupported format: .${ext}` }, { status: 400 });
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "No text could be extracted from this file." }, { status: 400 });
    }

    const maxChars = 200_000;
    const truncated = text.length > maxChars ? text.slice(0, maxChars) + "\n\n[... content truncated ...]" : text;

    return NextResponse.json({
      text: truncated,
      fullLength: text.length,
      truncated: text.length > maxChars,
      fileName: file.name,
      format: ext,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
