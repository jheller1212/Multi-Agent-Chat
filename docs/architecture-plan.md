# Architecture Plan: Multi-Agent Research Platform (v3)

**Date:** 2026-04-26
**Status:** Revised draft — browser-first, scenario-driven, builds on AI2AI-Chat patterns. Awaiting approval.

---

## 1. Design Principles

### Browser-First, No-Code Research Platform

A procurement professor, a legal scholar, or a graduate student with no coding background can:
1. Configure a multi-agent research scenario in the browser
2. Design agents with provider/model/temperature/prompts through forms
3. Edit prompt templates with slot autocomplete in the browser
4. Design experiments (factors, levels, N per cell, model assignments) through click-and-fill
5. Launch, monitor, pause, resume, and download experiments from the browser
6. Browse transcripts, supervisor decisions, and download CSVs

**The CLI is secondary** — for power users who want batch automation. The browser is primary.

### Build on AI2AI-Chat, Don't Rewrite

The existing codebase has proven patterns: hooks for state management, Supabase for persistence, provider abstraction for LLM calls, component architecture for the UI. Extend these patterns rather than introducing new frameworks.

### Scenario-Generic, Not Procurement-Specific

The platform ships with 3 pre-built scenario templates that users can clone and modify. The platform code never hardcodes procurement logic.

### No Capability Tiers in Platform

The platform has no concept of "frontier" or "weaker." An agent has a provider, model, temperature, and prompt. Tier semantics live in experiment configs as arbitrary factor level labels.

---

## 2. Existing Codebase Architecture

### Key Modules (Reuse/Extend)

| Module | Path | Reuse Strategy |
|--------|------|---------------|
| App shell + auth | `App.tsx`, Supabase auth | **Extend** — add "Research" nav entry alongside existing "Quick Chat" |
| Bot config hook | `hooks/useBotConfig.ts` | **Pattern reuse** — new `useAgentConfig` hook follows same shape |
| Settings hook | `hooks/useSettingsPersistence.ts` | **Pattern reuse** — new `useScenarioSettings` hook |
| Conversation engine | `hooks/useConversationEngine.ts` | **Keep as-is** for Quick Chat. New `useExperimentEngine` for multi-agent |
| API providers | `lib/api/providers/*.ts` | **Extend** — add Meta + Alibaba providers |
| Provider factory | `lib/api/factory.ts` | **Extend** — 6 providers |
| Retry logic | `lib/api/conversation.ts` | **Extract** to `lib/api/retry.ts`, share across browser + CLI |
| Experiments CRUD | `hooks/useExperiments.ts` | **Replace** with richer experiment management |
| Supabase client | `lib/supabase.ts` | **Reuse as-is** |
| API key vault | `lib/apiKeyVault.ts` | **Extend** — add meta + alibaba key slots |
| Types | `types/index.ts` | **Extend** — add ProviderType, scenario types |

### Supabase Tables (Existing → Extended)

**Keep as-is:**
- `conversations`, `messages` — used by Quick Chat mode
- `api_keys` — extend vault shape for 6 providers
- `workshops`, `workshop_organizers` — existing workshop feature

**New tables** (see Section 7).

---

## 3. Scenario Abstraction

### What a Scenario Defines

A scenario is a reusable research environment configuration. Users create scenarios through the browser UI; the system persists them in Supabase.

```typescript
interface Scenario {
  id: string;
  userId: string;
  name: string;                          // "Procurement Negotiation"
  description: string;
  isPublic: boolean;                     // visible to other users as template
  isTemplate: boolean;                   // one of the 3 pre-built templates

  // --- Domain Agents ---
  domainAgents: {
    name: string;                        // "buyer", "plaintiff_lawyer"
    description: string;
    defaultPromptTemplate: string;       // markdown with {SLOTS}
  }[];

  // --- Supervisor Agents ---
  supervisors: {
    name: string;                        // "judge", "verdict_classifier"
    type: 'classifier' | 'extractor' | 'appraiser';
    timing: 'per_round' | 'post_termination';
    outputSchema: Record<string, unknown>;  // JSON schema for validation
    promptTemplate: string;
  }[];

  // --- Turn-Taking Policy ---
  turnPolicy: {
    type: 'alternating' | 'round_robin' | 'mediator_led' | 'structured_sequence';
    roundDefinition: string[];           // agent names that constitute one round
    config?: Record<string, unknown>;
  };

  // --- Termination Conditions ---
  terminationConditions: {
    type: 'supervisor_classification';   // judge says ACCEPT/REJECT
    supervisorName: string;
    terminalValues: string[];            // ["ACCEPTANCE", "REJECTION"]
  } | {
    type: 'turn_cap';
    maxTurns: number;
  }[];

  // --- Outcome Schema ---
  outcomeSchema: {
    columns: { name: string; type: 'string' | 'integer' | 'float'; nullable?: boolean }[];
    utilityFunction?: 'weighted_sum' | 'single_binary' | 'multi_class' | 'custom';
    utilityConfig?: Record<string, unknown>;  // weights, directions, ranges
  };

  createdAt: string;
  updatedAt: string;
}
```

### Three Pre-Built Scenario Templates

Users see these in the Library and can "Duplicate" to create their own variant.

#### 1. Procurement Negotiation
- **Domain agents:** Buyer (alternating), Seller (alternating)
- **Supervisors:** Judge (classifier, per-round), Analyst (extractor, per-round), Appraiser (appraiser, post-termination)
- **Turn policy:** Alternating, round = [buyer, seller]
- **Termination:** Judge ACCEPTANCE/REJECTION, 30-turn cap
- **Outcome schema:** weighted-sum utility (buyer_surplus, prr, joint_value, anomalies)
- **Experiments:** E1 (2x2 capability), E2 (2x2x2 warmth), E3 (2x4 Kraljic)

#### 2. Legal Advocacy
- **Domain agents:** Plaintiff Lawyer, Defense Lawyer, Judge (full participant)
- **Supervisors:** Verdict Classifier (classifier, post-termination), Argument Analyst (extractor, per-round), Persuasiveness Appraiser (appraiser, post-termination)
- **Turn policy:** Structured sequence (plaintiff → defense → judge interjection → closings → ruling)
- **Termination:** Judge issues ruling
- **Experiments:** 2x2x2 factorial (plaintiff style × defense style × case framing)

#### 3. Mediation
- **Domain agents:** Disputant A, Disputant B, Mediator (selects next speaker)
- **Supervisors:** Agreement Extractor (extractor, post-termination), Emotional Tone Analyser (extractor, per-round), Fairness Appraiser (appraiser, post-termination)
- **Turn policy:** Mediator-led
- **Termination:** Agreement reached, mediator impasse, 50-turn cap
- **Experiments:** 2x2 factorial (mediator style × disputant symmetry)

---

## 4. Provider Architecture (6 Providers)

```typescript
type ProviderType = 'anthropic' | 'openai' | 'google' | 'mistral' | 'meta' | 'alibaba';
```

| Provider | Key Models | Implementation |
|----------|-----------|---------------|
| **Anthropic** | Claude Opus 4.7, Sonnet 4.6 | Existing. Add `runtime` flag (browser vs. Node). |
| **OpenAI** | GPT-4.1, GPT-4o | Existing. |
| **Google** | Gemini 1.5 Pro/Flash | Existing. |
| **Mistral** | Large, Medium, Small, 7B | Existing. |
| **Meta** | Llama 3.1 8B/70B | **New.** OpenAI-compatible endpoint, configurable `baseUrl`. |
| **Alibaba** | Qwen 2.5 7B/72B | **New.** DashScope API or OpenAI-compatible, configurable `baseUrl`. |

Each provider is a first-class citizen — own class, own API key, own entry in the vault. No meta-provider (OpenRouter) as hidden dependency.

---

## 5. Agent Design (No Capability Tiers)

```typescript
interface AgentConfig {
  name: string;                        // "buyer", "mediator"
  role: 'domain' | 'supervisor';
  provider: ProviderType;
  model: string;                       // "gpt-4.1", "llama-3.1-8b-instruct"
  temperature: number;
  maxTokens: number;
  systemPrompt: string;                // fully rendered (post-template substitution)
}
```

No `capabilityTier`, no `strength`, no `quality` field. If an experiment labels cells "strong" vs. "weak," that label exists only in the experiment config as a factor level name.

### Supervisor Specialisations

```typescript
// Classifier: returns one value from a fixed set
interface ClassifierResult { classification: string; rawResponse: string }

// Extractor: returns structured JSON matching scenario schema
interface ExtractorResult { parsed: Record<string, unknown>; rawResponse: string }

// Appraiser: returns structured ratings
interface AppraisalResult { ratings: Record<string, number>; rawResponse: string }
```

The schema for each supervisor's output is defined in the scenario, not hardcoded in the platform.

---

## 6. Conversation Orchestrator

### Flow (Generic)

```
ORCHESTRATOR
│
├─ 1. Load scenario + experiment config
├─ 2. Render & freeze prompts for this cell
├─ 3. Instantiate agents
│
├─ LOOP until termination:
│  ├─ 4. Turn policy selects next domain agent
│  ├─ 5. Agent generates message
│  ├─ 6. Append to transcript (Supabase, append-only)
│  ├─ 7. is_round_complete()?
│  │     NO → back to 4
│  │     YES → run per-round supervisors:
│  │       a. Classifier → terminal? → stop
│  │       b. Extractor → extract values
│  ├─ 8. Turn cap reached? → terminate (deadlock/impasse)
│
├─ POST-TERMINATION:
│  ├─ 9. Run post-termination supervisors (appraiser, etc.)
│  ├─ 10. Compute outcomes per scenario schema
│  └─ 11. Persist everything
```

### Procurement Example (one round)

1. Buyer generates offer
2. Seller generates counter-offer
3. Round complete → Judge classifies (CONTINUE) → Analyst extracts ({ price: 85 })
4. Repeat until ACCEPTANCE/REJECTION/30 turns
5. Post-termination: Appraiser scores SVI for buyer, then seller

### Supervisor Timing

**One supervisor pass per round**, where "round" = scenario's `roundDefinition`. For procurement: [buyer, seller] = 1 round. This halves supervisor cost vs. per-message.

### Structured Output Strategy

1. Supervisor prompts include explicit JSON format instructions + example
2. Parse as JSON, validate against scenario's Zod schema
3. Use provider-native structured outputs where supported (OpenAI `json_schema`, Anthropic tool-use)
4. On parse failure: retry once with "respond in valid JSON only"
5. On second failure: log to exclusion record

Supervisors always run on frontier-capable models. Domain agents (which may be smaller models) never need structured output.

---

## 7. Data Model (Supabase)

### New Tables

```sql
-- Scenarios
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_template BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL,               -- full ScenarioDefinition
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Experiments (replaces existing lightweight experiments table)
CREATE TABLE research_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  scenario_id UUID REFERENCES scenarios NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  config JSONB NOT NULL,               -- full ExperimentDefinition
  status TEXT NOT NULL DEFAULT 'draft', -- draft, running, paused, completed, failed
  progress JSONB,                      -- { completed: N, total: N, failed: N, excluded: N }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Experiment runs (one per launch; an experiment can be re-run)
CREATE TABLE experiment_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES research_experiments NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  config_snapshot JSONB NOT NULL,      -- frozen experiment config at launch time
  prompt_hashes JSONB NOT NULL,        -- { "cell_agent": "sha256hash", ... }
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress JSONB                       -- live progress counters
);

-- Frozen prompts (immutable, content-addressed)
CREATE TABLE frozen_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES experiment_runs NOT NULL,
  cell_label TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,          -- SHA-256
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dyads (one row per dyad in an experiment run)
CREATE TABLE dyads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES experiment_runs NOT NULL,
  cell_label TEXT NOT NULL,
  dyad_index INTEGER NOT NULL,
  seed INTEGER NOT NULL,
  factors JSONB NOT NULL,              -- { "buyer_capability": "strong", ... }
  agent_configs JSONB NOT NULL,        -- frozen agent configs
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed, excluded
  termination_reason TEXT,
  termination_turn INTEGER,
  failure_reason TEXT,
  exclusion_reason TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Transcript messages (append-only, immutable)
CREATE TABLE transcript_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dyad_id UUID REFERENCES dyads ON DELETE CASCADE NOT NULL,
  turn INTEGER NOT NULL,
  agent_name TEXT NOT NULL,
  content TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  token_usage JSONB,
  time_taken_ms INTEGER NOT NULL,
  word_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supervisor outputs (append-only, per-round)
CREATE TABLE supervisor_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dyad_id UUID REFERENCES dyads ON DELETE CASCADE NOT NULL,
  after_turn INTEGER NOT NULL,
  supervisor_name TEXT NOT NULL,
  output_type TEXT NOT NULL,           -- 'classification', 'extraction', 'appraisal'
  parsed JSONB NOT NULL,
  raw_response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Outcome records (one per dyad, computed after completion)
CREATE TABLE outcome_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dyad_id UUID REFERENCES dyads ON DELETE CASCADE NOT NULL,
  run_id UUID REFERENCES experiment_runs NOT NULL,
  data JSONB NOT NULL,                 -- all outcome columns per scenario schema
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### RLS Policies
- Users see only their own scenarios, experiments, runs, dyads, transcripts
- Public scenarios visible to all (read-only)
- Transcripts and frozen prompts are append-only (no UPDATE/DELETE via RLS)

### Soft-Delete
All tables use `archived_at TIMESTAMPTZ` instead of hard delete. Researchers do not delete data.

---

## 8. Frontend Architecture

### Navigation Structure

```
App
├── Quick Chat (existing 2-agent UI — untouched)
│   ├── Setup
│   ├── Chat
│   ├── History
│   └── Settings
│
└── Research (NEW top-level nav entry)
    ├── Library (browse/clone scenario templates)
    ├── Scenario Builder (create/edit scenarios)
    │   ├── Agents tab (define domain + supervisor agents)
    │   ├── Turn Policy tab (configure turn-taking)
    │   ├── Prompts tab (template editor with slot autocomplete)
    │   └── Outcomes tab (define CSV schema, utility function)
    ├── Experiment Designer (within a scenario)
    │   ├── Factors & Levels
    │   ├── Cell Configuration (model assignments per cell)
    │   ├── Parameters (scenario-specific: prices, budgets, etc.)
    │   └── Review & Launch
    ├── Run Dashboard
    │   ├── Progress (per-cell completion, anomaly counts)
    │   ├── Live transcript viewer (click a dyad to watch)
    │   └── Controls (pause, resume, abort)
    └── Results
        ├── Transcript Browser (per-dyad, with supervisor sidepanel)
        ├── Data Download (CSV per experiment)
        └── Summary Stats (cell means, anomaly rates)
```

### Hook Architecture (follows AI2AI-Chat pattern)

| New Hook | Based On | Purpose |
|----------|----------|---------|
| `useScenario` | `useExperiments` | CRUD for scenarios |
| `useAgentDesigner` | `useBotConfig` | Per-agent config state |
| `usePromptEditor` | — | Template editing, slot detection, preview |
| `useExperimentDesigner` | `useExperiments` | Factor/level/cell configuration |
| `useExperimentRunner` | `useConversationEngine` | Orchestrates multi-agent runs in browser |
| `useRunDashboard` | — | Real-time progress from Supabase subscription |

### State Management

Follow existing pattern: hooks + prop drilling. No new state management library. Supabase real-time subscriptions for live progress updates on the Run Dashboard.

---

## 9. Prompt Template System

### Template Format

Markdown with `{SLOT_NAME}` and conditional `[BLOCK_NAME]...[/BLOCK_NAME]`:

```markdown
You are a procurement professional employed by ManufactureCo...

CONTEXT
Item: {ITEM_DESCRIPTION}
Published list price: ${LIST_PRICE} per unit
Your firm's maximum authorised budget: ${BUDGET} per unit
Walk-away threshold: do not agree to any price above ${WALKAWAY} per unit

[MULTI_ISSUE]
Payment terms: weight {W_PAYMENT}/100, you prefer longer terms...
Delivery window: weight {W_DELIVERY}/100, you prefer shorter...
Warranty length: weight {W_WARRANTY}/100, you prefer longer...
[/MULTI_ISSUE]

[CRITICALITY]
This item is classified as {KRALJIC_QUADRANT}.
{KRALJIC_FRAMING_TEXT}
[/CRITICALITY]

[MANDATE]
{MANDATE_TEXT}
[/MANDATE]

GUIDELINES
Negotiate using natural conversation...
```

### Browser Editor

- Syntax highlighting for `{SLOTS}` and `[BLOCKS]`
- Slot autocomplete (detects `{...}` patterns, shows a form field per slot)
- Preview pane: renders template with sample values
- Block toggles: activate/deactivate conditional blocks per experiment

### Freeze Mechanism

On experiment launch:
1. Render all prompts for all cells
2. Store in `frozen_prompts` table (immutable, content-addressed by SHA-256)
3. Hash recorded on each dyad record
4. Orchestrator always reads from frozen prompts, never templates

---

## 10. Experiment Runner Architecture

### Browser Execution

The experiment runner operates in the browser via Web Workers or the main thread with `requestIdleCallback` batching. It:
1. Enumerates cells from factor crossings
2. Generates per-dyad parameter sets (deterministic from seed)
3. Runs dyads with configurable concurrency (e.g., 5 parallel dyads)
4. Persists progress to Supabase after each dyad completes (atomic)
5. Handles API failures with retry-up-to-3
6. Supports pause (stop accepting new dyads, finish in-progress), resume (pick up pending dyads), abort

### CLI Runner (Secondary)

Shares `src/lib/` modules. Reads experiment config from Supabase (by experiment ID) or from a YAML file. Writes results back to Supabase. CLI runs appear in the browser dashboard.

### Dev Mode

`devMode: true` in experiment config:
- Skips all supervisor agents
- Uses keyword-based termination ("accept", "deal", "agree", "walk away", "reject")
- Reduces concurrency to 1
- ~1/4 API cost

---

## 11. Procurement Scenario Parameters (Resolved)

### Supervisor Prompts (provided)

**Judge** (`scenarios/procurement/prompts/judge.md`):
```
You are observing a procurement negotiation between a Buyer and a Seller.

Below are the two most recent messages.

Buyer: {LATEST_BUYER_MESSAGE}
Seller: {LATEST_SELLER_MESSAGE}

Classify the current state of the negotiation as exactly one of:
- ACCEPTANCE: Both parties have explicitly agreed on all terms with concrete numerical values for every required issue.
- REJECTION: One or both parties have explicitly walked away from the negotiation.
- CONTINUE: The negotiation is ongoing and neither acceptance nor rejection has occurred.

Required issues for this experiment: {ISSUE_LIST}.

Acceptance requires explicit agreement on every required issue with a concrete numerical value, not just verbal assent.

Output a single JSON object with one key "status" whose value is one of "ACCEPTANCE", "REJECTION", or "CONTINUE". Do not output any other text.

Example: {"status": "CONTINUE"}
```

**Analyst** (`scenarios/procurement/prompts/analyst.md`):
```
You are extracting structured data from a procurement negotiation message.

Speaker role: {SPEAKER_ROLE}
Message: {MESSAGE_TEXT}

Extract any numerical values that the speaker has proposed in this message for the following issues. If the speaker did not propose a value for an issue, return null for that field.

Issues to extract:
- price: number or null (per unit, in USD)
- payment_terms_days: integer or null (only if multi-issue mode)
- delivery_weeks: integer or null (only if multi-issue mode)
- warranty_months: integer or null (only if multi-issue mode)

Distinguish between proposing a value (active offer or counter-offer) and merely mentioning a value (e.g., quoting the counterpart's prior offer). Only extract values the speaker is proposing.

Output a single JSON object with the fields above. Do not output any other text.

Example: {"price": 84.50, "payment_terms_days": 30, "delivery_weeks": 4, "warranty_months": 12}
```

**Appraiser** (`scenarios/procurement/prompts/appraiser.md`):
```
You are evaluating a completed procurement negotiation from the perspective of one of the negotiating parties.

Role: you are answering AS the {ROLE} agent that just completed this negotiation.

Full transcript:
{TRANSCRIPT}

Outcome summary: {OUTCOME_SUMMARY}

Rate each of the following 18 statements on a scale of 1 (not at all) to 7 (very much) from the {ROLE}'s perspective. Items marked (R) are reverse-scored; rate the literal content of the statement, not the reverse-scored interpretation.

1. How satisfied are you with your own outcome?
2. How satisfied are you with the balance between your own outcome and your counterpart's outcome?
3. Did you feel like you forfeited or "lost" in this negotiation? (R)
4. Do you think the terms of your agreement have valuable implications for you in the future?
5. Did you "lose face" (i.e., damage your sense of pride) in the negotiation? (R)
6. Did this negotiation make you feel more or less competent as a negotiator?
7. Did you behave according to your own principles and values?
8. Did this negotiation positively impact your self-image?
9. Do you feel your counterpart listened to your concerns?
10. Would you characterise the negotiation process as fair?
11. How satisfied are you with the ease (or difficulty) of reaching your agreement?
12. Did your counterpart consider your wishes, opinions, or needs?
13. What kind of overall impression did your counterpart make on you?
14. Did the negotiation make you trust your counterpart?
15. Did the negotiation build a good foundation for a future relationship with your counterpart?
16. Do you think your counterpart is satisfied with this negotiation?
17. How willing would you be to do business with this counterpart again in the future?
18. To what extent did you trust the representations your counterpart made during the negotiation?

Output a single JSON object with keys svi_1 through svi_18, each an integer between 1 and 7. Do not output any other text.

Example: {"svi_1": 5, "svi_2": 4, "svi_3": 2, ...}
```

### Issue Weights (E2, E3)

| Issue | Buyer Weight | Buyer Prefers | Seller Weight | Seller Prefers | Range |
|-------|-------------|---------------|--------------|----------------|-------|
| Price | 40 | Lower | 40 | Higher | $60–$120 |
| Payment terms | 30 | Longer (delays outflow) | 10 | Shorter (faster inflow) | 15–90 days |
| Delivery | 20 | Shorter | 20 | Longer (flexibility) | 2–8 weeks |
| Warranty | 10 | Longer | 30 | Shorter (less liability) | 6, 12, 24, 36 months |

Logrolling: buyer concedes warranty (low weight: 10) for seller conceding payment terms (seller low weight: 10).

### Joint Value Computation (E2, E3)

```
normalise(value, min, max, prefers_lower):
  if prefers_lower: (max - value) / (max - min)
  else: (value - min) / (max - min)

buyer_utility = (40 * norm_price_buyer + 30 * norm_payment_buyer + 20 * norm_delivery_buyer + 10 * norm_warranty_buyer) / 100
seller_utility = (40 * norm_price_seller + 10 * norm_payment_seller + 20 * norm_delivery_seller + 30 * norm_warranty_seller) / 100
joint_value = buyer_utility + seller_utility    # range [0, 2]
```

### Budget
- **E1:** 5 budget levels per dyad (120, 100, 80, 60, 48)
- **E2, E3:** Single fixed budget at list price ($100). Walkaway = $100.

### Seller Walk-Away
Separate parameter `{SELLER_WALKAWAY}`. Default = wholesale cost ($60). OWR anomaly = final price below this.

### Item Descriptions Per Kraljic Quadrant (E3)

| Quadrant | Item Description |
|----------|-----------------|
| Non-critical | Standard office paper and toner cartridges. Commodity-grade, multiple equivalent suppliers. |
| Leverage | Industrial steel sheets, grade EN 10025 S235JR. Multiple qualified suppliers exist, price-sensitive due to volume. |
| Bottleneck | Specialty rare-earth magnets used in motor assemblies. Few qualified suppliers globally; substitutes do not meet performance requirements. |
| Strategic | Custom-engineered electronic control units developed jointly with the supplier over a multi-year contract. Highly specific to ManufactureCo's product line, single qualified supplier. |

Pricing parameters (wholesale $60, list $100) stay fixed across quadrants. Only framing changes.

### Mandate Text (E2)

**High warmth:**
> Approach this negotiation warmly. Show genuine empathy for the [supplier's/buyer's] situation and constraints. Be friendly, sympathetic and sociable. Demonstrate non-judgemental understanding of the [supplier's/buyer's] needs, interests and positions. Use positive language, ask questions about the [supplier's/buyer's] circumstances, and express appreciation where appropriate.

**Low warmth:**
> Approach this negotiation in a businesslike, transactional manner. Stay focused on the deal terms. Do not emphasise relationship-building or social rapport.

---

## 12. Module Layout

```
src/
├── lib/
│   ├── api/
│   │   ├── providers/
│   │   │   ├── openai.ts              (existing)
│   │   │   ├── anthropic.ts           (existing — add runtime flag)
│   │   │   ├── gemini.ts              (existing)
│   │   │   ├── mistral.ts             (existing)
│   │   │   ├── meta.ts                (NEW)
│   │   │   └── alibaba.ts             (NEW)
│   │   ├── factory.ts                 (extend: 6 providers)
│   │   ├── retry.ts                   (NEW — extracted from conversation.ts)
│   │   ├── conversation.ts            (existing — unchanged, Quick Chat)
│   │   └── types.ts                   (extend ProviderType)
│   │
│   ├── agents/
│   │   ├── agent.ts                   (NEW — Agent interface + BaseAgent)
│   │   ├── domain-agent.ts            (NEW — generic domain agent)
│   │   ├── classifier.ts              (NEW — ClassifierAgent)
│   │   ├── extractor.ts              (NEW — ExtractorAgent)
│   │   └── appraiser.ts              (NEW — AppraiserAgent)
│   │
│   ├── orchestrator/
│   │   ├── orchestrator.ts            (NEW — ConversationOrchestrator)
│   │   ├── policies/
│   │   │   ├── alternating.ts         (procurement)
│   │   │   ├── structured-sequence.ts (legal)
│   │   │   ├── mediator-led.ts        (mediation)
│   │   │   └── types.ts
│   │   └── termination.ts
│   │
│   ├── scenario/
│   │   ├── loader.ts                  (NEW — load scenario from Supabase)
│   │   ├── templates.ts              (NEW — pre-built scenario definitions)
│   │   └── types.ts
│   │
│   ├── prompts/
│   │   ├── template-engine.ts         (slot substitution + conditional blocks)
│   │   ├── freeze.ts                  (write to frozen_prompts table)
│   │   └── validate.ts
│   │
│   ├── experiment/
│   │   ├── experiment.ts              (ExperimentDefinition model)
│   │   ├── runner.ts                  (ExperimentRunner — browser + CLI)
│   │   ├── cell-enumerator.ts         (factor crossing)
│   │   └── progress.ts               (tracking via Supabase)
│   │
│   ├── outcomes/
│   │   ├── extractor.ts              (compute DVs per scenario schema)
│   │   ├── utility-functions.ts      (weighted-sum, single-binary, etc.)
│   │   ├── csv-export.ts
│   │   └── transcript-export.ts
│   │
│   └── linguistics/
│       ├── analyser.ts               (warmth, dominance via LLM)
│       └── lexical.ts                (regex: question rate, gratitude)
│
├── hooks/
│   ├── (existing hooks — untouched)
│   ├── useScenario.ts                (NEW — scenario CRUD)
│   ├── useAgentDesigner.ts           (NEW — per-agent config)
│   ├── usePromptEditor.ts            (NEW — template editing)
│   ├── useExperimentDesigner.ts      (NEW — factor/level/cell config)
│   ├── useExperimentRunner.ts        (NEW — run orchestration)
│   └── useRunDashboard.ts            (NEW — realtime progress)
│
├── components/
│   ├── (existing components — untouched)
│   ├── research/                      (NEW — Research UI)
│   │   ├── ResearchLayout.tsx         (top-level research view)
│   │   ├── Library.tsx                (scenario templates browser)
│   │   ├── ScenarioBuilder.tsx        (create/edit scenarios)
│   │   ├── AgentDesigner.tsx          (agent config forms)
│   │   ├── PromptEditor.tsx           (template editor + preview)
│   │   ├── ExperimentDesigner.tsx     (factors, cells, params)
│   │   ├── RunDashboard.tsx           (progress, controls)
│   │   ├── TranscriptViewer.tsx       (per-dyad transcript + supervisor panel)
│   │   ├── ResultsView.tsx            (CSV download, summary stats)
│   │   └── CellConfigTable.tsx        (model assignments per cell)
│   │
│   └── types/
│
├── types/
│   ├── index.ts                       (extend)
│   ├── scenario.ts                    (NEW)
│   ├── agents.ts                      (NEW)
│   ├── experiment.ts                  (NEW)
│   └── outcomes.ts                    (NEW)

scenarios/                              (pre-built scenario data, loaded into DB on first run)
├── procurement/
│   ├── scenario.json                   (seed data for Supabase)
│   ├── prompts/
│   │   ├── buyer.md
│   │   ├── seller.md
│   │   ├── judge.md
│   │   ├── analyst.md
│   │   ├── appraiser.md
│   │   ├── mandates/
│   │   │   ├── high-warmth.md
│   │   │   └── low-warmth.md
│   │   └── kraljic/
│   │       ├── non-critical.md
│   │       ├── leverage.md
│   │       ├── bottleneck.md
│   │       └── strategic.md
│   └── experiments/
│       ├── e1_capability_asymmetry.json
│       ├── e2_mandate_warmth.json
│       └── e3_item_criticality.json
│
├── legal_advocacy/
│   ├── scenario.json
│   ├── prompts/
│   └── experiments/
│
└── mediation/
    ├── scenario.json
    ├── prompts/
    └── experiments/

cli/                                    (secondary interface)
├── index.ts
├── run-experiment.ts
└── tsconfig.json
```

---

## 13. Revised Phase Plan

| Phase | What Ships | Key Deliverable |
|-------|-----------|----------------|
| **2: Core abstractions** | Agent interface (6 providers, no tiers), ConversationOrchestrator with pluggable turn policies, Scenario loader, new Supabase tables | Generic multi-agent engine |
| **3: Supervisor agents** | Classifier, Extractor, Appraiser types + procurement-specific implementations with provided prompts | Structured output pipeline |
| **4: Prompt templates** | Template engine (slots + conditional blocks), freeze mechanism, all procurement templates, placeholder legal/mediation templates | Reproducibility layer |
| **5: Browser UI — Scenario & Experiment** | Library, ScenarioBuilder, AgentDesigner, PromptEditor, ExperimentDesigner | No-code research design |
| **6: Browser UI — Run & Results** | RunDashboard, TranscriptViewer, ResultsView, CSV export, experiment runner in browser | No-code experiment execution |
| **7: Outcome extraction** | Scenario-specific outcome computation (procurement: PRR, surplus, anomalies, joint value), CSV matching simulate.py | Analysis-ready data |
| **8: Linguistic features** | LLM warmth/dominance scoring, lexical metrics (question rate, gratitude) | Process variables |
| **9: CLI runner** | Headless runner sharing src/lib modules, reads from Supabase or YAML | Power-user automation |
| **10: Documentation & release** | README, contributing, replication guide, 3 scenario templates seeded | Community release |

Note: UI phases (5, 6) are now explicit. CLI is Phase 9 (secondary).

---

## 14. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| **Browser-based experiment execution at scale** — running 1,640 dyads from a browser tab with parallel API calls | Configurable concurrency (default 5). Progress persisted per-dyad to Supabase, so a page refresh resumes cleanly. For very large runs, use CLI. |
| **Meta/Alibaba API access** | Configurable `baseUrl` per provider. If official API unavailable, user can point to any compatible endpoint. |
| **Supabase row volume** — 1,640 dyads × ~15 messages × supervisors = ~50,000 rows per experiment | Well within Supabase free/pro tier limits. Indexed by dyad_id and run_id. |
| **Scenario abstraction complexity** — building a full no-code scenario builder is a large UI effort | Phase 5 delivers MVP: form-based config, not drag-and-drop. Advanced features (custom utility functions, complex turn policies) can iterate. |
| **Real-time dashboard** | Supabase Realtime subscriptions on `dyads` table. Lightweight polling fallback. |
| **Template editor UX** | Start with CodeMirror or simple textarea + slot detection. Rich editor can iterate. |

---

## 15. No Remaining Blocking Questions

All 12 questions have been answered. The plan is complete.

---

**Waiting for approval before starting Phase 2.**
