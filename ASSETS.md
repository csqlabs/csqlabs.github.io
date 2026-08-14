# Asset manifest — Serifo site

Two categories below:

- **✅ Already provided** — real vector data pulled directly from the Figma file's exported assets and saved into `/images`. Nothing to do.
- **⬜ Placeholder — needs export** — photos, logos, and video. Per the brief, these were **not** generated or fetched. Export them yourself from Figma (node names given below) and drop them into `/images` or `/videos` with the exact filename listed so the site picks them up with no code changes.

## ⬜ Placeholder — needs export from Figma

| Filename | Shows | Used in | Figma node / notes |
|---|---|---|---|
| `videos/hero-background-loop.mp4` | Full-bleed background video behind the hero headline (an environment/office/interview-style loop, currently just a color fill in Figma with no video attached) | Hero section, both breakpoints | Desktop node "New environemental video 1" (`1:494`), Mobile node "New environemental video 2" (`1:1571`). No video was actually attached in the Figma file — you'll need to source/produce this separately. |
| `images/hero-background-poster.jpg` | Static poster frame shown before the hero video loads | `<video poster>` fallback | Take a frame from the hero video, or export a static hero shot. |
| `images/veteran-ceo-portrait.jpg` | Portrait photo of CEO Dinkar Jain | "Engineered by Industry Veterans" section | Figma node "image 201" (`1:1306` desktop / `1:2400` mobile) |
| `images/logo-meta.png` | Meta logo | Partner-logo row, veterans section | Figma node "Meta 1" |
| `images/logo-uber.png` | Uber logo | Partner-logo row, veterans section | Figma node "Uber 1" |
| `images/logo-bcg.png` | BCG logo | Partner-logo row, veterans section | Figma node "BCG 1" |
| `images/logo-google.png` | Google logo | Partner-logo row, veterans section | Figma node "Google 1" |

## ✅ Already provided (real Figma vector data, assembled into `/images`)

These were built from the actual exported SVG paths via the Figma MCP asset endpoint — not hand-drawn approximations. You can re-export cleaner originals from Figma later if you want pixel-exact multi-piece compositions; what's here is a faithful, simplified assembly.

| Filename | Shows | Used in |
|---|---|---|
| `images/logo-mark.svg` | Serifo dot-cluster monogram | Header, inline in `index.html` (also standalone at `logo-mark.svg`) |
| `images/icon-arrow-right.svg` | Trailing arrow icon | Hero quicklinks, offering rows, veterans "LinkedIn" link, article "Read" links |
| `images/icon-check-empty.svg` | Empty/unchecked list marker | QC checklist marquee (default state) |
| `images/icon-check-filled.svg` | Filled blue checkmark | QC checklist marquee (highlighted "Fatigue checks" item) |
| `images/icon-star.svg` | 4-point sparkle/star | "Grades for outputs" chart label |
| `images/divider-line.svg` | Thin horizontal rule | Reference only — production page uses a CSS border for the same line |
| `images/dashed-baseline.svg` | Dashed baseline | Reference for the grades-chart baseline (production page draws this with inline SVG) |
| `images/tile-brand-advertising-graphic.svg` | Concentric radar-ring flourish | "Brand & Advertising" tile background (⚠️ simplified — see note below) |
| `images/tile-usage-attitudes-graphic.svg` | Swirl/blob shape | "Usage & Attitudes" tile background |
| `images/tile-usage-attitudes-chart-lines.svg` | Faint 3-row line-chart pattern + dot | "Usage & Attitudes" tile background |
| `images/tile-concept-testing-graphic.svg` | Faceted polygon cluster | "Concept Testing" tile background |
| `images/tile-pricing-value-graphic.svg` | Concentric ring/orbit shape | "Pricing & Value" tile background |
| `images/tile-customer-experience-graphic.svg` | Triple hexagon/wave repeat | "Customer Experience" tile background |
| `images/tile-social-diligence-graphic.svg` | Mirrored tree/plant silhouette pair | "Social Diligence" tile background |
| `images/stats-decoration-graphic.svg` | Large decorative network/line illustration (~350 segments) | Navy "Thira" stats band, top-right decoration |

## ⚠️ Flagged approximation

`images/tile-brand-advertising-graphic.svg` recreates the 9 concentric arcs from the "Brand & Advertising" tile using the **real** exported arc paths, but stacks them as simple evenly-spaced concentric rings rather than reproducing Figma's exact rotated/offset composition pixel-for-pixel (the original uses a 90°-rotated absolute layout that doesn't translate cleanly to flow layout). Visually very close; re-export directly from Figma if you need exact fidelity.

## Fonts

The Figma file specifies these families — none are system fonts, so link/self-host them:

- **EB Garamond** (weights: Medium 500, Medium Italic, Bold 700) — headings, display type. Available on Google Fonts.
- **Geist** (weights: Light 300, Semi-Bold 600) — body copy, buttons. Available via Vercel's Geist font or Google Fonts mirror.
- **DM Mono** (weight: Medium 500) — nav links, captions, eyebrows. Available on Google Fonts.
- **Space Grotesk** (weight: Medium 500) — big stat numbers, metrics. Available on Google Fonts.

None are `@import`ed in `css/tokens.css` yet — add `<link>` tags (or `@font-face`) for these four families before shipping; right now the browser falls back to the system serif/sans/mono stacks named in `tokens.css`.
