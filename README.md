# Multi-Agent-Chat — Multi-Agent Research Platform

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/jheller1212/Multi-Agent-Chat)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Netlify](https://img.shields.io/badge/deployed-Netlify-00C7B7)](https://multi-agent-chat-research.netlify.app)

A browser-first platform for designing and running multi-agent LLM experiments. Built by [DEXLab](https://www.sbe-dexlab.com) at Maastricht University, School of Business and Economics.

Researchers configure scenarios, design factorial experiments, and launch experiments — entirely from the browser, without writing code. Results export as structured CSVs ready for statistical analysis.

---

## Features

- **3 pre-built scenarios** — Procurement Negotiation (2 agents), Legal Advocacy (3 agents), Mediation (3 agents)
- **6 LLM providers** — OpenAI, Anthropic, Google, Mistral, Meta (Llama), Alibaba (Qwen)
- **Factorial experiment design** — define factors and levels, pick provider/model, set N per cell
- **Pre-launch checklist** — validates agents, API keys, factors, and settings before launch with tooltips
- **Live experiment monitoring** — real-time progress dashboard; click any cell to inspect transcripts
- **Structured CSV export** — outcome records match a researcher-defined schema
- **Prompt template system** — `{SLOT}` substitution with live preview in the browser editor
- **Prompt freeze** — at launch, all prompts are hashed (SHA-256) and stored immutably for reproducibility
- **Interactive onboarding tour** — 7-step guided walkthrough for new users
- **Dark mode** — full dark theme support across all screens

---

## Quickstart

```bash
git clone https://github.com/jheller1212/Multi-Agent-Chat.git
cd Multi-Agent-Chat
npm install
```

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

Visit `http://localhost:5173`. Sign in, go to **Settings** to enter an API key, then **Library** to clone a scenario and launch your first experiment.

---

## Data Model

```
Scenario (template — defines agents, prompts, turn policy)
  └── Experiment (design + execution — factors, N per cell, model, data)
       └── Dyads (individual conversations)
            ├── Transcript messages
            ├── Supervisor outputs
            └── Outcome record
```

No separate "runs" layer — an experiment IS the execution unit.

---

## Scenarios

Each scenario ships with domain agents, one supervisor, and a turn policy. Clone and customise in the browser.

| Scenario | Domain Agents | Supervisor | Turn Policy | Turns |
|----------|--------------|------------|-------------|-------|
| Procurement Negotiation | Buyer, Seller | Judge (accept/reject/continue) | Alternating | 20 |
| Legal Advocacy | Plaintiff, Defense, Judge | Verdict classifier | Structured sequence | 20 |
| Mediation | Landlord, Tenant, Mediator | Agreement checker | Mediator-led | 20 |

---

## Architecture

### Agents (`src/lib/agents/`)

| Class | Role |
|-------|------|
| `BaseAgent` | Provider calls, retry logic, token tracking |
| `DomainAgent` | Conversation participant — generates turns |
| `ClassifierAgent` | Supervisor — classifies round state |
| `ExtractorAgent` | Supervisor — extracts structured JSON |
| `AppraiserAgent` | Supervisor — rates outcomes (e.g., SVI items) |

No capability tiers in the platform. Each agent has a `provider`, `model`, `temperature`, and `systemPrompt`. Tier semantics live only in experiment factor labels.

### Orchestrator (`src/lib/orchestrator/`)

Drives each dyad: load scenario → instantiate agents → loop (turn policy selects agent → generate → append → round complete? → run supervisors → check termination) → post-termination supervisors → compute outcomes → persist.

### Turn Policies

| Policy | Pattern | Used by |
|--------|---------|---------|
| `alternating` | A → B → A → B | Procurement |
| `structured_sequence` | A → B → C → A → B → C | Legal |
| `mediator_led` | M → A → M → B → M → A | Mediation |

### Experiment Runner (`src/lib/experiment/runner.ts`)

Enumerates cells from factor crossings, runs dyads with configurable concurrency (default 5), persists progress per dyad. Dev mode skips supervisors (~1/4 API cost).

---

## Supported Providers

| Provider | Example Models | Notes |
|----------|---------------|-------|
| OpenAI | GPT-4o, GPT-4.1 | Direct browser → API |
| Anthropic | Claude Sonnet 4.6, Opus 4.6 | Direct browser → API |
| Google | Gemini 1.5 Pro, Flash | Direct browser → API |
| Mistral | Large, Small | Direct browser → API |
| Meta | Llama 3.1 8B, 70B | Configurable `baseUrl` |
| Alibaba | Qwen 2.5 7B, 72B | Configurable `baseUrl` |

API keys are stored encrypted in the browser and synced to Supabase. They are never sent to any server other than the provider's own API.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + RLS)
- **Design**: DEXLab brand tokens (Deep Blue / Light Blue / Bright Orange)
- **Testing**: Vitest (101 tests)
- **Hosting**: Netlify

---

## Citation

If you use this platform in published research, please cite:

```bibtex
@article{heller2026multiagent,
  title   = {Seller-Side Capability Risk in Agent-to-Agent Procurement Negotiations},
  author  = {Heller, Jonas and Herold, David and Rozemeijer, Frank and Mahr, Dominik},
  journal = {Journal of Purchasing and Supply Management},
  year    = {2026},
  note    = {Preprint — platform available at multi-agent-chat-research.netlify.app}
}
```

---

## Contributing

See [docs/contributing.md](docs/contributing.md) for how to add scenarios, providers, and contribute code.

## Replicating the Paper

See [docs/research-replication.md](docs/research-replication.md) for step-by-step instructions.

## License

MIT License. Copyright (c) 2026 Jonas Heller / DEXLab, Maastricht University. See [LICENSE](LICENSE).
