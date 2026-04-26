# Handoff: Multi-Agent-Chat — Research Module

## Overview
This package describes a new top-level **Research** module for **AI2AI-Chat** — a hi-fi design for a hybrid research console used by DEXLab (Maastricht University, School of Business and Economics) for running large-scale multi-agent LLM experiments.

The module sits next to the existing **Quick Chat** in the same app shell and routes under `/research/*`. It contains four primary screens:

1. **Library** — gallery of scenario templates (paper replications + user-owned drafts)
2. **Scenario Builder** — deep, onboarding-friendly editor with four tabs: Agents · Turn policy · Prompts · Outcomes
3. **Run Dashboard** — live monitoring of an experiment in progress (cells × dyads, progress, anomalies, event log)
4. **Transcript Viewer** — single-dyad microscope (left rail: agents/slots, center: turn-by-turn transcript with extracted offers, right: supervisor decisions + analyst JSON)

The look is a **hybrid**: DEXLab brand tokens (Deep Blue / Light Blue / Bright Orange) layered on top of an ai2aichat-style chrome (sidebar + topbar, dense data UI).

## About the Design Files
The files in this bundle are **design references created in HTML/JSX** — prototypes showing intended look and behavior, **not production code to copy directly**.

Your task is to **recreate these designs in AI2AI-Chat's existing environment** (presumably React/TypeScript with the styling system already in use — Tailwind, CSS modules, styled-components, whatever the repo has chosen) using its established patterns, components, and routing.

Treat the JSX files in `design-files/` as a visual specification, not as code to import. The CSS files contain the **design tokens** that should be ported into the codebase's token system.

## Fidelity
**High-fidelity (hifi).** The designs are pixel-final: exact colors (DEXLab brand), exact typography (Open Sans 700 for headings, Avenir/Myriad Pro for body, JetBrains Mono for tabular data), exact spacing (compact density tokens), and exact copy. The developer should match the visual treatment closely.

The HTML prototype includes a **Tweaks panel** with `density` (spacious/compact) and `theme` (light/dark) controls. **The compact, light defaults are the canonical look** — the user has settled on compact. Spacious is provided as an alternate density and dark mode is a parallel palette; both should be supported but compact-light is the source of truth.

## Files
The `design-files/` folder mirrors the prototype project structure:

```
design-files/
├── Multi-Agent-Chat Research.html   ← entry point — open this in a browser
├── app.css                           ← shell + chrome styles
├── dexlab.css                        ← DEXLab brand tokens (colors, fonts, density)
├── shell.jsx                         ← AppShell: topbar + sidebar
└── screens/
    ├── library.jsx + library.css         ← screen 1
    ├── builder.jsx + builder.css         ← screen 2
    ├── run.jsx + run.css                 ← screen 3
    └── transcript.jsx + transcript.css   ← screen 4
```

`SPEC.md` (next to this README) is the **detailed implementation spec** — read it. It contains:
- Every design token with hex value
- Every component's structure, padding, typography
- All exact copy for buttons, labels, sub-headings, prompt content
- Mock data tables for templates, agents, cells, transcript turns, supervisor decisions, analyst JSON
- A suggested implementation order

The spec is precise; don't ad-lib copy or invent values.

## Screens / Views

### 1 · Library — `/research/library`
**Purpose:** Browse + clone scenario templates. Entry point for starting a new experiment.

**Layout:**
- Page head: title "Scenario Library", actions `[Browse paper-replications]` + `[+ Blank scenario]` (orange primary).
- Search row: search pill (with `⌘K` kbd badge) + filter chips (All domains · Negotiation · Law · Psychology · Marketing) + sort/filter ghost buttons.
- Three vertical sections, each a responsive card grid:
  1. **Your scenarios** (3 small cards) — user-owned drafts with edit/run links
  2. **Featured templates** (3 large scenario cards) — curated paper replications
  3. **More templates** (3 more cards)

**Card structure (large):** soft-tinted icon tile · domain chip + optional "★ Featured" chip · title (Open Sans 700 15px) · 2-line blurb · stats row (agents/rounds/runs/cites) · mono tag chips · ghost-button footer "Preview · Clone".

**All copy and 6 template entries are in SPEC.md §3.**

### 2 · Scenario Builder — `/research/scenarios/:id`
**Purpose:** Onboarding-grade editor for defining a multi-agent scenario. The deepest screen.

**Layout:**
- Custom page head: breadcrumb · title · "Last saved" sub · actions [Preview run / Duplicate / Use in experiment].
- 4-tab bar: **Agents** (✓) · **Turn policy** (✓) · **Prompts** (• warn) · **Outcomes**. Each tab has a numbered circle, status icon, and active state with bottom-border accent.
- Tab body: typically `1fr 280px` two-column split — main editor on left, sticky aside cards on the right that explain concepts (e.g. "What's the difference between domain and supervisor agents?", "What is a round?").

**Tab content (full detail in SPEC.md §4):**
- **Agents:** 4 agent cards (Buyer/Seller/Judge/Analyst) with avatar, name, role chip, description, and a 5-column spec strip (Provider · Model · Temp · Max tokens · Prompt size).
- **Turn policy:** 3 selectable policy cards (Strict alternation [recommended] · Moderator-driven · Event-driven), then a Round structure block with rounds + stop conditions.
- **Prompts:** 2-column split — Prompt template with `{SLOT}` highlighting + Live preview with values substituted. Below: full-width slots table (5 rows).
- **Outcomes:** CSV column table (7 rows) + utility-function selector (Pie-split selected) + sticky CSV preview aside.

### 3 · Run Dashboard — `/research/runs/:runId`
**Purpose:** Live monitoring of an experiment in progress. Calm and confident — no flashing UI.

**Layout:**
- Page head: title with pulsing accent-2 dot + "Run #14", sub with timing/design/seed, actions [Pause / Abort / Snapshot CSV].
- **6 stat tiles** in a row (Completed · In flight · Queued · Failed · Anomalies · Token spend) — each white panel with 11px uppercase label + 26px tabular-num value + sub.
- **Overall progress** card: header + `279 / 480` + ETA, then a 28px segmented bar with one segment per cell, sized by `flex: cell.total`, fills animating green (done) / blue (running).
- **2-column body** `1fr 360px`:
  - **Cells table** (8 rows): cell id with status dot · factor chips · progress bar · done/fail/anom counts · status chip · Inspect button.
  - **Live event log** (8 rows, dashed dividers, scrolling) + **Anomalies (7)** (4 categories with counts + examples).

A **pulse-dot** primitive (6px circle + animated ring) is reused on the title, running cell rows, and the "Streaming" log badge.

### 4 · Transcript Viewer — `/research/runs/:runId/dyad/:dyadId`
**Purpose:** Inspect a single dyad's full conversation + supervisor judgments + analyst output.

**Layout:**
- Page head with breadcrumb · title (`d_0247` mono) · green "Deal · €82.50" chip · prev/next nav.
- Meta strip: 7 key/value pairs (Cell · buyer_capability · seller_provider · Seed · Rounds · Tokens · Duration).
- **3-column body** `240px 1fr 340px`:
  - **Left rail:** Agents (4 small cards), Slot bindings (5 rows), Anomalies status pill.
  - **Center stream** (canvas-tinted bg): 2 system pseudo-bubbles bracket the transcript (start: turn order; end: [ACCEPT] confirmation). 7 turns alternate left (buyer, white bubble) / right (seller, orange-tinted), with `Round N` dividers between rounds. Each bubble has meta row, body text, and a dashed-bordered "OFFER EXTRACTED" footer with mono pill values (price/volume/term).
  - **Right rail:** 4 Supervisor decision cards (one per round, with classification chip + confidence bar + rationale) + Analyst extractions JSON card.

**All transcript copy + supervisor verdicts + JSON are in SPEC.md §6.**

## Interactions & Behavior

### Navigation
- Sidebar nav: Workspace (Quick Chat, History) · **Research** (Library, Scenarios, Experiments, Runs, Results) · Account (Settings).
- Active item: bg `--surface-active`, text+icon `--accent-2`, weight 600.
- Nav badges: scenario/experiment/run counts. Active badge uses orange-soft pill.

### Library
- Filter chips toggle which template grid is visible.
- Card hover: border darkens to `--line-2`, box-shadow upgrades to `shadow-2`.
- "Clone" button → creates a copy and routes to `/research/scenarios/:newId`.

### Scenario Builder
- Tab switching is local route state, not full nav.
- "Use in experiment" → routes to experiment runner.
- Slot tokens (`{NAME}`) in the Prompts tab live-highlight; live preview re-renders on every change.
- Unsaved-changes indicator: tab number circle gets a warn dot.

### Run Dashboard
- Pulse-dot animates `2s` infinite (opacity + scaling ring).
- Progress bars use a smooth `width` transition, ~`240ms ease-standard`.
- "Inspect" on a cell row → routes to a cell view (or directly to the first dyad of that cell).
- Pause/Abort confirm in a modal (not designed in this spec — match existing app conventions).

### Transcript Viewer
- Prev/Next buttons cycle dyads within the same cell.
- "Show offers" / "Tokens" / "Hide system" chips toggle visibility of the offer footers, token counts, and system bubbles respectively.
- Bubble animation on load: 8px upward fade-in, staggered `40ms`.

### Animations
- `--dur-fast`: 140ms (chip toggles, hover)
- `--dur-med`: 240ms (bar fills, panel transitions)
- `--ease-standard`: cubic-bezier(0.2, 0.6, 0.2, 1)
- Pulse keyframes documented in SPEC.md §5.

## State Management
Suggested top-level store (use whatever AI2AI-Chat already has — Zustand, Redux, Context):

- `density: 'compact' | 'spacious'` — persist to localStorage, default `compact`
- `theme: 'light' | 'dark'` — persist, default `light` (or follow existing app preference)
- `library.filter: string` — selected domain filter
- `builder.activeTab: 'agents' | 'turn' | 'prompts' | 'outcomes'`
- `builder.selectedAgent: string` — for Prompts tab dropdown
- `run.eventLog: Event[]` — streamed via existing run-status websocket/SSE
- `transcript.viewToggles: { offers: boolean, tokens: boolean, system: boolean }`

Data fetching follows AI2AI-Chat's existing patterns. The spec assumes:
- `GET /api/research/templates`
- `GET /api/research/scenarios`, `POST /api/research/scenarios`, `PUT /api/research/scenarios/:id`
- `GET /api/research/runs/:id` (poll or stream)
- `GET /api/research/runs/:id/events?since=…` (SSE for live log)
- `GET /api/research/runs/:id/dyads/:dyadId` (full transcript + supervisor + analyst payload)

## Design Tokens

Full token list with rationale is in `design-files/dexlab.css` and SPEC.md §1. Key tokens:

### Brand colors (DEXLab)
- `--dex-deep-blue` `#001C3D`
- `--dex-light-blue` `#00A2DB` → `--accent-2`
- `--dex-bright-orange` `#E84E10` → `--accent-1` (CTA)
- `--dex-light-grey` `#D5D9DC`

### Surfaces (light)
- canvas `#F5F7FA` · panel `#FFFFFF` · rail `#FFFFFF` · sunken `#F0F3F7` · hover `#EEF1F4`
- `--line-1` `#E5E9EE` · `--line-2` `#D5D9DC`
- text 1–4 from `#001C3D` → `#97A2B3`
- success `#2EA36B` · warning `#E8A110`

### Surfaces (dark) — parallel palette
- canvas `#0A1424` · panel `#11203A` · rail `#0E1A30` · sunken `#0A1424`
- text 1–4 from `#E9EEF6` → `#5C6B86`

### Provider dot colors
- OpenAI `#10A37F` · Anthropic `#D97757` · Google `#4285F4` · Mistral `#FA520F` · Meta `#0064E0` · Alibaba `#FF6A00`

### Typography
- Headings: **Open Sans 700** only, `-0.01em` letter-spacing
- Body: **Avenir** (fallback Myriad Pro)
- UI / nav / labels: **Myriad Pro** (fallback Open Sans)
- Numerics: tabular-nums via `font-feature-settings: "tnum"`
- Mono: **JetBrains Mono** (fallback SF Mono / Menlo)

### Density (compact — canonical)
- card padding `16px` · row padding `8px` · section gap `20px`
- body fs `13px` · label fs `11px` · row height `36px`

### Density (spacious)
- card padding `24px` · row padding `14px` · section gap `32px`
- body fs `14px` · label fs `12px` · row height `44px`
- page-head padding bumps from `16/24/12` to `24/32/16`; page-body from `16/24` to `24/32`

### Layout
- Sidebar `232px` · topbar `56px`
- Radii: `4 / 6 / 8 / 999`
- Shadows: `shadow-1` (subtle hairline), `shadow-2` (card hover), `shadow-3` (modal/menu), `shadow-focus` (`0 0 0 3px rgba(0,162,219,.35)`)

## Assets
- **Fonts:** Open Sans, Avenir/Myriad Pro, JetBrains Mono. Use whatever the AI2AI-Chat repo has wired (likely a self-hosted set or a Google Fonts include). The DEXLab font stack falls back gracefully to system fonts.
- **Logo:** the small "M" brand mark in the topbar is a CSS-built construct (rounded square, half blue / half orange diagonal split, gradient text-fill on the letter). No image asset.
- **DEXLab footer card** uses an "DX" textmark in orange-soft on a 28px square — also CSS, no image.
- **Icons:** every icon in the prototype is an inline 1.5px-stroke SVG drawn in the `Icon` component in `shell.jsx`. The icons used across the four screens are listed in SPEC.md §7. Match these — no icon library import.
- **Provider logos:** represented by colored dots only. No vendor wordmarks.

## Notes for the developer
1. **Read SPEC.md first.** It's exhaustive. The README orients; the spec implements.
2. **Compact is the default.** If you only ship one density, ship compact.
3. **Don't import the JSX files** — they're a Babel-in-browser prototype and use global components shared via `window`. Re-implement using your codebase's idioms.
4. **The module hangs off `/research/*`** but should reuse the same AppShell as the rest of AI2AI-Chat. The Topbar/Sidebar shown in the prototype is meant to mirror what's already there; if AI2AI-Chat has different chrome, slot the screens into that instead.
5. **Brand tokens are non-negotiable.** Deep Blue / Light Blue / Bright Orange are DEXLab's identity. Don't substitute.
6. **All copy is real.** Don't paraphrase scenario blurbs, prompt templates, or supervisor rationales — they were written for this design.

## Implementation order
1. Add tokens (SPEC.md §1) to your design system / CSS variables.
2. Build/extend `AppShell` (Topbar + Sidebar + Icon set).
3. Library → Run Dashboard → Transcript Viewer → Scenario Builder. Builder is largest; do it last when you have the patterns.
4. Wire `density` + `theme` to your store. Default density `compact`.
