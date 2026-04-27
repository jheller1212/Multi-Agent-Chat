# Contributing

## Adding a new scenario

A scenario consists of three parts: a seed JSON, prompt templates, and (optionally) pre-built experiment configs.

### 1. Create the scenario seed

Create a directory under `scenarios/` and add `scenario.json`:

```
scenarios/my_scenario/
├── scenario.json
├── prompts/
│   ├── agent_a.md
│   ├── agent_b.md
│   └── supervisor.md
└── experiments/
    └── e1_my_experiment.json
```

`scenario.json` must conform to the `Scenario` type (`src/types/scenario.ts`). Define:
- `domainAgents` — participant agents with `name`, `description`, `defaultPromptTemplate`
- `supervisors` — each with `type` (`classifier` | `extractor` | `appraiser`), `timing` (`per_round` | `post_termination`), `outputSchema`, and `promptTemplate`
- `turnPolicy` — one of `alternating`, `structured_sequence`, or `mediator_led`
- `terminationConditions` — `supervisor_classification` and/or `turn_cap`
- `outcomeSchema` — columns and utility function

### 2. Add prompt templates

Write Markdown files with `{SLOT_NAME}` placeholders and optional `[BLOCK_NAME]...[/BLOCK_NAME]` conditional sections. See `scenarios/procurement/prompts/buyer.md` as a reference.

### 3. Register the template

Add an export to `src/lib/scenario/templates.ts` following the pattern of `PROCUREMENT_SCENARIO`. Add it to the `SCENARIO_TEMPLATES` array.

### 4. Seed the database

On first run, templates are loaded from `SCENARIO_TEMPLATES` into Supabase. To re-seed during development, delete the existing template rows from the `scenarios` table and restart the dev server.

---

## Adding a new LLM provider

### 1. Create the provider class

Add `src/lib/api/providers/myprovider.ts`. Follow the pattern of `src/lib/api/providers/openai.ts`:
- Export a class implementing the provider interface
- Accept `apiKey`, `model`, `baseUrl` (optional) in the constructor
- Implement `complete(messages, options)` returning `{ content: string; tokenUsage: TokenUsage }`

### 2. Register in the factory

Open `src/lib/api/factory.ts` and add your provider to the switch statement.

### 3. Extend the vault

Add a key slot for the new provider in `src/lib/apiKeyVault.ts` and update the `ProviderType` union in `src/types/index.ts`.

### 4. Add to the UI

Add the provider to the provider dropdown in `src/components/research/AgentDesigner.tsx` and the API key settings panel.

---

## Code conventions

- **TypeScript strict mode** — no `any`; use `unknown` when the type is genuinely unknown
- **Functional components** — named exports preferred; no class components
- **Tailwind CSS** — all styling via utilities; no CSS modules, no inline `style` objects
- **Imports** — React/libraries first, local modules second, types last
- **File structure** — `src/` is organized by role: `components/`, `lib/`, `types/`, `hooks/`

---

## Testing

Run the test suite:

```bash
npm run test
```

Run in watch mode during development:

```bash
npm run test:watch
```

Tests use [Vitest](https://vitest.dev/) and [@testing-library/react](https://testing-library.com/). Test files live alongside source files in `__tests__/` subdirectories (e.g., `src/lib/agents/__tests__/`).

The build check is the deployment gate:

```bash
npm run build
```

This must pass before pushing any change.

---

## PR workflow

1. Create a branch from `main`: `git checkout -b feature/my-change`
2. Make changes
3. Run `npm run build` — fix any errors before continuing
4. Run `npm run test` — fix any failures before continuing
5. Commit: `git -c user.name="Your Name" -c user.email="you@example.com" commit -m "description"`
6. Push and open a PR against `main`
7. The PR description should state what changed and reference any relevant issue

One change per PR. Do not bundle unrelated changes.
