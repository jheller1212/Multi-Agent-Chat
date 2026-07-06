# UX Architecture — Researcher Flows

Target architecture for the Apple-quality rebuild. Companion to `design-system.md` (binding visual language). Grounded in the existing `ResearchLayout` state machine — screens map 1:1 onto existing components for incremental replacement.

Priorities: **P1** pilot-critical · **P2** paper-quality · **P3** polish.

## Information Architecture

Keep the shell: topbar (breadcrumb, theme, account) + left rail + content. Rail entries (replaces the 8-screen map in `ResearchLayout.tsx:15`):

1. **Library** (scenarios + experiments, tabbed)
2. **Scenario Studio** (editor, opened from Library)
3. **New Experiment** (3-step wizard: Configure → Freeze → Launch)
4. **Runs** (live monitor; badge with count of running experiments)
5. **Results** (completed experiments, exports)
6. **Settings** (keys, account)

Quick Chat stays exiled behind `?view=quickchat` — not in the rail.

### Global patterns

- **Wizard replaces the single-page ExperimentLauncher.** Persistent stepper (1 Configure, 2 Freeze, 3 Launch); draft autosaved to `research_experiments` `status='draft'` at every step (fixes orphaned `'running'` rows).
- **Every destructive/spend action gets a confirm sheet** with cost estimate (dyads × est. calls × model price band).
- **Designed empty states** with a single primary CTA on every screen.
- **Errors are never a bare red string** (cf. `ExperimentLauncher.tsx:273`). Error card = what failed + raw message collapsed behind "Details" + one recovery action.

## Screen 1: Library

Two tabs (segmented control): **Scenarios | Experiments**.

- **Scenarios tab**: card grid. Card = name, description, agent-count pill per role, template badge, last-edited. Hover actions: Open, Clone, Use in Experiment. Primary CTA "New Scenario" + secondary "Import" — the whole grid is a `.json` file-drop target (full-surface dashed overlay on dragenter; per-file validation errors after drop); also click-to-browse. Import maps to a new loader fn (P1, does not exist yet).
- **Experiments tab**: table rows = name, scenario, status chip (draft/running/completed/failed), progress bar, created. Row actions: Open (→ Runs or Results by status), Duplicate, Archive.
- **Empty state**: "No scenarios yet — start from a template" with the 3 seeded templates rendered inline as one-click clones.

## Screen 2: Scenario Studio (replaces ScenarioBuilder)

Three-pane layout:

- **LEFT — Agent Roster.** Two labeled lanes: "Negotiators (domain)" and "Supervisors". Draggable cards (dnd-kit): drag between lanes changes role; drag WITHIN the domain lane reorders = defines `turnPolicy.roundDefinition` (**order in lane IS speaking order**). Supervisor cards: type selector (segmented: Classifier | Extractor | Appraiser) + timing selector (per round | post termination). Add-agent at lane bottom. Max 6 agents, min 2 domain. Agent identity colors (agent-1..5).
- **CENTER — Prompt Editor** for the selected agent. Monospace textarea with a "Parameters" chip row: every `{PLACEHOLDER}` detected renders as a chip; unbound chips are amber (must be filled at experiment time). Supervisors get an **Output Schema editor**: classifiers = tag-input of allowed values + terminal-value toggles; extractors = key list (name, type, nullable). This UI writes the SIMPLE schema shape the runner parses (`allowedValues`/`keys`) — not raw JSON-Schema — killing the enum-mismatch bug at the source.
- **RIGHT — Scenario Settings.** Turn policy (segmented: Alternating | Mediator-led | Structured sequence; mediator-led reveals a mediator dropdown of domain agents), Termination (turn cap stepper 1–50 + per-supervisor terminal-value chips), Outcome schema summary (auto-derived from extractor keys, read-only).
- **Footer**: Save (autosave indicator "Saved 2s ago"), Validate (runs `prompts/validate.ts` inline), primary "Use in Experiment →".

## Screen 3: New Experiment — Step 1 Configure

Left column (form) + sticky right column (live Design Matrix preview).

- **Scenario picker**: searchable dropdown, pre-filled when arriving from Studio.
- **Factors**: row cards — name input + level CHIPS (type-and-enter to add, × to remove, drag to reorder). Drag factor cards to reorder. Replaces comma-separated inputs (`ExperimentLauncher.tsx:299-354`).
- **Model assignment**: matrix table — rows = domain agents, columns = levels of factors marked "This factor varies the model" (toggle per factor). Cells = provider+model dropdown (provider dot + model name) + temperature stepper. Non-varying setup collapses to one dropdown row per agent. Surfaces the factorMappings that today silently default to gpt-4o.
- **Parameters**: auto-generated form from all unbound `{PLACEHOLDER}` chips across scenario prompts. Cannot proceed with unbound params.
- **Run settings**: N per cell (stepper), buffer % (stepper), concurrency (slider 1–20 with rate-limit hint), Mode (segmented: Dev | Production, cost delta shown).
- **Right preview**: cells table (label, factor combo, model per agent, N), totals footer (cells, dyads, est. calls, est. cost range). Live.
- Continue disabled until valid; inline field errors + summary count in the stepper (same content as today's checklist).

## Screen 4: New Experiment — Step 2 Freeze

Provenance as a first-class ritual (JPSM methods section).

- Header: "Freeze prompts for [experiment]" + explainer: frozen prompts are immutable and hashed; the paper cites these hashes.
- **Cell × Agent accordion**: one row per (cell, agent), expandable to the FULLY RENDERED prompt (factors + params substituted — exactly what the model sees). SHA-256 hash per row (`src/lib/hash.ts`, not simpleHash), copy button.
- **Diff affordance**: if the scenario changed since a previous freeze, changed rows get an amber "changed" chip with inline diff.
- Primary CTA "Freeze N prompts" → writes `frozen_prompts` (wires the dead `freezePrompts`, `freeze.ts:36`) and stamps prompt hashes on the experiment. After freezing, Step 1 locks (edit = explicit "Unfreeze and edit", voids the freeze).
- Dev-mode shortcut: "Skip freeze (dev)" ghost button, Dev mode only.

## Screen 5: New Experiment — Step 3 Launch

- **Readiness checklist** (reuses `ExperimentLauncher.tsx:480-488` content): scenario, frozen prompts, per-provider key check, and NEW **provider reachability preflight** — a 1-token call per provider actually used, pass/fail shown (kills the historical "Failed to fetch" ×32 failure mode before money is spent).
- **Cost card**: dyads, est. calls, est. tokens, cost range, mode chip.
- Primary "Launch experiment" → confirm sheet (name, totals, "this will call provider APIs from your browser; keep this tab open") → Run Monitor.
- **Session-keepalive notice**: "Idle sign-out is paused while an experiment is running" (requires the `App.tsx:169` idle-timer exemption).

## Screen 6: Run Monitor (replaces RunDashboard mock)

Header: experiment name, status chip, elapsed, progress bar with segment colors (completed/running/failed/pending), controls: Pause (toggle), Abort (destructive, confirm sheet).

- **Cells grid** (left, 2/3): one card per cell — label, factor chips, mini progress bar, counts (done/running/failed), failure-rate warning at >20%.
- **Live feed** (right, 1/3): streaming dyad events (started / turn N by buyer / completed: deal @ €142 / failed: reason). Auto-scroll with pin toggle. Source: runner event emitter — requires lifting the ExperimentRunner instance out of the launcher closure into a context/store; Supabase realtime or 3s poll as fallback for reopened tabs.
- **Anomaly strip** (bottom, collapsible): rule-based flags — repeated identical messages, zero-word replies, dyads >2× median duration, provider error clusters. Each links to the transcript.
- Clicking any dyad opens Transcript Viewer as a **slide-over panel** (monitoring context preserved). Failed dyads get "Retry dyad".

## Screen 7: Outcomes / Results

Per completed experiment page (not just the list):

- **Summary tiles**: dyads completed/excluded/failed, deal rate, mean final price, mean rounds (client-side from `outcome_records`).
- **Outcomes table**: one row per dyad — cell, deal, final_price, rounds, termination reason, status; sortable; row click → transcript slide-over. **Exclusion toggle** per row with mandatory reason dropdown (manipulation failure / provider error / duplicate / other+text) — auditable exclusions for the paper.
- **Export bar**: "CSV (outcomes)" (exists, `csv-export.ts:6`), "CSV (transcripts long format)" (NEW — one row per message; feeds `src/lib/linguistics`), "JSON bundle (full provenance: config snapshot + frozen prompts + transcripts + supervisor outputs)". Buttons also act as drag-out sources where supported.

## Interaction-Pattern Inventory (contract for the component library)

- **Segmented control**: tabs (Library), mode (Dev/Prod), supervisor type, turn policy.
- **Toggle**: dev-mode, "factor varies model", auto-scroll pin, exclusion.
- **Stepper**: N per cell, buffer %, turn cap, temperature.
- **Slider with value bubble**: concurrency.
- **Select**: provider+model (color dot), scenario picker (searchable), mediator, exclusion reason.
- **Chips**: factor levels (editable tag-input), factor combos (read-only), status, terminal values, `{PARAM}` placeholders.
- **Drag-drop** (dnd-kit): agent cards between/within lanes; factor cards; level chips. Keyboard accessible (space to lift, arrows to move) is mandatory.
- **File drop**: scenario `.json` import (Library) — full-surface dashed overlay on dragenter; per-file validation errors after drop.
- **Slide-over panel**: transcript from monitor/results.
- **Confirm sheet**: launch, abort, unfreeze, delete.
- **Progress**: segmented bar (multi-state), per-cell mini bars, indeterminate spinner only for loads <2s.
- **Motion**: 150–200ms ease-out for panel/sheet entrances, chip add/remove scale, progress-bar width transitions. No decorative animation in the monitor hot path.

## Dependencies / Sequencing

- Pipeline work: draft-status autosave, scenario import fn, simple output-schema shape, params in ExperimentDefinition, idle-timer exemption while running, `freezePrompts` wiring, SHA-256.
- Runner: lift runner to a store/context so Monitor can subscribe; retry-dyad; preflight provider check.
- **Studio and Wizard Step 1 can be built against existing tables now**; Freeze (Step 2) and Monitor live-feed depend on the pipeline fixes landing first.
