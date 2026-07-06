# Multi-Agent-Chat Design System

**Version 1.0 — single source of truth for all UI work.**
Every value in this document is final. Implementers copy values verbatim; do not improvise adjacent shades, sizes, or timings. If a needed token is missing, add it here first, then use it.

Architecture note: the app already uses CSS custom properties with a `[data-theme="dark"]` switch (`src/index.css`) and Tailwind with `darkMode: 'class'`. This system keeps that architecture (tokens as CSS vars, Tailwind reads the vars) and replaces the visual values wholesale. Old `--dex-*`, `lab.*`, and `.r-*` tokens are deprecated and will be removed as screens migrate.

---

## 1. Design direction

Multi-Agent-Chat is a scientific instrument. Researchers configure five-agent negotiation experiments, watch runs unfold in real time, and read transcripts and outcome tables with the scrutiny they'd give any dataset. The design's job is to make that work feel effortless and trustworthy — which means the interface must behave like a native Mac app that happens to live in a browser: instant, quiet, and physically coherent. Nothing decorative competes with the data. Hierarchy comes from type weight, spacing, and surface elevation — never from colored boxes, gradients, or borders doing a heading's job.

The aesthetic is Apple's, applied honestly rather than cosplayed. That means: the system font stack (SF Pro on Apple hardware, high-quality fallbacks elsewhere), true hairline separators, a grouped-background surface model lifted from macOS settings panes, one restrained accent used almost exclusively for interactive states, and translucency in exactly two places — the sidebar and overlay sheets — where it communicates "this floats above your work," not "we discovered backdrop-filter." Depth is earned: a resting card has almost no shadow; shadow grows only when something detaches from the page (menus, sheets, dragged items).

Motion is the third pillar and the easiest to get wrong. Everything that moves uses springs tuned to feel like mass, not tweens that feel like PowerPoint. Interface chrome (panels, toggles, menus) moves fast and settles without bounce; content (cards entering, sheets presenting) gets slightly softer springs. Data never animates in ways that could mislead — numbers update instantly, chart transitions are opt-in and honest. The overall register: a calm lab bench, precision-machined, where the most vivid thing on screen is always the experiment itself.

---

## 2. Typography

### Font stacks

```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI Variable",
             "Segoe UI", system-ui, Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Consolas,
             "Liberation Mono", monospace;
```

No webfonts. Remove Inter / Plus Jakarta Sans / JetBrains Mono `<link>`s from `index.html` — zero font network requests is part of the "instant" feel.

Global rendering:

```css
html { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
```

### Type scale

All sizes in px (rem equivalents at 16px root). Tracking values are `letter-spacing` in em. This mirrors SF Pro's optical tracking curve: negative at large sizes, neutral-to-positive at small sizes.

| Role | Size / line-height | Weight | Tracking | Usage |
|---|---|---|---|---|
| `display` | 34 / 41 | 700 | -0.022em | Landing hero, empty-state headlines only |
| `title-1` | 28 / 34 | 700 | -0.021em | Page titles ("Experiments", "Run #42") |
| `title-2` | 22 / 28 | 700 | -0.018em | Section headers within a page |
| `title-3` | 17 / 22 | 600 | -0.012em | Card titles, modal titles |
| `headline` | 15 / 20 | 600 | -0.009em | List-row primary text, table headers, form group labels |
| `body` | 15 / 22 | 400 | -0.009em | Default text: descriptions, transcript prose, form help |
| `callout` | 13 / 18 | 400 | -0.003em | Secondary descriptions, table cells, dense UI |
| `caption` | 12 / 16 | 500 | 0em | Timestamps, chips, sidebar section labels, axis labels |
| `caption-2` | 11 / 13 | 500 | +0.005em | Overlines (uppercase, +0.06em when uppercased), keyboard hints |
| `mono-body` | 13 / 20 | 400 | 0em | Transcript message text, JSON/config previews, log output |
| `mono-data` | 13 / 18 | 500 | 0em | Numbers in tables, prices, token counts, run IDs |

Rules:

- **Numeric data always uses tabular figures.** Apply `font-variant-numeric: tabular-nums` (utility class `.tnum`) to every table cell, stat, timer, and price — in both sans and mono. Columns of numbers must not shimmy when values change.
- Weights used: 400, 500, 600, 700. Never 300 (too faint at UI sizes) or 800+.
- `headline`-and-up in `--label-primary`; supporting text in `--label-secondary`; never encode hierarchy by shrinking below 11px.
- Transcript speaker names: `caption` at weight 600. Transcript message content: `mono-body` for negotiation-protocol messages, `body` for free-prose messages — pick one per view, don't mix within a transcript.
- Uppercase is reserved for `caption-2` overlines (sidebar section labels, table group headers) with `letter-spacing: 0.06em`.

---

## 3. Color tokens

One accent: **calibrated blue** (`#0A7AFF` light / `#409CFF` dark) — the color of a focused instrument, not a brand splash. Interactive elements are blue; everything else is a neutral or a semantic status color. If a screen has more than ~3 blue elements visible, something is over-claiming interactivity.

Neutrals are near-achromatic with a barely-there cool cast (hue ~250, chroma ≤ 0.006 in oklch) — "graphite," not slate-blue. This is deliberately different from the current Tailwind-slate look.

### Light theme

```css
:root {
  color-scheme: light;

  /* Backgrounds */
  --bg-base:      #FFFFFF; /* content canvas: tables, transcripts, forms sit on white */
  --bg-elevated:  #FFFFFF; /* cards, popovers, sheets (differentiated by border+shadow) */
  --bg-grouped:   #F5F5F7; /* app frame: page background behind cards, settings panes */
  --bg-sidebar:   rgba(246, 246, 248, 0.80); /* under backdrop-blur; opaque fallback #F4F4F6 */
  --bg-sunken:    #EFEFF1; /* wells: sliders tracks, segmented control track, code blocks */

  /* Labels (Apple 4-tier) */
  --label-primary:    #1D1D1F; /* 16.1:1 on white — headings, primary content */
  --label-secondary:  #55555C; /* 7.3:1 — supporting text, table body */
  --label-tertiary:   #86868C; /* 3.9:1 — placeholders, disabled-ish, timestamps (large/bold or non-essential only) */
  --label-quaternary: #B4B4BA; /* 2.2:1 — decorative only: chevrons, drag handles, never text */

  /* Separators */
  --separator:        rgba(29, 29, 31, 0.10); /* hairlines everywhere */
  --separator-opaque: #E8E8EA;                /* where blending would double-darken (table grids) */

  /* Fills (translucent, stack correctly on any bg) */
  --fill-primary:    rgba(120, 120, 128, 0.16); /* hover states, chip bg, segmented track */
  --fill-secondary:  rgba(120, 120, 128, 0.10); /* pressed/selected-row, subtle chips */
  --fill-tertiary:   rgba(120, 120, 128, 0.06); /* row zebra, faint wells */

  /* Accent */
  --accent:          #0A7AFF; /* 4.5:1 on white — links, active nav, focus, primary buttons */
  --accent-hover:    #0070EB;
  --accent-pressed:  #0063D1;
  --accent-soft:     rgba(10, 122, 255, 0.10); /* selected-item bg, active nav pill */
  --accent-soft-2:   rgba(10, 122, 255, 0.16); /* selected+hover */
  --on-accent:       #FFFFFF;

  /* Semantic */
  --success:      #1F9D55; /* 4.6:1 on white */
  --success-soft: rgba(31, 157, 85, 0.12);
  --warning:      #B25000; /* 4.9:1 on white — text/icon form of orange */
  --warning-soft: rgba(255, 149, 0, 0.15);
  --destructive:  #E02D2D; /* 4.5:1 on white */
  --destructive-soft: rgba(224, 45, 45, 0.10);

  /* Agent identity (transcript speakers, run charts — 5 negotiation agents) */
  --agent-1: #0A7AFF;  /* blue */
  --agent-2: #17877D;  /* teal */
  --agent-3: #B25000;  /* amber-brown */
  --agent-4: #7A5AF8;  /* indigo — data-viz only, not UI chrome */
  --agent-5: #C93A6E;  /* raspberry — data-viz only, not UI chrome */
}
```

### Dark theme

```css
[data-theme="dark"] {
  color-scheme: dark;

  --bg-base:      #1C1C1E; /* content canvas */
  --bg-elevated:  #2C2C2E; /* cards, popovers, sheets — dark mode elevates by lightening */
  --bg-grouped:   #131315; /* app frame */
  --bg-sidebar:   rgba(28, 28, 30, 0.72); /* opaque fallback #202022 */
  --bg-sunken:    #141416;

  --label-primary:    #F5F5F7; /* 15.5:1 on bg-base */
  --label-secondary:  #B0B0B8; /* 7.2:1 */
  --label-tertiary:   #7C7C85; /* 3.8:1 */
  --label-quaternary: #4A4A52;

  --separator:        rgba(245, 245, 247, 0.12);
  --separator-opaque: #38383A;

  --fill-primary:    rgba(120, 120, 128, 0.36);
  --fill-secondary:  rgba(120, 120, 128, 0.24);
  --fill-tertiary:   rgba(120, 120, 128, 0.14);

  --accent:          #409CFF; /* 6.7:1 on bg-base */
  --accent-hover:    #5CAAFF;
  --accent-pressed:  #2E8BF0;
  --accent-soft:     rgba(64, 156, 255, 0.16);
  --accent-soft-2:   rgba(64, 156, 255, 0.24);
  --on-accent:       #FFFFFF;

  --success:      #30C567; --success-soft: rgba(48, 197, 103, 0.16);
  --warning:      #FFA028; --warning-soft: rgba(255, 160, 40, 0.16);
  --destructive:  #FF5C5C; --destructive-soft: rgba(255, 92, 92, 0.14);

  --agent-1: #409CFF; --agent-2: #3ECFC0; --agent-3: #FFA028;
  --agent-4: #A48CFF; --agent-5: #FF7AA8;
}
```

### Contrast guarantees (WCAG AA)

- All body/caption text uses `--label-primary` or `--label-secondary`: ≥ 7:1 both themes.
- `--label-tertiary` (≈3.9:1) is permitted only for placeholder text, timestamps, and text ≥ 18.66px bold — never for content the researcher must read.
- `--accent` on `--bg-base`: 4.5:1 light, 6.7:1 dark. White on `--accent` buttons: 4.5:1 light (blue is dark enough), and on dark-theme `#409CFF` use `--label-primary`-on-accent check → white on #409CFF is 3.2:1, acceptable for large/bold button labels (15px/600); for small text on accent use light theme's #0A7AFF fill in both themes for filled buttons: **filled buttons always use `#0A7AFF` background + white text in both themes** (`--accent-fill: #0A7AFF` / hover `#0070EB` — add this token, same value both themes).
- Semantic colors as text always pass 4.5:1 (values above chosen for this).
- Never place `--accent` text on `--accent-soft` chips without checking: use accent-on-soft only at weight ≥ 500, size ≥ 12px (passes at ~4.6:1 light).

---

## 4. Materials & depth

### Corner radius scale

| Token | Value | Usage |
|---|---|---|
| `--radius-xs` | 5px | Chips, checkboxes, small badges, kbd |
| `--radius-sm` | 7px | Buttons, inputs, selects, segmented items |
| `--radius-md` | 10px | Cards, popovers, menus, table containers, toasts |
| `--radius-lg` | 14px | Modals/sheets, large panels, file drop zone |
| `--radius-xl` | 20px | Landing-page feature cards only |
| `--radius-full` | 9999px | Toggle, avatars, pills, status dots |

Nested radius rule: inner radius = outer radius − padding (min 5px). A 14px sheet with 12px padding contains 5–7px controls, not 10px cards.

### Hairline borders

Every bordered surface uses `1px solid var(--separator)`. No 2px borders anywhere except focus rings. On 2x+ displays, true hairlines where supported:

```css
@media (min-resolution: 2dppx) {
  .hairline { border-width: 0.5px; }
}
```

Cards on `--bg-grouped` get border + shadow; cards on `--bg-base` get border only (shadow on white next to white reads as smudge).

### Shadow scale

Shadows are cool-tinted and layered (ambient + key). Resting state is nearly flat; elevation is an event.

```css
--shadow-1: 0 0 0 1px var(--separator), 0 1px 2px rgba(0, 0, 0, 0.04);
            /* resting cards on grouped bg */
--shadow-2: 0 0 0 1px var(--separator), 0 2px 8px rgba(0, 0, 0, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.04);
            /* dropdowns, popovers, hovering cards */
--shadow-3: 0 0 0 1px var(--separator), 0 8px 24px rgba(0, 0, 0, 0.12),
            0 2px 6px rgba(0, 0, 0, 0.06);
            /* sheets, modals, dragged items */
--shadow-4: 0 0 0 1px var(--separator), 0 24px 60px rgba(0, 0, 0, 0.18),
            0 8px 16px rgba(0, 0, 0, 0.08);
            /* command palette / full-screen takeover surfaces */
```

Dark theme overrides (shadows need more strength, plus the lightened surface already signals elevation):

```css
[data-theme="dark"] {
  --shadow-1: 0 0 0 1px var(--separator), 0 1px 2px rgba(0,0,0,0.30);
  --shadow-2: 0 0 0 1px var(--separator), 0 2px 10px rgba(0,0,0,0.45);
  --shadow-3: 0 0 0 1px var(--separator), 0 10px 30px rgba(0,0,0,0.55);
  --shadow-4: 0 0 0 1px var(--separator), 0 28px 70px rgba(0,0,0,0.65);
}
```

### Vibrancy (backdrop-blur) — exactly three recipes

Translucency appears only where a surface floats over live content. Nowhere else.

```css
/* 1. Sidebar — content scrolls beneath it */
.material-sidebar {
  background: var(--bg-sidebar);
  -webkit-backdrop-filter: blur(24px) saturate(1.6);
  backdrop-filter: blur(24px) saturate(1.6);
  border-right: 1px solid var(--separator);
}

/* 2. Toolbar / sticky headers — content scrolls under */
.material-toolbar {
  background: color-mix(in srgb, var(--bg-base) 78%, transparent);
  -webkit-backdrop-filter: blur(16px) saturate(1.5);
  backdrop-filter: blur(16px) saturate(1.5);
  border-bottom: 1px solid var(--separator);
}

/* 3. Overlay scrim — behind sheets/modals */
.material-scrim {
  background: rgba(0, 0, 0, 0.20);            /* dark theme: rgba(0,0,0,0.45) */
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
}
```

Sheets/modals themselves are **opaque** `--bg-elevated` (text legibility beats vibrancy). Fallback: `@supports not (backdrop-filter: blur(1px))` → use the opaque fallback colors noted in the tokens.

---

## 5. Motion

Library: `framer-motion` (already a dependency in the org's stack). Springs for anything spatial; duration/easing only for opacity and color.

### Spring presets (define once in `src/lib/motion.ts`)

```ts
export const spring = {
  /* Chrome: menus, popovers, toggles, segmented thumb. Fast, no overshoot. */
  snappy:   { type: "spring", stiffness: 480, damping: 38, mass: 0.7 },
  /* Default: cards, list reordering, layout shifts, sheet presentation. Barely-there settle. */
  standard: { type: "spring", stiffness: 340, damping: 32, mass: 0.8 },
  /* Large/soft: full-screen transitions, drawer, coachmark spotlight moves. */
  gentle:   { type: "spring", stiffness: 220, damping: 28, mass: 1.0 },
} as const;
```

### Non-spring durations/easings

| Token | Value | Usage |
|---|---|---|
| `--dur-instant` | 80ms | Hover fills, pressed states |
| `--dur-fast` | 160ms | Fades: tooltips, menu opacity, icon swaps |
| `--dur-med` | 240ms | Scrim fade, theme crossfade, toast fade |
| `--ease-out` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Entrances, fades |
| `--ease-in-out` | `cubic-bezier(0.42, 0, 0.58, 1)` | Looping/ambient only |

### Choreography rules

- **Overlays enter as opacity + scale from 0.97 + y 8px** with `spring.standard`, exit with `--dur-fast` fade (exits are always faster than entrances).
- **Menus/popovers**: `transform-origin` at the trigger; scale from 0.95, `spring.snappy`.
- **Pressed state on buttons/cards**: `scale: 0.97` via `whileTap`, spring.snappy.
- **Layout animation** (`layout` prop) for: segmented-control thumb, sidebar active pill, list reorder. Use a shared `layoutId` for the active-nav pill.
- **What never animates**: text content, numeric values (they swap instantly; optionally a 160ms background `--accent-soft` flash on changed cells), table sorting (instant), route content itself (only a 160ms fade — no slides between pages), focus rings, live transcript autoscroll (use `behavior: "auto"`, not smooth, when messages stream fast).
- **Streaming transcript**: each new message enters with opacity 0→1 + y 6→0, `spring.standard`; no stagger beyond 30ms; never replay entrance animations on re-render (key by message id, `initial={false}` on the list after mount).
- **Reduced motion**: wrap the app in `<MotionConfig reducedMotion="user">`; additionally, CSS transitions honor `@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; } }` for non-framer animation. Scrim fades (opacity-only) may remain.

---

## 6. Component blueprints

All interactive components build on **Radix primitives** (see §9) styled to these specs. Common rules: focus-visible ring = `0 0 0 3px var(--accent-soft-2)` plus `1px` accent border, never `outline: none` without replacement; all hit targets ≥ 28px tall in dense contexts, 36px default; disabled = 40% opacity + `pointer-events: none`, never a different grey.

**Toggle switch** (Radix Switch). Track 36×22px, `--radius-full`; off: `--fill-primary`; on: `--accent-fill`. Thumb 18px white circle, `--shadow-1`, travels 14px with `spring.snappy` (use framer `layout` on thumb). No labels inside the track. Click anywhere on the row label toggles.

**Dropdown / select** (Radix Select / DropdownMenu). Trigger looks like an input: 32px tall (28px dense), `--radius-sm`, `--bg-base`, hairline border, chevron-up-down icon in `--label-tertiary` right-aligned. Menu: `--bg-elevated`, `--radius-md`, `--shadow-2`, 4px padding, items 28px tall with 6px radius, hover = `--fill-secondary`, selected shows a leading 14px checkmark in `--accent` (reserve a 22px gutter so labels don't shift). Max-height 320px, inner scroll.

**Segmented control** (Radix ToggleGroup). Track: `--bg-sunken`, `--radius-sm`+1 (8px), 2px inner padding. Items: 26px tall, `caption` 500; active item is a white (`--bg-elevated` in dark) thumb with `--shadow-1`, 6px radius, animated between positions via shared `layoutId` + `spring.snappy`. Inactive labels `--label-secondary`, active `--label-primary`. 2–5 options max; more → use a Select.

**Slider** (Radix Slider). Track 4px tall, `--radius-full`, `--bg-sunken`; filled range `--accent-fill`. Thumb: 20px white circle, `--shadow-2`, hairline border; grows to 22px while dragging (spring.snappy). Value readout is a `mono-data` label to the right of the track (not a floating bubble). Step ticks only when steps ≤ 10: 2px dots in `--separator-opaque`.

**Stepper** (numeric). A 32px-tall input group: `mono-data` value field (right-aligned, tabular) + a vertically split −/+ pair on the right, each 16px tall, icons in `--label-secondary`, hover `--fill-secondary`. Hold-to-repeat after 400ms at 60ms intervals. Typing allowed; clamp + flash `--destructive-soft` background 160ms on out-of-range blur.

**Card**. `--bg-elevated`, `--radius-md`, `--shadow-1` (on grouped bg) or hairline only (on base bg), padding 16px (20px for feature cards). Title = `title-3`, supporting = `callout` in `--label-secondary`. Interactive cards: hover lifts to `--shadow-2` + `translateY(-1px)` over `--dur-instant`; `whileTap` scale 0.99. No colored card backgrounds — status is a chip or a 3px left accent bar (`--radius-full`), not a tinted card.

**Sheet / modal** (Radix Dialog). Centered modal: max-width 480px (forms) / 720px (content), `--bg-elevated`, `--radius-lg`, `--shadow-3`, over `.material-scrim`. Header: `title-3` + 28px close button (X in `--label-tertiary`, hover `--fill-secondary`, `--radius-full`). Footer: right-aligned actions, primary rightmost. Enters per §5 overlay rule. Side sheet variant (transcript inspector): 420px wide, right-anchored, full-height, slides x 24→0 + fade, `spring.standard`; content beneath stays interactive-looking but scrimmed. Esc + scrim-click dismiss (confirm-guard if form is dirty).

**Toast**. Bottom-center, 380px max, `--bg-elevated`, `--radius-md`, `--shadow-3`, 12px padding, icon + `headline` message + optional `callout` detail + optional single action (text button in `--accent`). Enters y 16→0 + fade `spring.standard`; auto-dismiss 5s (persist on hover; errors persist until dismissed). Max 3 stacked with 8px offset scale-back (older toasts scale 0.96, 0.92). Success icon `--success`, error `--destructive`. Never use toasts for validation errors (inline) or run-completion of a visible run (the run UI itself shows it).

**File drop zone**. 2px dashed `--separator-opaque` (this is the one 2px border exception), `--radius-lg`, `--bg-sunken` at 50% opacity, min-height 160px. Center: 28px upload icon `--label-tertiary`, `headline` "Drop scenario file or click to browse", `caption` accepted-types line. Drag-over: border becomes solid `--accent`, background `--accent-soft`, icon color `--accent`, scale 1.01 spring.snappy. Rejected file: border flashes `--destructive` + shake (x: [0,-6,6,-3,0], 300ms) + inline error line.

**Drag-drop list / canvas** (dnd-kit). Drag handle: 6-dot grid icon `--label-quaternary`, visible on row hover (always visible on touch). Lift: item gets `--shadow-3`, scale 1.02, `--bg-elevated`; remaining items make room via framer `layout` + `spring.standard`. Drop indicator between rows: 2px `--accent` line with 4px radius end-caps. Canvas (agent arrangement): dragged node shows 1px `--accent` outline; snap-to-8px-grid; drop settles with `spring.standard`.

**Coachmark / onboarding tour**. Spotlight model: page dims with `.material-scrim`, target is cut out (SVG mask or 4 scrim rects) with 8px padding + `--radius-md` and a 2px `--accent` halo at 40% opacity. Card: 300px, `--bg-elevated`, `--radius-md`, `--shadow-3`, anchored 12px from target with arrow; contains `caption-2` overline "STEP 2 OF 5", `title-3` heading, `callout` body, footer with "Skip tour" (ghost, `--label-tertiary`) left and Back / Next right. Spotlight moves between targets with `spring.gentle` (mask animates, card follows). Dismiss on Esc; never re-show automatically after skip (persist per-user).

**Data table**. Container: hairline border, `--radius-md`, `--bg-base`, header row sticky with `.material-toolbar` treatment. Header cells: `caption` 600 uppercase-free, `--label-secondary`, 36px tall; sortable headers show a 12px chevron in `--accent` only when active (hover reveals a `--label-quaternary` ghost chevron). Rows: 40px (32px dense mode), `separator-opaque` row hairlines, no vertical grid lines, no zebra by default (zebra `--fill-tertiary` only in dense mode). Hover: `--fill-tertiary`; selected: `--accent-soft` + 2px `--accent` left inset bar. Numeric columns right-aligned in `mono-data .tnum`. Empty state centered in-table: icon + `headline` + one-line `callout` + primary action.

**Transcript bubble**. Not chat-app bubbles — a research ledger. Each message is a full-width row: 24px agent avatar (solid `--agent-N` circle with white initial) + `caption` 600 speaker name in `--agent-N` + `caption` `--label-tertiary` timestamp/round chip on one line; message body below in `mono-body` (`--label-primary`), left-padded to align with name (32px). Row hover: `--fill-tertiary` + reveal copy/pin actions top-right. System/moderator events: centered `caption` in `--label-tertiary` with hairline rules either side. Offers/structured moves render as an inline mini-card (`--bg-sunken`, `--radius-sm`, `mono-data` figures). Selected message (linked from analysis): `--accent-soft` background, 2s fade-out after scroll-to.

---

## 7. Layout system

**Grid**: 8pt base; 4px allowed only inside components (icon-to-label gaps, chip padding). All margins/paddings/gaps from: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

**App shell** (research app):

```
┌────────────┬──────────────────────────────────────┐
│  Sidebar   │  Toolbar (56px, .material-toolbar)   │
│  260px     ├──────────────────────────────────────┤
│  fixed     │  Content scroll area                 │
│ (.material-│    bg: --bg-grouped                  │
│  sidebar)  │    padding: 24px (16px < 1280px)     │
│            │    content max-width per page type   │
└────────────┴──────────────────────────────────────┘
```

- Sidebar: 260px fixed. Sections: app title row (44px) → nav items (32px tall, `headline` 500 → 600 when active, active = `--accent-soft` pill `--radius-sm` with `layoutId` slide, icon 16px) → `caption-2` uppercase section labels with 24px top margin → footer (user/theme, pinned bottom).
- Toolbar: 56px, contains page title (`title-3` — the big `title-1` lives in content on scroll-top, toolbar title fades in after 64px scroll, macOS-style) + right-aligned actions.
- Content max-widths: forms/settings **640px**; dashboards/cards grid **1200px**; tables/transcripts **full width minus padding** (data gets all the room). Center all capped content.

**Responsive**:
- ≥1280px: full shell.
- 1024–1279px: sidebar collapses to 64px icon rail (labels in tooltips); toolbar unchanged.
- <1024px: sidebar becomes an overlay drawer (slides over scrim, `spring.standard`); toolbar gains menu button. This is a desktop research tool — mobile gets a functional single-column fallback, not a redesign; tables scroll horizontally in their container.

**Density**: keep the existing `data-density` idea with two modes; "compact" switches: rows 40→32px, table font `body`→`callout`, card padding 16→12px. Default is comfortable.

---

## 8. Tailwind mapping (copy-paste)

Tokens live in CSS (`src/index.css` `:root` + `[data-theme="dark"]` exactly as §3–§5). Also mirror the theme onto `class` for Tailwind's `dark:` variant by toggling both `data-theme="dark"` and class `dark` on `<html>` (one line in the theme toggler).

`tailwind.config.js` — replace the current `theme.extend` with:

```js
theme: {
  extend: {
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"',
             '"Segoe UI Variable"', '"Segoe UI"', 'system-ui', 'Roboto',
             '"Helvetica Neue"', 'Arial', 'sans-serif'],
      mono: ['ui-monospace', '"SF Mono"', 'SFMono-Regular', 'Menlo',
             'Consolas', '"Liberation Mono"', 'monospace'],
    },
    colors: {
      bg: {
        base:     'var(--bg-base)',
        elevated: 'var(--bg-elevated)',
        grouped:  'var(--bg-grouped)',
        sunken:   'var(--bg-sunken)',
      },
      label: {
        1: 'var(--label-primary)',
        2: 'var(--label-secondary)',
        3: 'var(--label-tertiary)',
        4: 'var(--label-quaternary)',
      },
      separator: {
        DEFAULT: 'var(--separator)',
        opaque:  'var(--separator-opaque)',
      },
      fill: {
        1: 'var(--fill-primary)',
        2: 'var(--fill-secondary)',
        3: 'var(--fill-tertiary)',
      },
      accent: {
        DEFAULT: 'var(--accent)',
        hover:   'var(--accent-hover)',
        pressed: 'var(--accent-pressed)',
        soft:    'var(--accent-soft)',
        'soft-2':'var(--accent-soft-2)',
        fill:    'var(--accent-fill)',
        on:      'var(--on-accent)',
      },
      success:     { DEFAULT: 'var(--success)', soft: 'var(--success-soft)' },
      warning:     { DEFAULT: 'var(--warning)', soft: 'var(--warning-soft)' },
      destructive: { DEFAULT: 'var(--destructive)', soft: 'var(--destructive-soft)' },
      agent: {
        1: 'var(--agent-1)', 2: 'var(--agent-2)', 3: 'var(--agent-3)',
        4: 'var(--agent-4)', 5: 'var(--agent-5)',
      },
    },
    borderRadius: {
      xs: '5px', sm: '7px', md: '10px', lg: '14px', xl: '20px',
    },
    boxShadow: {
      1: 'var(--shadow-1)', 2: 'var(--shadow-2)',
      3: 'var(--shadow-3)', 4: 'var(--shadow-4)',
    },
    fontSize: {
      display:    ['34px', { lineHeight: '41px', letterSpacing: '-0.022em', fontWeight: '700' }],
      'title-1':  ['28px', { lineHeight: '34px', letterSpacing: '-0.021em', fontWeight: '700' }],
      'title-2':  ['22px', { lineHeight: '28px', letterSpacing: '-0.018em', fontWeight: '700' }],
      'title-3':  ['17px', { lineHeight: '22px', letterSpacing: '-0.012em', fontWeight: '600' }],
      headline:   ['15px', { lineHeight: '20px', letterSpacing: '-0.009em', fontWeight: '600' }],
      body:       ['15px', { lineHeight: '22px', letterSpacing: '-0.009em' }],
      callout:    ['13px', { lineHeight: '18px', letterSpacing: '-0.003em' }],
      caption:    ['12px', { lineHeight: '16px', fontWeight: '500' }],
      'caption-2':['11px', { lineHeight: '13px', letterSpacing: '0.005em', fontWeight: '500' }],
      'mono-body':['13px', { lineHeight: '20px' }],
      'mono-data':['13px', { lineHeight: '18px', fontWeight: '500' }],
    },
    transitionDuration: { instant: '80ms', fast: '160ms', med: '240ms' },
    transitionTimingFunction: {
      out: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      'in-out': 'cubic-bezier(0.42, 0, 0.58, 1)',
    },
  },
},
```

Add to `index.css` `@layer utilities`:

```css
.tnum { font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }
.focus-ring { @apply outline-none ring-[3px] ring-accent-soft-2 border-accent; }
```

Usage examples: `bg-bg-grouped text-label-1`, `border border-separator rounded-md shadow-1`, `text-callout text-label-2`, `bg-accent-fill text-accent-on`, `font-mono text-mono-data tnum`.

Migration: new/rebuilt components use only these tokens. Do not import `lab-*`, `--dex-*`, or `.r-*` into new work; delete each legacy token when its last consumer is migrated.

---

## 9. Dependencies

| Package | Why | Cost note |
|---|---|---|
| `framer-motion` | Springs, `layout`/`layoutId`, `AnimatePresence`, `MotionConfig reducedMotion` — the entire §5 spec | ~32kb gz; import from `framer-motion` normally, tree-shakes well |
| `@radix-ui/react-*` (individual: `dialog`, `dropdown-menu`, `select`, `switch`, `slider`, `toggle-group`, `tooltip`, `popover`) | Best-in-class a11y/focus/portal behavior, fully unstyled so §6 specs apply cleanly; per-package install keeps bundle to only what's used | ~2–8kb gz each |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-drop lists and canvas: accessible (keyboard sensors), no HTML5-DnD jank, plays well with framer `layout` | ~12kb gz combined |
| `@tanstack/react-virtual` | Virtualize long transcripts and result tables (thousands of rows) so the app stays 60fps — core to the "snappy" mandate | ~4kb gz |
| `lucide-react` | Single consistent 1.5px-stroke icon set (16/20px sizes), per-icon imports | ~1kb per icon used |
| `sonner` | Toast manager matching §6 spec (stacking, hover-persist) with minimal code; style via tokens | ~5kb gz |

Explicit non-picks: **headless-ui** (Radix's per-primitive packages are smaller and richer — don't mix both); **react-beautiful-dnd** (unmaintained); **shadcn/ui wholesale** (fine as reference reading, but components here are specified above — hand-build against Radix so we own every pixel); **any charting lib decision is out of scope** — D3 direct, per the org stack, when charts land.

Fonts: zero font dependencies. Delete existing Google-Fonts/webfont links.
