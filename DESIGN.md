---
version: alpha
name: Mira
description: A warm, literary visual companion for aphantasic readers. Dark academia meets quiet warmth.
colors:
  primary: "#F2E8D5"
  secondary: "#A6977B"
  tertiary: "#D4A853"
  neutral: "#1A1816"
  surface: "#24211D"
  elevated: "#2D2924"
  text-primary: "#F2E8D5"
  text-secondary: "#A6977B"
  text-muted: "#6B6358"
  accent: "#D4A853"
  danger: "#B8422E"
  success: "#6B8E4E"
typography:
  h1:
    fontFamily: "Crimson Text, Georgia, serif"
    fontSize: 2rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  h2:
    fontFamily: "Crimson Text, Georgia, serif"
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.25
  h3:
    fontFamily: "Crimson Text, Georgia, serif"
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.7
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.6
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.02em"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.05em"
    textTransform: uppercase
rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  "2xl": 48px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: 12px
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "#E5C06A"
    textColor: "{colors.neutral}"
  button-secondary:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: 12px
    typography: "{typography.label}"
  button-secondary-hover:
    backgroundColor: "#3A3530"
    textColor: "{colors.text-primary}"
  input-field:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: 12px
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  card-elevated:
    backgroundColor: "{colors.elevated}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  image-placeholder:
    backgroundColor: "{colors.elevated}"
    rounded: "{rounded.md}"
    size: 200px
---

## Overview

Mira is a visual reading companion for people with aphantasia — the inability to form mental images. The design language is **warm literary minimalism**: dark academia tones with amber warmth. It should feel like a quiet library corner at golden hour, not a tech product dashboard.

**Core feeling:** Calm, warm, unhurried. A tool that gets out of the way so the user can focus on their books.

## Colors

- **Neutral (#1A1816):** Deep warm black — the background, like a leather-bound book cover.
- **Surface (#24211D):** Slightly lifted — card backgrounds, elevated surfaces.
- **Elevated (#2D2924):** Input fields, interactive elements.
- **Primary (#F2E8D5):** Warm parchment white — all primary text, like the pages of an old book.
- **Secondary (#A6977B):** Muted gold-beige — secondary text, dividers.
- **Tertiary / Accent (#D4A853):** Amber gold — the sole accent color. Buttons, active states, highlights. Use sparingly.
- **Text-muted (#6B6358):** Faded ink — tertiary text, placeholders.

The palette lives entirely in warm tones. No cool grays, no pure whites, no pure blacks. Everything has a hint of amber.

## Typography

**Serif for headings:** Crimson Text — literary, classic, readable.  
**Sans-serif for body:** Inter — clean, modern, high readability for UI and longer text.  

Headings use serif to evoke books and literature. UI elements and body text use sans-serif for clarity. Never mix serif into UI labels or buttons.

Font loading: Google Fonts (Crimson Text + Inter). Self-host if possible for offline use.

## Layout & Spacing

- Single-column, centered, max-width 720px for reading/editing views.
- Gallery views (character cards, scene thumbnails) use a responsive grid: 2 columns on mobile, 3-4 on desktop.
- Generous whitespace — this is a reading tool, not a dashboard. Paragraph spacing 1.5-2x normal.
- Mobile-first. The primary use case is someone reading on their phone, occasionally switching to the app to reference visuals.

## Elevation & Depth

- Flat design with subtle layering. No heavy shadows.
- Cards get a 1px border in `secondary` at 10% opacity instead of drop shadows.
- Hover states: subtle background lighten (2-3%), no scale transforms.
- Active/selected states: a thin 2px amber `accent` border-left.

## Shapes

- Cards and containers: rounded-lg (16px).
- Buttons and inputs: rounded-md (12px).
- Images/generated art: rounded-sm (8px) with a subtle 1px border in secondary.
- Icons: rounded, thin-stroke, consistent 24px.

## Components

**`button-primary`:** The only high-emphasis action. Amber gold background, dark text. Use for "Generate" actions.

**`button-secondary`:** Elevated surface background, light text. Use for cancel, back, secondary actions.

**`input-field`:** Elevated background, warm border. Textarea variant for story descriptions — taller, monospaced-ish feel.

**`card`:** Surface background, generous padding. Holds book info, character portraits, scene maps.

**`card-elevated`:** For the active/selected item.

**`image-placeholder`:** Elevated background with a subtle dashed border. Shown while images are generating. Pulsing amber glow animation to indicate generation in progress.

## Do's and Don'ts

- **Do** use warm, literary language in UI copy (e.g., "Add to your library" not "Create item").
- **Do** show a gentle loading animation with an amber pulse while images generate.
- **Do** use the parchment white sparingly — background stays dark.
- **Don't** use pure white (#FFFFFF) or pure black (#000000) anywhere.
- **Don't** use blue links — amber is the only accent color.
- **Don't** clutter the interface. Every element must justify its presence.
