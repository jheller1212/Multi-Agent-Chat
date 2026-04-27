# Multi-Agent-Chat — Multi-Agent Research Platform

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/jheller1212/Multi-Agent-Chat)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Netlify](https://img.shields.io/badge/deployed-Netlify-00C7B7)](https://multi-agent-chat-research.netlify.app)

A browser-first platform for designing and running multi-agent LLM experiments. Built by [DEXLab](https://dexlab.maastrichtuniversity.nl) at Maastricht University.

Researchers configure scenarios, design factorial experiments, and launch runs — entirely from the browser, without writing code. Results export as structured CSVs ready for statistical analysis.

---

## Screenshots

**Library** — Browse and clone pre-built scenario templates (Procurement Negotiation, Legal Advocacy, Mediation).

**Run Dashboard** — Monitor experiment progress per cell in real time, pause/resume/abort runs, and inspect live transcripts.

---

## Features

- **3 pre-built scenarios** — Procurement Negotiation, Legal Advocacy, Mediation; each ships with domain agents, supervisors, and turn policies
- **6 LLM providers** — OpenAI, Anthropic, Google, Mistral, Meta (Llama), Alibaba (Qwen); configure per agent, per experiment cell
- **Factorial experiment design** — define factors and levels, assign models per cell, set N per cell; the platform cross-joins everything automatically
- **Live run monitoring** — real-time progress dashboard via Supabase subscriptions; click any dyad to watch its transcript live
- **Structured CSV export** — outcome records match a researcher-defined schema; drop into R or Python without post-processing
- **Prompt template system** — Markdown templates with `{SLOT}` substitution and `[BLOCK]...[/BLOCK]` conditionals; slot autocomplete in the browser editor
- **Freeze mechanism** — at launch, all prompts are rendered, hashed (SHA-256), and stored immutably; every dyad records the exact prompt used, guaranteeing replication

---

## Quickstart

```bash
git clone https://github.com/jheller1212/Multi-Agent-Chat.git
cd Multi-Agent-Chat
npm install
```

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

Visit `http://localhost:5173`. Sign in, navigate to **Research > Library**, and clone a scenario to start.

---

## Architecture Overview

### Agents

| Class | Role |
|-------|------|
| `BaseAgent` | Shared retry logic, provider calls, token tracking (`src/lib/agents/agent.ts`) |
| `DomainAgent` | Participant agent — generates conversational turns (`src/lib/agents/domain-agent.ts`) |
| `ClassifierAgent` | Supervisor — returns one value from a fixed set (e.g., ACCEPTANCE / REJECTION / CONTINUE) |
| `ExtractorAgent` | Supervisor — returns structured JSON matching the scenario's output schema |
| `AppraiserAgent` | Supervisor — returns numerical ratings (e.g., SVI items 1–18) |

Agents have no capability tier. Each agent has a `provider`, `model`, `temperature`, `maxTokens`, and a fully rendered `systemPrompt`. Tier semantics live only as factor level labels in experiment configs.

### Orchestrator

`ConversationOrchestrator` (`src/lib/orchestrator/orchestrator.ts`) drives each dyad:

1. Load scenario and frozen prompts
2. Instantiate agents
3. Loop: turn policy selects next domain agent → agent generates → append to transcript → when round complete, run per-round supervisors → check termination
4. Post-termination: run post-termination supervisors, compute outcomes, persist

**Turn policies** (`src/lib/orchestrator/policies/`):

| Policy | Use case |
|--------|----------|
| `alternating` | Two-party back-and-forth (Procurement) |
| `structured_sequence` | Fixed order with multiple participants (Legal Advocacy) |
| `mediator_led` | Mediator selects next speaker dynamically (Mediation) |

### Scenarios

A scenario defines domain agents, supervisors (with output schemas), turn policy, termination conditions, and an outcome schema. Scenarios are stored in Supabase and can be cloned and modified in the browser.

Pre-built templates (`src/lib/scenario/templates.ts`):

| Scenario | Agents | Supervisors | Turn Policy |
|----------|--------|-------------|-------------|
| Procurement Negotiation | Buyer, Seller | Judge (classifier), Analyst (extractor), Appraiser | Alternating |
| Legal Advocacy | Plaintiff Lawyer, Defense Lawyer, Judge | Verdict Classifier, Argument Analyst, Persuasiveness Appraiser | Structured Sequence |
| Mediation | Disputant A, Disputant B, Mediator | Agreement Extractor, Emotional Tone Analyser, Fairness Appraiser | Mediator-Led |

### Experiment Runner

`ExperimentRunner` (`src/lib/experiment/runner.ts`) enumerates cells from factor crossings, generates per-dyad parameter sets from a seed, and runs dyads with configurable concurrency (default: 5 parallel). Progress is persisted to Supabase after each dyad — a page refresh resumes from where the run stopped.

**Dev mode** (`devMode: true`): skips supervisor agents, uses keyword-based termination, reduces concurrency to 1, approximately one-quarter of normal API cost.

---

## Supported Providers

| Provider | Example Models | Notes |
|----------|---------------|-------|
| OpenAI | GPT-4.1, GPT-4o | Direct browser → API |
| Anthropic | Claude Opus 4.6, Sonnet 4.6 | Direct browser → API |
| Google | Gemini 1.5 Pro, Gemini Flash | Direct browser → API |
| Mistral | Large, Medium, Small, 7B | Direct browser → API |
| Meta | Llama 3.1 8B, 70B | OpenAI-compatible endpoint; configurable `baseUrl` |
| Alibaba | Qwen 2.5 7B, 72B | DashScope or OpenAI-compatible; configurable `baseUrl` |

API keys are stored in-browser (localStorage) and never sent to any backend other than the provider's own API.

---

## Citation

If you use this platform in published research, please cite:

```bibtex
@article{heller2026multiagent,
  title   = {Multi-Agent LLM Experiments in Negotiation Research},
  author  = {Heller, Jonas and [Co-authors TBD]},
  journal = {Journal of Public Sector Management},
  year    = {2026},
  note    = {Preprint}
}
```

---

## License

MIT License. Copyright (c) 2026 Jonas Heller / Maastricht University. See [LICENSE](LICENSE).
