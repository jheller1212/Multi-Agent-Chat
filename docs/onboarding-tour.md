# Onboarding Tour — Coachmark Spec

First-run researcher tour. Aligned with the coachmark blueprint in `design-system.md` (scrim + cutout spotlight, 300px card, "STEP N OF 7" overline, Skip left / Back-Next right, Esc dismiss, `spring.gentle` spotlight moves). Companion to `ux-architecture.md`.

## The 7 stops

| # | Screen | Anchor (`data-tour`) | Headline | Body | Prio |
|---|--------|----------------------|----------|------|------|
| 1 | any | sidebar nav group (Library→Results) | Your research pipeline, in order | Scenarios define WHO negotiates, Experiments define WHAT varies, Runs execute, Results export. You'll move top to bottom. | P1 |
| 2 | Library | Procurement Negotiation template card | Start from a template | These are ready-made negotiation designs — agents, prompts, and termination rules included. Clone one instead of starting blank. | P1 |
| 3 | Scenario Studio | Agent Roster lanes | Two kinds of agents | Negotiators talk; supervisors watch — judging rounds, extracting outcomes, scoring quality. Drag within the top lane to set speaking order. | P2 |
| 4 | Scenario Studio | Parameters chip row | Placeholders become variables | Anything in {BRACES} stays abstract here and gets a concrete value at launch. Amber chips are still unbound. | P2 |
| 5 | Wizard step 1 | Factors card | Factors build your design | Each factor's levels multiply into cells, and every cell gets N conversations. Two factors with two levels = a 2×2 design. | P1 |
| 6 | Wizard step 3 | readiness checklist (incl. preflight row) | Preflight before you pay | We verify your API keys actually reach each provider before any dyad spends money. Green means launch is safe. | P1 |
| 7 | Results (empty state ok) | Export bar | Everything exports for analysis | Outcomes as CSV, full transcripts and frozen prompts as a provenance bundle. Your methods section cites the prompt hashes. | P2 |

No settings stop — stop 6's failure path deep-links to Settings.

## Trigger + ordering logic

- **Start**: auto-launch once, on first arrival at Library when the user has zero own scenarios AND `localStorage 'mac_tour_state'` is absent. Manual re-entry via "Take the tour" in the sidebar footer (exists in ResearchShell).
- **Cross-screen**: the tour NAVIGATES for the user (reuse current OnboardingTour's `onNavigate`): stops 1–2 Library, 3–4 Studio with a cloned demo scenario opened read-only, 5 wizard step 1, 6 step 3, 7 Results. **Next on stop 2 performs the clone itself** so stop 3 has a real anchor.
- **Anchor resolution**: each stop declares a `data-tour="stop-id"` selector; if missing (feature flag, empty-state variant), skip to next resolvable stop and renumber the overline dynamically — never spotlight a blank region.
- **Wander-off/resume**: click outside spotlight → dismiss card, keep state. Persist `{ lastCompletedStop, status: 'active'|'skipped'|'done' }` after every step. On next visit to any tour screen while `status='active'`, show a resume toast ("Resume tour — step 4 of 7", action button) — never re-scrim unprompted; resuming navigates to the stored stop's screen first, then spotlights.
- **Persistence**: per-user, not per-device — `tour_state` JSONB on the user (user_prefs row or auth user_metadata), mirrored to localStorage for instant reads. Migrate the current localStorage-only `'mac_tour_completed'` flag (ResearchLayout.tsx:409-411) into the new state on first load. (Server persistence P3; localStorage fallback fine for pilot.)
- **Skip**: `status='skipped'` permanently (never auto re-show). Esc = skip-for-now (`status` stays `'active'`, resume toast applies). Completing stop 7 → `status='done'` + one-time toast "Tour complete — clone a template to begin."
- **Reduced motion**: spotlight jumps (no spring), card fades only.
