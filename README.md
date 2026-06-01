# Mira — Visual Reading Companion

> 米拉 — 心象阅读助手  
> A visual companion pack generator for readers with aphantasia.

Enter a book title, and Mira uses **AI knowledge** to generate character portraits, scene cards, and key moment illustrations — no ebook upload required for well-known books (《红楼梦》, The Three-Body Problem, Harry Potter…). For obscure books, upload a `.epub`, `.txt`, or `.pdf` and Mira will extract everything automatically.

---

## Features

- 🔮 **Knowledge-First Pipeline** — AI knowledge extraction for 90%+ of books. Upload only as fallback.
- 🧑‍🎨 **Character Gallery** — Portraits with source quotes (see exactly where each trait came from)
- 🗺 **Scene Cards** — Atmosphere illustrations + spatial layout diagrams
- 🎬 **Key Moments** — Scene illustrations of pivotal plot moments
- 🔒 **No-Spoiler Mode** — Only reveal characters/scenes up to your current chapter
- 📦 **Export** — Download the full Visual Companion Pack as JSON
- 🎨 **Style Editor** — Customize visual style, period, color palette per book
- 🌐 **Bilingual** — 中 / EN

---

## Supported Formats

| Format | Upload | AI Knowledge |
|--------|--------|--------------|
| Well-known books | Not needed | ✅ Primary |
| `.txt` | ✅ | Fallback |
| `.epub` (JSZip) | ✅ | Fallback |
| `.pdf` (pdf-parse) | ✅ | Fallback |

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- **Storage**: IndexedDB (local, no backend)
- **APIs**: LLM extraction (OpenAI-compatible), image generation (DALL·E or compatible)
- **File parsing**: JSZip (epub), pdf-parse (pdf)

---

## Environment Variables

Create `.env.local`:

```bash
# LLM for extraction and knowledge queries
EXTRACT_API_KEY=sk-...
EXTRACT_BASE_URL=https://your-llm-proxy.com/v1
EXTRACT_MODEL=gpt-4o-mini

# Image generation
IMAGE_GEN_API_KEY=sk-...
IMAGE_GEN_BASE_URL=https://your-image-proxy.com/v1
IMAGE_GEN_MODEL=dall-e-3
```

`EXTRACT_API_KEY` falls back to `IMAGE_GEN_API_KEY` if not set.

---

## Development

```bash
npm install
npm run dev
# → http://localhost:3000
```

## License

MIT
