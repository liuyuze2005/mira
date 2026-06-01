"use client";

import { useState, useRef, DragEvent } from "react";
import type { TranslationDict } from "@/lib/i18n";
import type { ChapterSection } from "@/lib/types";

export interface EpubResult {
  chapters: ChapterSection[];
  rawText: string;
  fileName: string;
  epubBuffer?: ArrayBuffer;  // raw EPUB for epub.js
}

interface Props {
  t: TranslationDict;
  onParsed: (result: EpubResult) => void;
}

export default function BookUpload({ t, onParsed }: Props) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setParsing(true);
    setProgress("读取文件中…");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      if (ext === "epub") {
        const buffer = await file.arrayBuffer();
        const result = await parseEpub(buffer, file.name, setProgress);
        onParsed(result);
      } else if (ext === "txt") {
        const text = await file.text();
        const section: ChapterSection = {
          index: 1, title: file.name.replace(/\.txt$/i, ""),
          kind: "body", text, startOffset: 0, endOffset: text.length,
        };
        onParsed({ chapters: [section], rawText: text, fileName: file.name });
      } else if (ext === "pdf") {
        // PDF still needs server-side parsing
        setProgress("上传 PDF 到服务端…");
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/parse", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Parse failed");
        const text: string = data.text || "";
        const section: ChapterSection = {
          index: 1, title: file.name.replace(/\.pdf$/i, ""),
          kind: "body", text, startOffset: 0, endOffset: text.length,
        };
        onParsed({ chapters: [section], rawText: text, fileName: file.name });
      } else {
        throw new Error(`不支持的文件格式: .${ext}（支持 epub / txt / pdf）`);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setParsing(false);
      setProgress("");
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
          ${dragging ? "border-tertiary bg-tertiary/10" : parsing ? "border-tertiary/50" : "border-secondary/20 hover:border-secondary/40"}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !parsing && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".epub,.txt,.pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          disabled={parsing}
        />
        {parsing ? (
          <div className="space-y-2">
            <p className="text-secondary text-sm">⏳ {progress}</p>
            <div className="w-full bg-secondary/10 rounded-full h-1.5">
              <div className="bg-tertiary h-1.5 rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-secondary text-sm">📤 拖拽文件到此处，或点击选择</p>
            <p className="text-muted text-xs">支持 .epub / .txt / .pdf</p>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-2 p-2 bg-danger/10 text-danger text-xs rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}

// ── EPUB Parser (browser-side, JSZip) ──
async function parseEpub(
  buffer: ArrayBuffer,
  fileName: string,
  onProgress: (msg: string) => void,
): Promise<EpubResult> {
  const JSZip = (await import("jszip")).default;
  onProgress("解压 EPUB…");
  const zip = await JSZip.loadAsync(buffer);

  // 1. Find container.xml
  const containerFile = zip.file("META-INF/container.xml");
  if (!containerFile) throw new Error("无效的 EPUB：找不到 META-INF/container.xml");
  const containerXml = await containerFile.async("text");
  const opfPath = extractOpfPath(containerXml);
  if (!opfPath) throw new Error("无效的 EPUB：container.xml 中找不到 rootfile");

  // 2. Parse OPF
  onProgress("解析目录结构…");
  const opfFile = zip.file(opfPath);
  if (!opfFile) throw new Error(`无效的 EPUB：找不到 ${opfPath}`);
  const opfXml = await opfFile.async("text");
  const opfDir = opfPath.substring(0, opfPath.lastIndexOf("/") + 1);

  const parser = new DOMParser();
  const opfDoc = parser.parseFromString(opfXml, "text/xml");

  // Metadata
  const title = opfDoc.querySelector("dc\\:title, title")?.textContent?.trim() || fileName;
  const author = opfDoc.querySelector("dc\\:creator, creator")?.textContent?.trim() || "";

  // Manifest: id → href
  const manifest = new Map<string, string>();
  opfDoc.querySelectorAll("item").forEach(item => {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    if (id && href) manifest.set(id, href);
  });

  // Spine: reading order
  const spineIds: string[] = [];
  opfDoc.querySelectorAll("itemref").forEach(ref => {
    const idref = ref.getAttribute("idref");
    if (idref) spineIds.push(idref);
  });

  // 3. Parse NCX for chapter titles
  onProgress("读取目录…");
  const ncxHref = findNcxPath(opfDoc, manifest, opfDir);
  const tocMap = ncxHref ? await parseNcx(zip, ncxHref, opfDir) : new Map<number, string>();

  // 4. Read spine items in order, extract text
  onProgress("提取章节…");
  const chapters: ChapterSection[] = [];
  const allTexts: string[] = [];
  let offset = 0;
  let chapterIndex = 0;

  for (const idref of spineIds) {
    const href = manifest.get(idref);
    if (!href) continue;
    const fullPath = findZipFile(zip, opfDir, href);
    if (!fullPath) continue;
    const entry = zip.file(fullPath);
    if (!entry) continue;
    const html = await entry.async("text");
    const text = htmlToText(html);
    if (text.trim().length < 50) continue; // skip tiny fragments

    chapterIndex++;
    const chapterTitle = tocMap.get(chapterIndex) || `第${chapterIndex}章`;

    chapters.push({
      index: chapterIndex,
      title: chapterTitle,
      kind: "body",
      text,
      startOffset: offset,
      endOffset: offset + text.length,
    });
    allTexts.push(text);
    offset += text.length;
  }

  if (chapters.length === 0) {
    throw new Error("EPUB 中未找到可读内容");
  }

  return {
    chapters,
    rawText: allTexts.join("\n\n"),
    fileName,
    epubBuffer: buffer,
  };
}

// ── Helpers ──

function extractOpfPath(xml: string): string | null {
  const m = xml.match(/full-path="([^"]+)"/);
  return m ? m[1] : null;
}

function findZipFile(zip: any, opfDir: string, href: string): string | null {
  // Remove fragment (#...) and decode URL encoding
  let clean = href.split("#")[0];
  clean = clean.replace(/^\.\//, ""); // strip leading ./

  const candidates: string[] = [];

  // 1. Relative to OPF directory (most common)
  if (opfDir) candidates.push(opfDir + clean);

  // 2. As-is (root-relative or absolute)
  candidates.push(clean.startsWith("/") ? clean.slice(1) : clean);

  // 3. Handle ../ references (relative path with parent dirs)
  if (clean.includes("..")) {
    const opfParts = opfDir.split("/").filter(Boolean);
    const relParts = clean.split("/");
    for (const part of relParts) {
      if (part === "..") opfParts.pop();
      else if (part !== ".") opfParts.push(part);
    }
    candidates.push(opfParts.join("/"));
  }

  for (const path of candidates) {
    if (zip.file(path)) return path;
  }

  // 4. Last resort: search by filename
  const filename = clean.split("/").pop();
  if (filename) {
    const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const p of Object.keys(zip.files)) {
      if (p.endsWith("/" + filename) || p === filename) return p;
    }
  }

  return null;
}

function findNcxPath(opfDoc: Document, manifest: Map<string, string>, opfDir: string): string | null {
  // Try NCX
  const spineEl = opfDoc.querySelector("spine");
  const ncxId = spineEl?.getAttribute("toc");
  if (ncxId) {
    const href = manifest.get(ncxId);
    if (href) return opfDir + href.replace(/^\.\//, "");
  }
  // Try manifest item with media-type="application/x-dtbncx+xml"
  for (const item of opfDoc.querySelectorAll("item")) {
    if (item.getAttribute("media-type") === "application/x-dtbncx+xml") {
      const href = item.getAttribute("href");
      if (href) return opfDir + href.replace(/^\.\//, "");
    }
  }
  return null;
}

async function parseNcx(
  zip: any,
  ncxPath: string,
  opfDir: string,
): Promise<Map<number, string>> {
  const toc = new Map<number, string>();
  try {
    const entry = zip.file(ncxPath);
    if (!entry) return toc;
    const xml = await entry.async("text");
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    let idx = 0;
    doc.querySelectorAll("navPoint").forEach(np => {
      idx++;
      const label = np.querySelector("navLabel text")?.textContent?.trim();
      if (label) toc.set(idx, label);
    });
  } catch { /* NCX optional */ }
  return toc;
}

function htmlToText(html: string): string {
  // Use DOMParser to strip HTML tags
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
}
