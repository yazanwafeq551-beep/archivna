# أرشيفنا — Arsheefna Brand Identity Manual

> **The Digital Memory of Palestine** — الهوية البصرية للمنصة الرقمية الفلسطينية

---

## 1. Brand Concept

Arsheefna (أرشيفنا) is Palestine's digital archival platform. Its identity must
communicate **trust, knowledge, preservation, and national identity** while
remaining timeless, premium, and suited to a modern digital archive.

### 1.1 The Idea — «الوثيقة والذاكرة» (The Document and the Memory)

The mark is an **open archival document** whose meaning is built in six layers,
one inside the other:

1. **The Open Document (الوثيقة المفتوحة)** — an archival sheet with a stepped,
   notched corner. It is the **record being read and preserved** — the thing the
   archive exists to keep.
2. **The Hidden Alef «أ» (الألف المخفي)** — the vertical spine of the document
   *is* the letter «أ», the first letter of «أرشيفنا» and of the Arabic
   alphabet. **The archive is written into the document itself.**
3. **The Dissolving Corner (التحوّل الرقمي)** — the upper-right corner of the
   page dissolves into **shrinking digital pixels**. It is **digitization**:
   paper memory becoming bits that never fade.
4. **The Jerusalem Arch (قوس القدس)** — a subtle horseshoe arch frames the
   hamza of «أ». It is **the city** and **the homeland** — memory rooted in
   place, protected.
5. **The Olive Sprig (الزيتونة)** — a small olive sprig (stem, three leaves,
   one fruit) grows out of the document's seam. It is **Palestine** and
   **living heritage** — memory that stays alive.
6. **The Three Paper Layers (الماضي والحاضر والمستقبل)** — three inner sheets
   recede behind the document face: **past, present, and future**. The archive
   holds all of time.

The whole mark reads as **"Palestine's memory, kept, digitized, and alive"**:
a document (the record) that holds the alef (the archive), dissolves into
pixels (the digital future), framed by the arch (the homeland) and the olive
(heritage).

### 1.2 Tagline

- Arabic: **الذاكرة الرقمية لفلسطين**
- English: **THE DIGITAL MEMORY OF PALESTINE**

---

## 2. Logo System

The logo system has three levels:

| Level | File | Use |
| --- | --- | --- |
| **Primary lockup (vertical)** | `logo-primary-vertical.svg` | Splash, login, certificates, print |
| **Horizontal lockup** | `logo-primary-horizontal.svg` | Website header, footer, email signatures |
| **Icon-only mark** | `icon-primary.svg` | Favicon, app icon, avatars, social profile |

The Arabic wordmark **أرشيفنا** is always the primary brand name. The English
**ARSHEEFNA** is a supporting caption and never replaces it.

### 2.1 Logo versions

| Version | File | Background it sits on |
| --- | --- | --- |
| Primary (forest + gold) | `icon-primary.svg`, `logo-primary-*.svg` | Ivory / white / light surfaces |
| White / Light | `icon-white.svg`, `logo-light-*.svg` | Deep forest green, dark surfaces |
| Ivory | `icon-ivory.svg`, `logo-ivory-vertical.svg` | Deep forest green tiles, dark mode |
| Olive | `icon-olive.svg` | Olive/green editorial surfaces |
| Monochrome | `icon-monochrome.svg`, `logo-monochrome.svg` | One-color print, stamps, engraving |
| Tile (app icon) | `tile-app-icon.svg` | Operating-system icon surfaces |
| Wordmark only | `logo-wordmark.svg`, `logo-wordmark-en.svg` | Editorial layouts, reports |

### 2.2 Logo structure

```
              ░▒ ░░   ░ ░   ← dissolving corner (shrinking pixels)
          ┌────────────────┐
          │                │╲   ← the open document
          │   │   ← the    │
          │  (أ)  hidden   │
          │  ╭──╮  alef =  │
          │  ╰──╯  spine   │
          │   ↳ hamza      │
          │  ┌──────────┐  │
          │  │ past      │  │   ← three paper layers
          │  │ present   │  │      (past / present / future)
          │  │ future  ◖ │  │      + olive sprig
          │  └──────────┘  │
          └────────────────┘
                                أرشيفنا              ← Almarai ExtraBold, forest green
                              ARSHEEFNA               ← Poppins SemiBold, gold, spaced
```

**The icon always sits to the right of the wordmark** (leading position in the
RTL Arabic interface). Never reorder the icon and text.

---

## 3. Clear Space

Keep a clear space equal to **X**, the height of the document's visible face
above the pixel field (about 1/6 of the mark height), on all four sides of any
logo.

```
   ┌─────────────── X ───────────────┐
   │      (clear space = X)          │
   │      ┌─────────────────┐        │
   │      │     LOGO        │        │
   │      └─────────────────┘        │
   │                                 │
   └─────────────────────────────────┘
```

- Never place text, icons, or other graphics inside the clear space.
- On crowded layouts the clear space may shrink to **½X**, never less.

---

## 4. Minimum Sizes

| Use | Minimum rendered size |
| --- | --- |
| Full lockup (mark + wordmark) | **48 px** wide |
| Horizontal lockup | **90 px** wide |
| Icon-only mark | **16 px** (favicon) |
| Icon-only mark (print) | **8 mm** wide |

Below these sizes the pixel spray and olive details disappear; use the
simplified tile or favicon art instead. The mark never appears smaller than
16 px on screen.

---

## 5. Color Palette

### 5.1 Primary colors

| Token | Hex | Name | Role |
| --- | --- | --- | --- |
| `brand.forest` | `#0F4C45` | **Deep Forest Green** | Primary brand color, UI primary, document stroke |
| `brand.gold` | `#C6A15B` | **Warm Gold** | Secondary: alef, arch, hamza, pixels, olive |
| `brand.ivory` | `#F8F4EC` | **Ivory** | Background, light surfaces, text on green |

### 5.2 Supporting colors

| Token | Hex | Name | Role |
| --- | --- | --- | --- |
| `brand.night` | `#072F2B` | **Night Forest** | Dark surfaces, footers, primary-hover |
| `brand.moss` | `#1B6B60` | **Moss** | Hover states, gradients, light-green accents |
| `brand.goldDeep` | `#A9853F` | **Deep Gold** | Gold text on light backgrounds, gold hover |
| `brand.olive` | `#5F7A48` | **Olive Green** | Accent, success-adjacent, editorial |
| `brand.beige` | `#EDE4D1` | **Light Beige** | Card alt backgrounds, muted surfaces |
| `brand.stone` | `#9A938A` | **Warm Stone Gray** | Secondary text, captions |
| `brand.ink` | `#22302D` | **Ink** | Body text on light backgrounds |
| `brand.charcoal` | `#2D2D2D` | **Dark Charcoal** | Editorial captions, secondary on light |

### 5.3 Usage ratio

- **Deep Forest Green: 60%** — dominant, surfaces and primary actions
- **Ivory: 30%** — background, negative space
- **Warm Gold: 10%** — accents, never more

Gold is an accent. It is used for the alef, the arch, the pixel spray, the
olive, and key CTAs — never as a page background.

### 5.4 Contrast

- Forest green + ivory text: **7.8:1** (AAA)
- Forest green + gold: **4.1:1** (AA for large text)
- Ivory + ink text: **13.9:1** (AAA)

---

## 6. Typography

### 6.1 Brand wordmark

| Script | Font | Weight | Tracking |
| --- | --- | --- | --- |
| Arabic | **Almarai** | ExtraBold (800) | default (geometric) |
| Latin | **Poppins** | SemiBold (600) | +14% uppercase letter-spacing |

Almarai is the dedicated wordmark face — geometric, modern, and unmistakably
Arabic. It must never be swapped for the body or heading faces. The wordmark is
always rendered as text in the app (never rasterized); the outlined-PATH
versions shipped in `svg/logo-wordmark*.svg` are for print and PDF tooling only.

### 6.2 UI typefaces

| Role | Arabic font | Latin font |
| --- | --- | --- |
| Brand wordmark | **Almarai** (ExtraBold) | Poppins (SemiBold) |
| Headings / display | **Amiri** (Bold) | Poppins (SemiBold) |
| Body / UI | **IBM Plex Sans Arabic** (400/500/600/700) | Poppins (400/500) |
| Code / metadata | IBM Plex Mono | IBM Plex Mono |

Headings in Amiri give the interface its archival character; the wordmark in
Almarai keeps the brand name distinct; body text in a modern Arabic sans keeps
it readable and contemporary.

---

## 7. Iconography & Supporting Elements

- **The alef spine «أ»** — the gold vertical bar at the heart of the document
  is the signature motif. Use it for "the archive", "preservation", and
  "catalogue" moments.
- **The dissolving pixels** — a diagonal spray of shrinking gold squares (from
  the notched corner) represents digitization and the digital future. Use it
  for "digitized", "online access", and "restoration" states.
- **The Jerusalem arch** — the horseshoe arch framing the hamza remains a
  framing device on hero images and certificates (see the hero illustration).
- **The olive** — olive leaves and fruit are used as accents on awards,
  certificates, and success states.
- **Three layers** — the three receding paper sheets (past / present / future)
  are available as a divider motif.
- **Grid pattern** — a faint 60 px metadata grid may wash backgrounds
  (`pattern-grid.svg`), always at ≤ 6% opacity.
- Icons in the UI remain the **Lucide** icon set (already in use) for
  consistency; only the brand mark itself is bespoke.

---

## 8. Motion Design

**Concept: «الذاكرة تتشكل» — "Memory takes shape".**

Sequence for loading screens (total ≈ 2.4 s):

1. **0.00–0.50 s** — the open document draws itself, outline first.
2. **0.45–0.70 s** — the three paper layers (past / present / future) rise into
   place behind the document face.
3. **0.65–0.95 s** — the Jerusalem arch and the hidden alef «أ» + hamza settle in.
4. **0.90–1.30 s** — the pixels bloom from the notched corner, shrinking as they
   travel toward the top-right edge.
5. **1.20–1.70 s** — the olive stem grows, the three leaves unfurl, and the
   fruit pops in.
6. **1.85–2.40 s** — the wordmark «أرشيفنا» fades in beneath the mark.

Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` for the bloom; `ease-out` for draws.
Duration for the full reveal should never exceed **2.5 s**. Reference file:
`motion/loader-mark.svg`.

---

## 9. Usage Do's & Don'ts

**Do**
- Use the primary lockup on light surfaces and the white/light version on dark.
- Keep clear space (section 3).
- Use the tile version for OS/browser icons.
- Use monochrome for one-color print and engraving.

**Don't**
- Don't stretch, squash, rotate, or recolor the mark.
- Don't remove the dissolving corner, the alef, or the olive from the mark.
- Don't add shadows, outlines, or gradients to the mark.
- Don't place the logo on busy photography without a scrim.
- Don't replace the Arabic wordmark with the English one as primary.
- Don't set the mark smaller than the minimums in section 4.
- Don't put the logo on a gold or olive background.

---

## 10. File Inventory

### `brand/svg/`
Master vector files (all self-contained, outlined wordmarks — no external fonts).

### `brand/png/`
Raster exports: icons at 512, lockups, light/dark versions, `og-image.png` (1200×630).

### `brand/favicon/`
`favicon-16.png`, `favicon-32.png`, `favicon-48.png` (plus `svg/favicon.svg` master).

### `brand/fonts/`
Almarai (Regular/Bold/ExtraBold) + Amiri (Regular/Bold) + Poppins
(Regular/Medium/SemiBold), SIL OFL 1.1 licenses included.

### `brand/motion/`
`loader-mark.svg` — self-contained animated loading mark.

### `brand/manual/`
This manual.

---

## 11. App Implementation

Colors are wired through `apps/web/tailwind.config.ts` as `primary`, `gold`,
`background`, `foreground`, `muted`, `border`, plus new tokens `olive`,
`ivory`, `beige`, `stone`, `goldDeep`. The brand mark is a shared React
component (`components/shared/Logo.tsx`); the wordmark uses the `font-brand`
(Almarai) token. The favicon/tile art, `og-image.png`, and the animated
`loader-mark.svg` live in `apps/web/public/`.
