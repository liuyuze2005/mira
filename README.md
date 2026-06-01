# Mira — Visual Reading Companion

A visual reading companion for people with **aphantasia** — the inability to form mental images. Mira generates character portraits, scene maps, and key moment illustrations from book descriptions, giving readers visual anchors to better understand and enjoy literary works.

## Why Mira?

People with aphantasia struggle to visualize characters and settings when reading. Research confirms that while aphantasic readers enjoy books as much as others, they experience significantly less absorption in the story world, less emotional engagement with characters, and reduced attention to visual descriptions (Speed, Eekhof & Mak, 2024).

Mira bridges this gap by generating a "visual package" for each book — a set of reference images you can browse while reading.

## Features

- 📚 **Book Library** — Manage visual assets per book
- 👤 **Character Gallery** — Generate consistent character portraits from text descriptions
- 🗺️ **Scene Maps** — Generate top-down layouts from spatial descriptions
- 🎬 **Key Moments** — Generate scene illustrations from plot paragraphs
- 🎨 **Style Options** — Realistic, Illustrated, Line Art, Pixel Art
- 📱 **Mobile-First** — Works on your phone while you read
- 🔒 **Local Storage** — All data stored in your browser via IndexedDB

## Tech Stack

- **Next.js 16** (App Router)
- **Tailwind CSS v4**
- **IndexedDB** (no backend required)
- **OpenAI DALL·E 3** (or any OpenAI-compatible image API)

## Getting Started

```bash
# Install dependencies
npm install

# Configure your image generation API key
cp .env.local.example .env.local
# Edit .env.local with your API key

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `IMAGE_GEN_API_KEY` | OpenAI-compatible API key | Required |
| `IMAGE_GEN_BASE_URL` | API base URL | `https://api.openai.com/v1` |
| `IMAGE_GEN_MODEL` | Model name | `dall-e-3` |

## Design

See [DESIGN.md](DESIGN.md) for the complete design system specification (Google DESIGN.md format).


