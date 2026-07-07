# TEMPLATE_VERSION 3 — Reconciliation Spec

Reconciles the repo templates with the original design intent recovered from the live DB config and the canonical prompt files in `scenarios/procurement/prompts/` (commit 9a661f3, Phases 3–4 — never deleted). Implementer: follow the checklist in §9; every value here is exact.

**Why**: the live Procurement template row carries the original JPSM design (analyst tracker, 18-item SVI, full outcome schema with prr/surplus/joint_value/weighted_sum) but its promptTemplate fields are file paths (old scheme, not runnable). The repo v2 template is runnable but simplified. The versioned refresh must not clobber the design — v3 absorbs it. **Gate: no production deploy until v3 lands.**

## 1. Canonical constraints (from the prompt files)

- `buyer.md`/`seller.md` use conditional blocks `[MULTI_ISSUE]`/`[CRITICALITY]`/`[MANDATE]` processed by `src/lib/prompts/template-engine.ts renderTemplate()` — which the runner never calls. v3 inline prompts resolve `[MULTI_ISSUE]` by hand and EXCLUDE `[CRITICALITY]`/`[MANDATE]` (baseline). Runner adoption of renderTemplate + kraljic/mandate factor-to-text maps = P2 backlog (variant texts: `scenarios/procurement/prompts/kraljic/*.md`, `mandates/*.md`).
- The appraiser is the **full 18-item SVI** questionnaire (`appraiser.md`): items 1–16 = Curhan/Elfenbein/Xu (2006), 4 subscales × 4 items (instrumental 1–4, self 5–8, process 9–12, relationship 13–16); items 3 and 5 reverse-scored; items 17–18 supplementary (future business, trust).
- Currency is **USD**. Canonical slot names: ITEM_DESCRIPTION, QUANTITY, LIST_PRICE, BUDGET, WALKAWAY, WHOLESALE_COST, SELLER_WALKAWAY, W_PRICE/W_PAYMENT/W_DELIVERY/W_WARRANTY, ISSUE_LIST. v2's TARGET_PRICE/FLOOR_PRICE are dropped.
- `judge.md`'s {LATEST_*} slots and `analyst.md`'s per-message form don't match runner hooks — v3 adapts (classifier context block; per-round analyst).

## 2. Procurement v3 supervisor set (five entries; ALL schemas in SIMPLE shape — see §8)

### (a) judge — classifier, per_round
promptTemplate:
```
You are observing a procurement negotiation between a Buyer and a Seller. The most recent messages are provided below.

Classify the current state of the negotiation as exactly one of:
- ACCEPTANCE: Both parties have explicitly agreed on all terms with concrete numerical values for every required issue.
- REJECTION: One or both parties have explicitly walked away from the negotiation.
- CONTINUE: The negotiation is ongoing and neither acceptance nor rejection has occurred.

Required issues for this experiment: {ISSUE_LIST}.

Acceptance requires explicit agreement on every required issue with a concrete numerical value, not just verbal assent.

Output a single JSON object with one key "status" whose value is one of "ACCEPTANCE", "REJECTION", or "CONTINUE". Do not output any other text.

Example: {"status": "CONTINUE"}
```
outputSchema: `{ allowedValues: ['ACCEPTANCE','REJECTION','CONTINUE'], terminalValues: ['ACCEPTANCE','REJECTION'] }`

### (b) analyst — extractor, per_round (revived; per-round preserves offer trajectory)
promptTemplate:
```
You are extracting structured data from the most recent round of a procurement negotiation (one Buyer message and one Seller message, provided below).

For each party, extract the numerical values they PROPOSED in this round. Distinguish between proposing a value (active offer or counter-offer) and merely mentioning a value (e.g., quoting the counterpart's prior offer). Only extract values the speaker is proposing. Return null when a party proposed no value for a field.

Fields:
- buyer_price: number or null (per unit, in USD, proposed by the Buyer)
- seller_price: number or null (per unit, in USD, proposed by the Seller)
- payment_terms_days: integer or null (most recent proposal by either party)
- delivery_weeks: integer or null (most recent proposal by either party)
- warranty_months: integer or null (most recent proposal by either party)

Output a single JSON object with exactly these fields. Do not output any other text.

Example: {"buyer_price": 84.50, "seller_price": null, "payment_terms_days": 30, "delivery_weeks": 4, "warranty_months": 12}
```
outputSchema: `{ keys: [ {name:'buyer_price',type:'float',nullable:true}, {name:'seller_price',type:'float',nullable:true}, {name:'payment_terms_days',type:'integer',nullable:true}, {name:'delivery_weeks',type:'integer',nullable:true}, {name:'warranty_months',type:'integer',nullable:true} ] }`

### (c) outcome_extractor — extractor, post_termination
v2's, extended: add agreed payment_terms_days / delivery_weeks / warranty_months (null if no deal) to prompt rules; `deal` as 0/1 integer (prompt example: `"deal": 1`).
outputSchema: `{ keys: [ {name:'deal',type:'integer',nullable:false}, {name:'final_price',type:'float',nullable:true}, {name:'rounds',type:'integer',nullable:false}, {name:'payment_terms_days',type:'integer',nullable:true}, {name:'delivery_weeks',type:'integer',nullable:true}, {name:'warranty_months',type:'integer',nullable:true} ] }`

### (d)+(e) svi_appraiser_buyer / svi_appraiser_seller — appraiser, post_termination
Two single-role entries (avoids role confound; works with the runner's existing per-appraiser call). promptTemplate: `appraiser.md` **verbatim** (all 18 numbered items) with: {ROLE} → literal `Buyer` / `Seller`; `Full transcript:\n{TRANSCRIPT}` → `Full transcript:\n{FULL_TRANSCRIPT}` (requires runner edit B, §9[4]).
outputSchema: `{ keys: [ svi_1 … svi_18, each {type:'integer',nullable:false} ] }` — explicit keys, **never** patternProperties (schema-utils can't parse it).

## 3. Buyer/seller v3 prompts

buyer defaultPromptTemplate:
```
You are a procurement professional employed by ManufactureCo, a mid-sized industrial firm. You are negotiating with a representative of SupplierCo, a potential supplier, regarding the purchase of {ITEM_DESCRIPTION}.

CONTEXT
Item: {ITEM_DESCRIPTION}
Quantity: {QUANTITY} units
Published list price: ${LIST_PRICE} per unit
Your firm's maximum authorised budget: ${BUDGET} per unit
Walk-away threshold: do not agree to any price above ${WALKAWAY} per unit
Quantity, list price, budget and walk-away are private to you and your firm.

In addition to price, three further issues must be agreed upon. Your firm's preferences are as follows:
- Payment terms (net days from delivery): you prefer longer terms. Acceptable range: 15 to 90 days. Issue weight (importance): {W_PAYMENT}/100.
- Delivery window: you prefer shorter delivery. Acceptable range: 2 to 8 weeks. Issue weight: {W_DELIVERY}/100.
- Warranty length: you prefer longer warranty. Acceptable options: 6, 12, 24 or 36 months. Issue weight: {W_WARRANTY}/100.
The price weight is therefore {W_PRICE}/100.
Issue weights are private to you.

GUIDELINES
Negotiate using natural conversation, one message per turn. Make concrete numerical proposals when offering or counter-offering. Do not reveal your maximum budget unless strategically necessary. You may walk away if no acceptable agreement is reachable. The negotiation will end after at most 30 turns. When you reach an agreement, state the final terms clearly. If you wish to walk away, state this clearly. Keep messages concise (no more than 150 words).
```

seller: same structure from `seller.md` — CONTEXT: wholesale cost ${WHOLESALE_COST}, walk-away below ${SELLER_WALKAWAY}; multi-issue preferences reversed exactly per the file (shorter payment, longer delivery, shorter warranty); "Do not reveal your wholesale cost unless strategically necessary." Copy verbatim minus [CRITICALITY]/[MANDATE] blocks and [MULTI_ISSUE] markers.

Note `${LIST_PRICE}`: `$` is literal currency, `{LIST_PRICE}` the slot — plain replaceAll renders "$120"; no escaping needed.

## 4. Outcome schema v3 (19 live columns kept; provenance: [E] extractor, [R] runner/DB, [C] computed at export)

dyad_id [R]; buyer_model, seller_model [R] (config_snapshot per cell, transcript fallback); deal [E] 0/1; final_price [E]; prr [C] = (LIST_PRICE − final_price)/LIST_PRICE; buyer_surplus [C] = WALKAWAY − final_price; buyer_share [C] = buyer_surplus/(WALKAWAY − SELLER_WALKAWAY); turns [R] = dyads.termination_turn; obr/owr/opr/dlr [C] from analyst series — **definitions pending Jonas** (proposed: opening buyer offer round / opening seller offer round / both-offered round count / deal round); svi_buyer, svi_seller [C] = mean of svi_1..16 after reverse-scoring items 3,5 (reversed = 8 − x); items 17–18 excluded from aggregate; joint_value [C] via weighted_sum over utilityConfig; payment_terms_days, delivery_weeks, warranty_months [E].

utilityFunction: 'weighted_sum'. utilityConfig:
```
{ issues: [
  {name:'price', weightParam:'W_PRICE', range:[SELLER_WALKAWAY, WALKAWAY], buyerPrefers:'low', sellerPrefers:'high'},
  {name:'payment_terms_days', weightParam:'W_PAYMENT', range:[15,90], buyerPrefers:'high', sellerPrefers:'low'},
  {name:'delivery_weeks', weightParam:'W_DELIVERY', range:[2,8], buyerPrefers:'low', sellerPrefers:'high'},
  {name:'warranty_months', weightParam:'W_WARRANTY', options:[6,12,24,36], buyerPrefers:'high', sellerPrefers:'low'}
] }
```
[C] columns require an export-layer `computeDerivedOutcomes(dyad, outcome, analystSeries, params)` — part of the results/export task, NOT the template.

## 5. defaultParams v3

```
{ ITEM_DESCRIPTION: 'industrial pressure sensors', QUANTITY: 500, LIST_PRICE: 120, BUDGET: 95, WALKAWAY: 100, WHOLESALE_COST: 60, SELLER_WALKAWAY: 70, W_PRICE: 40, W_PAYMENT: 20, W_DELIVERY: 20, W_WARRANTY: 20, ISSUE_LIST: 'price per unit, payment terms (days), delivery window (weeks), warranty length (months)' }
```
BUDGET (authorised max, 95) ≠ WALKAWAY (hard ceiling, 100) — keep both. Weights sum to 100. User clones of v2 keep old names — harmless (internally consistent).

## 6. Termination + turn cap

terminationConditions: `[{supervisor_classification, judge, [ACCEPTANCE, REJECTION]}, {turn_cap, 30}]`. Cap is 30 (prompts hard-code it; multi-issue needs the room). Cost: ~$0.50–0.55/dyad worst case, ~$0.25–0.35 typical (GPT-4o class); 2×2 N=50/cell ≈ $50–110. devMode on mini/haiku: <1¢/dyad.

## 7. Legal + Mediation

**No v3 redesign** — live rows are non-functional shells (all promptTemplates empty, `{}` schemas; no recoverable design in tree or history). Keep v2 content, templateVersion rides along to 3. Verify: Mediation roundDefinition stays mediator-FIRST `['mediator','party_a','party_b']` (MediatorLedPolicy uses index 0); Legal verdict_classifier stays per_round + terminalValues (live's post_termination classifier can't terminate anything). Backlog (P3, prompts authored by Jonas): Legal argument_analyst + persuasiveness appraiser; Mediation emotional_tone + fairness appraiser.

## 8. Schema-shape rule

Every v3 outputSchema uses SIMPLE shapes (`{allowedValues, terminalValues}` / `{keys:[{name,type,nullable}]}`) — never JSON-Schema, never patternProperties. schema-utils parses simple natively; the Studio serializer round-trips it losslessly; terminalValues in-schema prevents Studio saves from stripping termination.

## 9. Implementer checklist (one PR)

1. `TEMPLATE_VERSION = 3`.
2. Procurement per §§2–6 (name/description mention judge + analyst + extractor + two SVI appraisers).
3. **Runner edit A** (correctness): outcome_records merge restricted to supervisors with `timing === 'post_termination'` (match by supervisorName via scenario.supervisors).
4. **Runner edit B** (appraiser fidelity): inject the FULL_TRANSCRIPT promptSlot into appraiser calls, same as extractor calls.
5. RESERVED_SLOTS for Studio/wizard param collection: FULL_TRANSCRIPT, ROLE, OUTCOME_SUMMARY.
6. Legal/Mediation: v2 content + version ride-along; the two verifications in §7.
7. Tests: schema-utils/model fixtures from the v3 procurement supervisors (simple shapes, 18 SVI keys); judge terminalValues survive Studio round-trip (with PR #10's fix).
8. Backlog entries: template-engine renderTemplate + kraljic/mandate maps (P2); computeDerivedOutcomes incl. obr/owr/opr/dlr pending Jonas (P2); SVI subscale CSV columns + svi_17/18 raw export (pending Jonas); Legal/Mediation supervisor prompts (P3).

**Open questions for Jonas** (export-layer only, non-blocking): obr/owr/opr/dlr definitions; SVI subscale means in CSV; svi_17/18 exported raw.
