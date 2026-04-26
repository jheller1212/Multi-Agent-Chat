# Claude Code Prompt — Multi-Agent-Chat Research Module (Compact)

Copy everything below into Claude Code. Paste as a single message after `cd`-ing into the AI2AI-Chat repo.

---

You are extending **AI2AI-Chat** (React 18 + TypeScript + Tailwind + Vite, no component library) with a new top-level **Research** module that sits next to the existing **Quick Chat** feature. The Research module has four screens: Library, Scenario Builder, Run Dashboard, Transcript Viewer. Build it to match the design spec below **exactly** — this is a hi-fi handoff, not a rough sketch.

The visual system is a **hybrid**: DEXLab brand tokens (Maastricht University research lab) layered on top of an ai2aichat-style sidebar+topbar app chrome. Density mode is **compact** by default — this brief specifies the compact values throughout. (A `density="spacious"` toggle exists; spacious values are listed at the end.)

Stack notes:
- Use Tailwind via `@apply` in `app.css`, or extend the Tailwind theme with the tokens below — your call. The variables-based approach below is the source of truth; map to Tailwind however your codebase does it.
- No new dependencies. No icon library — inline Lucide-style SVG icons (1.5px stroke, `currentColor`).
- All screens render inside `<AppShell>` (sidebar + topbar). Routes live under `/research/*`.

---

## 1 · Design tokens

Add these to `app.css`. They layer on top of the DEXLab base palette.

```css
:root {
  /* === DEXLab brand === */
  --dex-deep-blue:    #001C3D;
  --dex-light-blue:   #00A2DB;   /* primary accent */
  --dex-bright-orange:#E84E10;   /* CTA / highlight */
  --dex-light-grey:   #D5D9DC;

  /* === Surfaces (light) === */
  --surface-canvas:   #F5F7FA;
  --surface-panel:    #FFFFFF;
  --surface-rail:     #FFFFFF;
  --surface-sunken:   #F0F3F7;
  --surface-hover:    #EEF1F4;
  --surface-active:   rgba(0,162,219,0.08);

  --line-1: #E5E9EE;     /* hairline */
  --line-2: #D5D9DC;     /* stronger border */

  --text-1: #001C3D;     /* primary */
  --text-2: #3D5070;
  --text-3: #6B7A91;
  --text-4: #97A2B3;

  --accent-1: #E84E10;            /* orange */
  --accent-1-soft: rgba(232,78,16,0.10);
  --accent-1-hover: #C74109;
  --accent-2: #00A2DB;            /* light blue */
  --accent-2-soft: rgba(0,162,219,0.10);

  --success: #2EA36B;
  --warning: #E8A110;

  /* === Typography === */
  --font-h:   'Open Sans', 'Helvetica Neue', Arial, sans-serif;       /* headings, weight 700 only */
  --font-app: 'Avenir', 'Myriad Pro', 'Helvetica Neue', Arial, sans-serif;  /* body */
  --font-ui:  'Myriad Pro', 'Open Sans', sans-serif;                  /* nav, labels, buttons */
  --font-num: 'Myriad Pro', 'Avenir', sans-serif;                     /* tabular nums (use font-feature-settings: "tnum") */
  --font-mono:'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;

  /* === Compact density === */
  --d-pad-card: 16px;
  --d-pad-row:  8px;
  --d-gap-section: 20px;
  --d-fs-body: 13px;
  --d-fs-label: 11px;
  --d-row-h: 36px;

  /* === Layout === */
  --rail-w: 232px;
  --topbar-h: 56px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-pill: 999px;

  --shadow-1: 0 1px 2px rgba(0,28,61,.06), 0 1px 1px rgba(0,28,61,.04);
  --shadow-2: 0 4px 10px rgba(0,28,61,.08), 0 2px 4px rgba(0,28,61,.04);
  --shadow-3: 0 12px 28px rgba(0,28,61,.12), 0 4px 8px rgba(0,28,61,.06);
  --shadow-focus: 0 0 0 3px rgba(0,162,219,.35);

  --ease-standard: cubic-bezier(0.2, 0.6, 0.2, 1);
  --dur-fast: 140ms;
  --dur-med:  240ms;
}

/* Dark mode */
[data-theme="dark"] {
  --surface-canvas: #0A1424;
  --surface-panel:  #11203A;
  --surface-rail:   #0E1A30;
  --surface-sunken: #0A1424;
  --surface-hover:  #182A48;
  --surface-active: rgba(0,162,219,0.16);
  --line-1: #1F2F4D;
  --line-2: #2C3E61;
  --text-1: #E9EEF6;
  --text-2: #B6C2D6;
  --text-3: #8595B0;
  --text-4: #5C6B86;
  color-scheme: dark;
}
```

**Provider colors** (used as 8px dots next to model names):
OpenAI `#10A37F` · Anthropic `#D97757` · Google `#4285F4` · Mistral `#FA520F` · Meta `#0064E0` · Alibaba `#FF6A00`.

---

## 2 · App shell — sidebar + topbar

CSS Grid: `grid-template-columns: 232px 1fr; grid-template-rows: 56px 1fr`. Topbar spans both columns.

**Topbar (56px tall, white, 1px bottom border `--line-1`):**
- Left, occupying the rail width with a right border: 28×28 brand mark (rounded 7px, half blue / half orange diagonal split, white interior cutout via `::after`, letter "M" in gradient text-fill) + brand name `Multi-Agent-Chat` (Open Sans 700, 15px, `-0.01em`) with a small uppercase tag `RESEARCH` in `--text-3` 11px next to it.
- Center: breadcrumb chain with `/` separators, last segment `--text-1` 500w.
- Right: `[Docs]` ghost button, bell icon-button, theme toggle (sun/moon), user pill — 24px circle avatar with blue→orange gradient + initials, then handle in 12px.

**Sidebar (232px, white, 1px right border):**
- Padding `14px 12px`. Sections labeled with 10.5px uppercase 0.08em tracking caption in `--text-4`:
  - **WORKSPACE** — Quick Chat, History
  - **RESEARCH** — Library, Scenarios (badge "12"), Experiments (badge "4"), Runs (badge "2"), Results
  - **ACCOUNT** — Settings
- Each nav item: 8×12 padding, 6px radius, 16px icon + label, badge pill on the right. Hover: `--surface-hover`. Active: bg `--surface-active`, text+icon `--accent-2`, weight 600. Active badge: bg `--accent-1-soft`, text `--accent-1`.
- Footer (push to bottom with `mt-auto`, 1px top border): workspace card — 28px square logo "DX" (orange-soft bg, orange text), then `DEXLab · SBE` (12.5px 600w) above `Maastricht U.` (10.5px `--text-3`).

**Reusable button styles**
- `.btn` base: `font-ui` 13px 600w, padding `8px 14px`, radius 6px, gap 6px.
- `.btn-primary`: bg `--accent-1`, white text, hover `--accent-1-hover`. **Used for: Blank scenario, Use in experiment, Add domain agent.**
- `.btn-secondary`: bg `--surface-panel`, border `--line-2`, text `--text-1`, hover bg `--surface-hover`.
- `.btn-ghost`: transparent, `--text-2`, hover bg `--surface-hover`.
- `.btn-sm`: 5×10 padding, 12px font.
- `.icon-btn`: 32×32, transparent, 6px radius, hover bg `--surface-hover`.

**Chips (pill, 11px 600w, 3×9px padding, 999px radius):**
- `.chip-grey`: bg `--surface-sunken`, color `--text-3`
- `.chip-blue`: bg `--accent-2-soft`, color `--accent-2`
- `.chip-orange`: bg `--accent-1-soft`, color `--accent-1`
- `.chip-green`: bg `rgba(46,163,107,0.10)`, color `--success`

**Page header pattern (used on every screen):**
```
.page-head: padding 16/24/12 (compact), bg --surface-panel, border-bottom 1px --line-1
  .page-title: Open Sans 700, 19px (compact), -0.01em
  .page-sub:   13px, --text-3
.page-body: padding 16/24 (compact)
```

---

## 3 · Screen 1 — Library (`/research/library`)

**Page head:**
- Title: "Scenario Library". Sub: "Templates for multi-agent experiments. Clone any to start your own scenario."
- Right actions row: `[Browse paper-replications]` secondary, `[+ Blank scenario]` primary.
- Search row (margin-top 18px): search input pill (1px `--line-2` border, 6px radius, 280–480px wide flex item, search icon left, `⌘K` kbd badge right) + filter chips: **All domains · Negotiation · Law · Psychology · Marketing**. Selected filter uses `chip-blue`, others `chip-grey`. After a vertical divider: `[+ More filters]` and `[↓ Most used]` ghost buttons.

**"Your scenarios" section** (h2 "Your scenarios", 14px Open Sans 700; right-aligned `View all →` link)
3-card grid (`auto-fill, minmax(260px, 1fr)`, 10px gap). Each is a small card: title 13px 600w; meta line in 11.5px `--text-3` showing "Based on **{template}** · Updated {when} · {N} runs"; ghost-button row "Edit · Run". Add a `chip-orange "Draft"` if `draft=true`.

Mock data (3 entries):
1. `B2B Renegotiation — capability variant` · Procurement Negotiation · 2 days ago · 4 runs
2. `Mediation w/ asymmetric info` · Mediation · last week · 1 run
3. `Sales-rep persuasion (draft)` · Persuasion Cascade · just now · 0 runs · **Draft**

**"Featured templates" section** (subtitle "Curated by DEXLab — replications of published studies")

**"More templates" section**

Both feed a `auto-fill, minmax(300px, 1fr)` 14px-gap grid of **scenario cards**:

```
.scenario-card  18px padding, 8px radius, white, 1px --line-1 border, flex column 10px gap
  .sc-head     row, justify-between
    .sc-icon   36×36, 8px radius, soft-tinted bg with same-tone icon (blue/orange/grey)
    .sc-meta   row of chips: domain (grey), and "★ Featured" (orange) if applicable
  .sc-title    Open Sans 700, 15px
  .sc-blurb    12.5px, --text-2, line-height 1.55
  .sc-stats    row, 12px gap, 11.5px --text-3, each "icon + value": agents, rounds, runs, [cites]
  .sc-tags     small mono tags, 10.5px, --surface-sunken bg, 3px radius
  .sc-foot     1px top border --line-1, padding-top 10px, right-aligned: [👁 Preview] [⎘ Clone] (both ghost-sm)
```

Hover: border → `--line-2`, box-shadow → `--shadow-2`.

Mock template data (6 entries — first 3 are `featured: true`):

| id | title | domain | agents | rounds | tags | accent | runs | cites | icon |
|---|---|---|---|---|---|---|---|---|---|
| proc-neg | Procurement Negotiation | Negotiation | 2 | 12 | multi-issue, BATNA, utility | blue | 38 | 4 | handshake |
| legal-adv | Legal Advocacy | Law | 3 | 6 | advocacy, judge-decision, rationale | orange | 21 | 2 | scale |
| mediation | Mediation | Negotiation | 3 | 14 | integrative, mediator, settlement | blue | 12 | 1 | sparkle |
| cbt | CBT Therapy Session | Psychology | 2 | 10 | protocol-adherence, open-ended | grey | 6 | 0 | spark |
| persuade | Persuasion Cascade | Marketing | 2 | 8 | attitude-change, pre-post | grey | 9 | 1 | target |
| jury | Jury Deliberation | Law | 6 | 20 | group, verdict, leadership | grey | 3 | 0 | layers |

Blurbs (full text):
- **Procurement Negotiation** — "Buyer and seller negotiate price, volume and delivery terms. Walk-away thresholds, BATNA modelling, multi-issue bargaining."
- **Legal Advocacy** — "Plaintiff and defendant advocates argue before a judge. Closed-record advocacy, three-claim structure, ruling and rationale."
- **Mediation** — "Neutral mediator shepherds two disputing parties toward settlement. Caucus + joint-session protocol, integrative bargaining."
- **CBT Therapy Session** — "Therapist guides a patient through cognitive behavioural reframing. Open-ended affective protocol with adherence rubric."
- **Persuasion Cascade** — "Source agent attempts to shift target's stated belief on a public-issue prompt. Pre/post Likert, argument coding."
- **Jury Deliberation** — "N=6 jurors deliberate on a vignette case. Holdouts, leadership patterns, verdict pathway."

---

## 4 · Screen 2 — Scenario Builder (`/research/scenarios/:id`)

This is the **deepest** screen. Onboarding-friendly, generous, with side aside-cards explaining concepts.

**Page head (custom variant `.sb-head`):**
- Crumb row, 12px `--text-3`: `Scenarios > B2B Renegotiation — capability variant` + a `chip-grey "Forked from Procurement Negotiation"`.
- Title (19px): "B2B Renegotiation — capability variant"
- Sub: "Last saved 2 minutes ago · 4 agents · 5 slots · 12 rounds"
- Right actions: `[👁 Preview run]` ghost · `[⎘ Duplicate]` secondary · `[🧪 Use in experiment]` primary.

**Tab bar** (under the head, on a 1px bottom border).
Tabs (each: numbered circle 18×18 + label, status icon if any). Selected tab: `--accent-2` text + bottom border, numbered circle bg `--accent-2`, white text.

| # | Label | Status |
|---|---|---|
| 1 | Agents | ✓ done |
| 2 | Turn policy | ✓ done |
| 3 | Prompts | • warn dot (orange) |
| 4 | Outcomes | (none) |

### 4.1 — Agents tab

Two-column grid: `1fr 280px`. Left column = main; right column = sticky aside cards.

**Main:**
- Section head: h3 "Agents" (16px Open Sans 700) + sub "Add the AI agents that participate in this scenario. Domain agents converse; supervisors observe and classify." On the right: `[+ Add supervisor]` secondary-sm, `[+ Add domain agent]` primary-sm.
- Stack of 4 agent cards (10px gap):

```
.agent-card  white, 1px border, 8px radius, 14×16 padding, flex-col 12px gap
  .ac-head   row, 12px gap
    avatar 32×32 (blue-soft for buyer, orange-soft for seller, grey for supervisors), icon "user" or "eye"
    grow:
      row: name (Open Sans 700 14px) + chip ("Domain agent" blue / "Supervisor" grey)
      desc 12.5px --text-2, line-height 1.55
    actions: [edit][copy][trash] icon-buttons
  .ac-spec   1px top border, padding-top 12px
             5-column grid (1 / 1.3 / 0.7 / 0.7 / 1.2 fr), each cell separated by 1px right border
             Each cell: tiny uppercase 10.5px caption (Provider / Model / Temperature / Max tokens / System prompt)
                       value 12.5px 500w, mono variant for model + numbers
             Provider value gets the 8px colored dot
```

Mock 4 agents:

| name | role | desc | provider | model | temp | max | promptTokens·slots |
|---|---|---|---|---|---|---|---|
| Buyer | Domain | Procurement manager negotiating a 12-month supply contract with a target unit price and walk-away threshold. | Anthropic | claude-sonnet-4.5 | 0.70 | 800 | 212 tok · 5 slots |
| Seller | Domain | Sales rep selling on margin who must hit a quarterly volume goal. Holds private floor price. | OpenAI | gpt-4o | 0.70 | 800 | 198 tok · 4 slots |
| Judge | Supervisor | Classifies each round as Cooperative / Competitive / Stalled. Returns one label + 1-sentence rationale. | OpenAI | gpt-4o-mini | 0.00 | 200 | 84 tok · 0 slots |
| Analyst | Supervisor | Extracts structured offers (price, volume, term-months) from each agent message into JSON. | Anthropic | claude-haiku-4.5 | 0.00 | 300 | 146 tok · 1 slot |

**Aside (sticky, 12px-gap stack), each card: bg `--surface-sunken`, 1px border `--line-1`, 8px radius, 14×16 padding, 12.5px text:**

1. *Domain vs supervisor* — header "DOMAIN VS SUPERVISOR" with `?` icon. 3 paragraphs:
   - "**Domain agents** hold a role in the conversation (Buyer, Seller, Therapist). They speak, hear, and persuade."
   - "**Supervisors** observe each round and emit structured judgments (a label, a JSON extraction). They never appear in the transcript text."
   - "Most scenarios run with 2 domain + 2 supervisor agents. <a>See the protocol guide →</a>"

2. *Suggested defaults* — 3 dashed rows, each `<span>label</span> <span class=mono>value</span>`:
   - Negotiation domain · `temp 0.7`
   - Judge supervisor · `temp 0.0`
   - JSON analyst · `temp 0.0`

### 4.2 — Turn policy tab

**Main:**
- h3 "Turn policy" + sub "How agents take turns. Most scenarios use strict alternation."
- 3 selectable policy cards (vertical stack, 10px gap). Selected = `border-color: --accent-2; box-shadow: 0 0 0 1px --accent-2; bg rgba(0,162,219,0.04)`. 16×16 radio dot left, label + desc in middle, mini-viz on the right.

| id | label | recommended | desc | viz |
|---|---|---|---|---|
| strict | Strict alternation | yes | A → B → A → B. Most common. Predictable for analysis. | 4 small bubbles A/B/A/B (blue/orange) with → between, in a pill chip |
| moderated | Moderator-driven | no | A supervisor agent picks who speaks each turn. Useful for jury / panel scenarios. | M→A→M→B (M is grey, A blue, B orange) |
| event | Event-driven | no | Either agent can speak when triggered (e.g. a deadline elapses). Advanced. | A · clock-icon · B |

Mini bubbles: 22×22 circle, white text, Open Sans 700 11px. Pill bg `--surface-sunken`, 6×10 padding, 999 radius.

Recommended badge: `chip-blue "Recommended"` next to the label.

**Round structure** (h4 "ROUND STRUCTURE", uppercase 13px). Two columns 240px / 1fr:
- *Total rounds*: numeric input value `12`, width 80px, with help text "One round = full alternation cycle (A → B)".
- *Stop conditions*: vertical list of 3 condition rows (chip + text on `--surface-sunken` bg, 8×12 padding, 6px radius), then a `[+ Add condition]` ghost-sm:
  - `[ACCEPT]` (blue chip) "token in any agent message"
  - `[WALKAWAY]` (blue chip) "token in any agent message"
  - `round >= 12` (grey chip) "Hard cap on rounds"

**Aside:**
1. *What is a "round"?* — "A **round** is one full pass through your turn order — for strict alternation that's *A speaks then B speaks*." + "Supervisors run *after* each round, classifying the exchange as a unit."
2. *Heads up* card — variant with bg `--accent-1-soft`, header in `--accent-1`: "Long round caps (> 20) push token spend up sharply. A 12-round buyer/seller dyad averages ≈ 14k tokens."

### 4.3 — Prompts tab

**Full-width section (no aside on this tab).**

- Head: h3 "Prompts" + sub with inline `{SLOTS}` mention. Right: agent dropdown (220px, options: Buyer / Seller / Judge / Analyst) + `[⎘ Duplicate]` secondary-sm.
- 2-column split, 16px gap. Each column: white panel, 1px border, 8px radius, 380px tall, with a header strip.

**Left column "Prompt template":**
- Header strip (sunken bg, 1px bottom border): label "PROMPT TEMPLATE" + chips `212 tokens` (grey) + `5 slots` (blue).
- Body: monospace 12px, line-height 1.65, scroll, white-space pre-wrap. Render `{SLOT_NAME}` matches as inline highlighted spans: bg `--accent-2-soft`, color `--accent-2`, mono 600w, 1×4 padding, 4px radius.

Buyer system prompt content (verbatim):
```
You are the BUYER, procurement manager at Atrium Logistics.

CONTEXT
You are negotiating a 12-month supply contract for industrial sensors with the seller. You hold private information about your budget and walk-away.

YOUR PRIVATE INFORMATION
- Target unit price: €{BUYER_TARGET_PRICE}
- Walk-away (highest acceptable): €{BUYER_WALKAWAY}
- Annual volume needed: {VOLUME_TARGET} units
- Capability profile: {BUYER_CAPABILITY}

YOUR PUBLIC GOALS
- Sign a 12-month contract at or below your target price.
- You should NOT reveal your walk-away.

INSTRUCTIONS
- Speak naturally, as a procurement manager would.
- Make concrete offers (price, volume, term).
- If asked directly about your budget, deflect.

When you are ready to accept the seller's offer, end your message with [ACCEPT].
When you wish to walk away, end with [WALKAWAY].
```

**Right column "Preview · cell A1":**
- Header strip: label + 3 grey chips showing the substituted values: `price=80`, `walkaway=92`, `strong`.
- Body: same monospace, but text in `--text-2`, with slot tokens replaced:
  - `{BUYER_TARGET_PRICE}` → 80
  - `{BUYER_WALKAWAY}` → 92
  - `{VOLUME_TARGET}` → 50,000
  - `{BUYER_CAPABILITY}` → strong

**Slots table** (below the split, margin-top 20):
- White panel, 1px border, 8px radius. Header strip: h4 "SLOTS USED IN THIS PROMPT" + `[+ Add slot]` ghost-sm.
- Rows: 4-col grid `220px 90px 1fr 200px`, 10×14 padding, 1px bottom dashed `--line-1`.
- Header row uses `--surface-sunken` bg, 11px uppercase `--text-4`.

| Name | Type | Description | Used in |
|---|---|---|---|
| `{BUYER_TARGET_PRICE}` | number | Target unit price the buyer aims for (€). | Buyer |
| `{BUYER_WALKAWAY}` | number | Highest price the buyer will accept (€). | Buyer |
| `{SELLER_FLOOR_PRICE}` | number | Lowest price the seller can accept (€). | Seller |
| `{VOLUME_TARGET}` | number | Annual volume in units. | Buyer · Seller |
| `{BUYER_CAPABILITY}` | enum | Negotiation skill profile (strong/weak). | Buyer |

Slot names render as inline-slot tokens (highlighted blue mono). "Used in" cells contain blue/orange chips matching agent identity.

### 4.4 — Outcomes tab

Two-column 1fr / 280px again.

**Main:**
- Head: h3 "Outcomes & CSV" + sub "Define the columns of your output CSV. One row per dyad." Right: `[+ Add column]` secondary-sm.
- White panel table, 1px border, 8px radius. Row grid: `32px 200px 90px 1fr 80px 40px`. Header (sunken bg, 11px uppercase): `# · Column · Type · Source · Required · ⋯`.

| # | Column | Type | Source · where | Required |
|---|---|---|---|---|
| 1 | `dyad_id` | string | grey "auto" · System | ✓ |
| 2 | `cell_id` | string | grey "auto" · Experiment cell | ✓ |
| 3 | `outcome` | enum | blue "extracted" · Analyst → final[outcome] | ✓ |
| 4 | `final_price` | number | blue "extracted" · Analyst → final[price] | — |
| 5 | `rounds_used` | number | grey "auto" · Counter | ✓ |
| 6 | `judge_verdict` | enum | blue "extracted" · Judge → terminal label | — |
| 7 | `anomaly` | boolean | orange "derived" · Heuristic | ✓ |

`✓` is a 14px check icon, weight 2. `—` is `--text-4`. Last cell is the "⋯" icon-button.

- h4 "UTILITY FUNCTION" + sub "How DEXLab scores each dyad's outcome. Used in cell-mean tables and the Results dashboard."
- 2-col grid (10px gap) of selectable utility cards. **Pie-split / surplus** is selected. Each card: radio + name (Open Sans 700 13px) + desc (11.5px `--text-3`).

| id | label | desc | sel |
|---|---|---|---|
| piesplit | Pie-split / surplus | Buyer + seller surplus from a single price. | ✓ |
| multi | Multi-issue weighted | Sum of issue × weight per side. | |
| binary | Binary verdict | Win / loss / hung. | |
| custom | Custom expression | JS-style scoring expression. | |

**Aside — CSV preview card:**
- Header "CSV PREVIEW" with download icon.
- Pre block, mono 11px line-height 1.6, content:
```
dyad_id,cell_id,outcome,final_price,rounds_used,judge_verdict,anomaly
d_0001,A1,deal,82.50,7,cooperative,false
d_0002,A1,deal,79.00,11,competitive,false
d_0003,A1,walkaway,,12,stalled,false
d_0004,A2,deal,85.00,5,cooperative,false
…
```
- Below: full-width `[↓ Download schema (.json)]` secondary-sm centered.

---

## 5 · Screen 3 — Run Dashboard (`/research/runs/:runId`)

Calm and confident. No flashing — counters tick, bars fill smoothly, one pulsing dot.

**Page head:**
- Crumb: `Experiments > Buyer Capability × Provider > Run #14`
- Title (19px) prefixed with a small pulsing accent-2 dot: "● Buyer Capability × Provider · Run #14"
- Sub: "Started 14:08 · 24 min elapsed · est. 38 min remaining · 2×4 design · N=60 per cell · seed 4719"
- Right actions: `[⏸ Pause]` secondary, `[■ Abort]` secondary, `[↓ Snapshot CSV]` ghost.

**Pulse dot** (reuse on header, on cell-row "running" indicators, and on the live-log "Streaming" badge):
```
.pulse-dot { width:6; height:6; border-radius:50%; background:--accent-2; position:relative;
  animation: pulse 2s ease-in-out infinite; }
.pulse-dot::after { content:''; position:absolute; inset:-3px; border-radius:50%;
  border:1.5px solid --accent-2; opacity:0; animation: pulse-ring 2s ease-out infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
@keyframes pulse-ring { 0%{opacity:.6;transform:scale(.6)} 100%{opacity:0;transform:scale(1.6)} }
```

**Stat tile row** — 6-col grid, 12px gap, white panel cards (14×16 padding, 8px radius, 1px `--line-1`):

Each tile:
- Tiny 11px uppercase label (`--text-3` 600w 0.06em)
- Value row: 26px tabular-num `--font-num` 700w + small icon at right
- 11px `--text-3` sub

| Label | Value | Sub | Tone |
|---|---|---|---|
| Completed | 279 | of 480 dyads · 58.1% | ok (green value, check icon) |
| In flight | 28 | across 3 cells | info (blue value) |
| Queued | 173 | 1 cells waiting | neutral |
| Failed | 5 | all retries exhausted | warn (orange) |
| Anomalies | 11 | 3.9% of completed | warn (bell icon) |
| Token spend | 2.41M | ≈ €18.40 · 49% of budget | neutral |

(All numbers are derived from cell totals; just hardcode for now.)

**Overall progress bar** — full-width white panel, 16/20/20 padding:
- Header row: h2 "Overall progress" + right side: `279 / 480` (tabular num 13px 600w) and `· est. complete 14:46`.
- 28px tall segmented bar, sunken bg, 6px radius, overflow hidden, 1px `--line-1` border.
- 8 segments side-by-side, `flex: cell.total`. Each segment: relative; 1px right border in `--surface-canvas`. `.rob-fill` absolute-positioned width-animated bar (green for done, blue for running, hidden/grey for queued). Above each: 10px mono cell id label, white via `mix-blend-mode: difference`.

**2-column body** (`1fr 360px`, 16px gap):

### Cells table (left, white panel)
Header strip with `[Filter]`, `[Matrix view]` ghost-sm right; h2 "Cells" + sub "Click a cell to inspect dyads · 8 cells · 2×4 design".

Row grid: `70px 1.4fr 1.6fr 70px 50px 60px 110px 90px`. 10×18 padding. 1px bottom `--line-1`. Hover: bg `--surface-sunken`.
Header row: sunken bg, 10.5px uppercase 0.06em `--text-4`.

Columns: **Cell · Factors · Progress · Done · Fail · Anom · Status · (Inspect btn)**

- Cell: 8px status dot (green/blue-pulsing/grey) + mono 12px 700w cell id.
- Factors: chips with internal layout `<span class=cr-fk text-4>key:</span><span class=cr-fv text-1 600w>value</span>`. Use grey chips throughout.
- Progress: 6px bar with green fill (done) / blue fill (running) / grey (queued, width 0).
- Done: tabular-num "47" + dimmer "/60" suffix.
- Fail: tabular-num or "—" (`--text-4`) if zero.
- Anom: orange-soft pill if >0, else "—".
- Status: chip — green "✓ Done", blue "● Running" (with pulse-dot), grey "Queued".
- Action: `[Inspect]` ghost-sm.

Mock 8 cells (2×4: buyer_capability × seller_provider):

| id | factors | total | done | failed | anom | status |
|---|---|---|---|---|---|---|
| A1 | buyer:strong, seller:OpenAI | 60 | 60 | 1 | 2 | done |
| A2 | buyer:strong, seller:Anthropic | 60 | 60 | 0 | 1 | done |
| A3 | buyer:strong, seller:Google | 60 | 58 | 2 | 4 | done |
| A4 | buyer:strong, seller:Mistral | 60 | 47 | 1 | 3 | running |
| B1 | buyer:weak, seller:OpenAI | 60 | 32 | 0 | 1 | running |
| B2 | buyer:weak, seller:Anthropic | 60 | 18 | 1 | 0 | running |
| B3 | buyer:weak, seller:Google | 60 | 4 | 0 | 0 | running |
| B4 | buyer:weak, seller:Mistral | 60 | 0 | 0 | 0 | queued |

### Right column — two stacked cards, 12px gap

**Live event log** (white panel):
- Header: h3 "Live event log" + sub "Last 30 seconds". Right: pulse-dot + 11px `--text-3` "Streaming".
- List, 320px max-height, scroll. Each row: 4-col grid `60px 90px auto 1fr`, 7×16 padding, dashed bottom border.
  - col1: 10.5px mono `--text-4` timestamp
  - col2: tag chip — `live-ok` (green soft), `live-info` (blue soft), `live-warn` (orange soft), `live-err` (orange darker). Icon + label.
  - col3: mono 10.5px `--text-3` "{cell}·{dyad}"
  - col4: 11.5px `--text-2` message

| t | cell | dyad | kind | message | tone |
|---|---|---|---|---|---|
| 14:32:08 | A4 | d_0247 | completed | deal · €82.50 · 7 rounds | ok |
| 14:32:04 | B1 | d_0312 | started | turn 1/12 | info |
| 14:32:01 | A4 | d_0246 | anomaly | Seller emitted JSON in transcript | warn |
| 14:31:58 | B2 | d_0188 | completed | walkaway · 12 rounds (cap) | ok |
| 14:31:53 | A4 | d_0245 | completed | deal · €78.00 · 5 rounds | ok |
| 14:31:49 | B1 | d_0311 | completed | deal · €88.50 · 9 rounds | ok |
| 14:31:42 | B3 | d_0017 | failed | Provider 429 — retried (3/3) | err |
| 14:31:38 | A4 | d_0244 | completed | deal · €81.00 · 8 rounds | ok |

Footer: sunken bg, 8×16 padding, centered `View full log →` link.

**Anomalies (7)** card:
- Header: h3 "Anomalies (7)" + right `Triage all →` link.
- 4 rows, dashed bottom borders, each: top row with mono orange chip tag + tabular-num count, then 11.5px `--text-2` example.

| tag | count | example |
|---|---|---|
| json-leak | 3 | Seller emitted raw JSON in transcript |
| role-confusion | 2 | Buyer addressed itself as "the seller" |
| walkaway-mismatch | 1 | [ACCEPT] token but no terminal price |
| analyst-fail | 1 | Analyst returned non-JSON output |

---

## 6 · Screen 4 — Transcript Viewer (`/research/runs/:runId/dyad/:dyadId`)

The "microscope". 3-column layout. Calm, dense, scholarly.

**Page head:**
- Crumb: `Run #14 > Cell A4 > d_0247` (mono).
- Title (19px): "Dyad **d_0247**" (mono span, 18px) + green chip "✓ Deal · €82.50".
- Right: `[< Prev dyad]` ghost-sm, `[Next dyad >]` ghost-sm, `[↓ Export JSON]` secondary-sm.
- Meta strip (margin-top 14, sunken bg, 1px `--line-1`, 6px radius, 10×14 padding, 18px gap row): each cell stacks 10px uppercase 0.06em `--text-4` key over 12.5px `--text-1` 600w value (mono variant for IDs/numbers).

| key | value |
|---|---|
| Cell | A4 (mono) |
| buyer_capability | strong |
| seller_provider | Mistral |
| Seed | 4719 (mono) |
| Rounds | 7/12 (num) |
| Tokens | 12,408 (num) |
| Duration | 38s |

**Body** — 3-col grid `240px 1fr 340px`. Side rails on `--surface-rail` bg.

### Left rail (240px, scroll, padding 18×16)

Three section caption headers (10.5px uppercase 0.08em `--text-4` 700w):

**AGENTS** — 4 cards (small `tv-agent`): row 8×10 padding, 1px border, 6px radius:
- 26×26 colored avatar with letter (B blue, S orange, J grey, A grey), 700w
- name (12.5px 700w) + " · {role}" (11px `--text-3`)
- model line (10.5px mono `--text-3`): "Anthropic · claude-sonnet-4.5", "Mistral · mistral-large", "OpenAI · gpt-4o-mini", "Anthropic · claude-haiku-4.5"
- temp line (10.5px `--text-4`): "temp 0.70" / "temp 0.00"

**SLOT BINDINGS** — 5 small rows, each: blue inline-slot mono name (10.5px) on the left, mono value on the right, 4×8 padding:
- `BUYER_TARGET_PRICE` 78
- `BUYER_WALKAWAY` 92
- `SELLER_FLOOR_PRICE` 80
- `VOLUME_TARGET` 50,000
- `BUYER_CAPABILITY` strong

**ANOMALIES** — single green pill row "✓ No anomalies flagged" on rgba(46,163,107,0.08) bg, 8×12 padding.

### Center column — `--surface-canvas` bg, transcript stream

Header bar: white bg, 1px bottom border, 12×24 padding. Left: h3 "Transcript". Right row of clickable chip-buttons: `[Show offers]` blue (active), `[Tokens]` grey, `[Hide system]` grey.

Stream (24×24 padding, scroll, flex column 14px gap):

**System pseudo-bubbles** (centered, max 80% width, dashed border, 11.5px `--text-3`, 8×14 padding, 6px radius, settings or check icon):
- Top: "⚙ System turn — slots bound · seed 4719 · turn order: **buyer → seller**"
- Bottom: "✓ [ACCEPT] token detected · run terminated · final price **€82.50** · 7 rounds · 38s" — green tone (border `--success`, bg `rgba(46,163,107,0.04)`).

**Round dividers** between rounds: full-width `<line>round N</line>`. Center label is uppercase 10.5px 0.08em `--text-4` 600w. Dividers between round 1→2, 2→3, 3→4.

**Turn bubbles**: alternating left (buyer) / right (seller). Max-width 86%, 10px gap.
- Avatar: 28×28, 8px radius, "B"/"S", soft-tinted bg matching role.
- Bubble: 12×16 padding, 12px border-radius, asymmetric corner (4px on the side near the avatar). Buyer bubbles: white. Seller bubbles: bg `rgba(232,78,16,0.04)`, border `rgba(232,78,16,0.18)`.
- Inside bubble:
  - Meta row: name (Open Sans 700 12.5px) + mono provider/model (10.5px `--text-3`) + right-aligned uppercase "round N" (10.5px 0.06em `--text-4`).
  - Body text 13px, line-height 1.6.
  - If text contains `[ACCEPT]`, strip it from the body and append a separate inline tag: mono 11px green-pill `[ACCEPT]`.
  - **Offer footer** (1px dashed top, 8/10 padding-top, 10px gap, flex wrap). Tiny uppercase "OFFER EXTRACTED" key, then mono pill values for whichever fields exist: price (€…), volume (…u), term (…mo). Sunken bg, 1×7 padding, 3px radius.

7 turns total (4 rounds, then [ACCEPT]):

| round | agent | text | offer extracted |
|---|---|---|---|
| 1 | buyer | "Good afternoon — I'd like to revisit our supply contract. Given current market conditions and our volume of 50,000 units, we're targeting €78 per unit on a 12-month term." | €78, 50,000u |
| 1 | seller | "Thanks for opening with a number. €78 is well below where we can deliver at scale. Our floor for that volume is €92 — but I have flexibility on payment terms and I can hold a lock for 18 months." | €92, 50,000u, 18mo |
| 2 | buyer | "I appreciate the offer to lock the price longer, but 18 months locks us into a unit cost we can't justify. We can move to €82 on a 12-month — that gets us within striking distance of our budget." | €82, 50,000u |
| 2 | seller | "€82 is closer. To meet you there I'd need either volume guarantees of 60k or net-30 terms cut to net-15. Which works better for your team?" | €82, 60,000u |
| 3 | buyer | "We can't move to 60k — that's a real capacity question on our end. Net-15 we can do, given the unit price comes in at €82." | €82, 50,000u, 12mo |
| 3 | seller | "Then €82.50 with net-15, 12-month — that's the lowest I can take this. If we're aligned, I'll send the term sheet today." | €82.50, 50,000u, 12mo |
| 4 | buyer | "€82.50 net-15 12-month works. Send the term sheet — we'll counter-sign tomorrow. [ACCEPT]" | €82.50, 50,000u |

### Right rail (340px, padding 18×16, scroll)

**SUPERVISOR DECISIONS** — 4 judge cards (white panel, 1px border, 6px radius, 10×12 padding, 8px stack gap):

Each card:
- Head row: "Round N" (Open Sans 700 11px uppercase 0.06em `--text-3`) + classification chip.
- Confidence row: 4px-tall bar (fill ok if >0.8 / blue normal / orange warn if <0.6) + tabular-num "84%" 11px.
- Rationale: 11.5px `--text-2` line-height 1.5.

| Round | Label (chip color) | Confidence | Rationale |
|---|---|---|---|
| 1 | cooperative (green) | 0.78 (blue bar) | "Both sides open with concrete numbers and frame the gap honestly. No posturing." |
| 2 | competitive (orange) | 0.62 (blue bar) | "Seller introduces conditional asks (volume, net-15) tied to price concessions — characteristic distributive move." |
| 3 | cooperative (green) | 0.84 (green bar) | "Buyer accepts a non-price concession (net-15) to bridge price. Mutual movement on different issues." |
| 4 | cooperative (green) | 0.91 (green bar) | "Closure with [ACCEPT]; no walkaway, no late posturing. Terminal cooperative." |

**ANALYST EXTRACTIONS** — single card "Final outcome JSON":
- Head strip (sunken bg, 1px bottom, 11px uppercase `--text-4`).
- Mono 11px pre block:
```json
{
  "outcome": "deal",
  "final_price": 82.50,
  "volume": 50000,
  "term_months": 12,
  "payment": "net-15",
  "rounds_used": 7,
  "buyer_surplus": 9.50,
  "seller_surplus": 2.50,
  "joint_surplus": 12.00
}
```
- Below the card, action row: `[⎘ Copy]` secondary-sm full-grow + `[View raw]` ghost-sm full-grow.

---

## 7 · Implementation order

1. Add tokens to `app.css`. Wire `[data-theme]` and `[data-density]` on `<html>`.
2. Implement `<AppShell>` (Topbar + Sidebar, plus the `Icon` component — at minimum: library, flask, play, chart, chat, settings, plus, search, filter, copy, edit, star, bot, user, chevron, pause, stop, download, moon, sun, bell, help, book, scale, handshake, sparkle, target, eye, refresh, check, x, clock, layers, table, code, trash, moreH, sortAsc, arrowRight, spark).
3. Build screens in this order: Library → Run Dashboard → Transcript Viewer → Scenario Builder. Builder is largest; do it last with the others as visual reference.
4. Wire `density` and `theme` to a top-level Zustand/context store. Persist both to localStorage. Default density = `compact`. Default theme = `light` (if existing app already has dark mode, use that hook).

## 8 · Spacious mode (for the toggle)

```css
[data-density="spacious"] {
  --d-pad-card: 24px;
  --d-pad-row:  14px;
  --d-gap-section: 32px;
  --d-fs-body: 14px;
  --d-fs-label: 12px;
  --d-row-h: 44px;
}
[data-density="spacious"] .page-head { padding: 24px 32px 16px; }
[data-density="spacious"] .page-title { font-size: 22px; }
[data-density="spacious"] .page-body { padding: 24px 32px; }
[data-density="spacious"] .sb-body { padding: 24px 32px 40px; }
```

---

**Build the four screens to match this brief precisely. Don't ad-lib copy; the strings here are real. Don't use a different icon library; inline the SVGs. Don't add gradients beyond the brand mark and avatar pill.**
