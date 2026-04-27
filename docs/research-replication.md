# Research Replication Guide

This guide explains how to reproduce the experiments from the JPSM paper using the Multi-Agent-Chat platform.

---

## Prerequisites

- A Multi-Agent-Chat account (sign up at the deployed instance or run locally — see the [Quickstart](../README.md#quickstart))
- API keys for the providers used in each experiment (OpenAI and Anthropic are required for E1–E3 as described below)
- The `analysis/simulate.py` script for post-processing (included in the repository)

---

## Step 1: Clone the Procurement Negotiation scenario

1. Sign in and navigate to **Research > Library**
2. Find the **Procurement Negotiation** template
3. Click **Duplicate** — give it a name like "JPSM Replication"
4. The cloned scenario opens in the Scenario Builder

Do not modify the scenario definition, agent prompts, or supervisor prompts. The prompts in `scenarios/procurement/prompts/` are the exact versions used in the paper.

---

## Step 2: Configure experiment E1 — Capability Asymmetry (2×2)

E1 tests whether buyer and seller capability (strong vs. weak model) affects negotiation outcomes.

**Factors:**
- `buyer_capability`: `strong` (GPT-4.1) | `weak` (GPT-4o Mini)
- `seller_capability`: `strong` (GPT-4.1) | `weak` (GPT-4o Mini)

**Cells:** 4 (2×2 crossing)

**N per cell:** as reported in the paper (recommended: 30 dyads per cell = 120 total)

**Mode:** single-issue (price only); disable the `[MULTI_ISSUE]` block in the buyer and seller prompts

**Budget levels:** 5 per dyad (120, 100, 80, 60, 48); the experiment config randomises budget assignment from a fixed seed

In **Experiment Designer**:
1. Add factor `buyer_capability` with levels `strong`, `weak`
2. Add factor `seller_capability` with levels `strong`, `weak`
3. In **Cell Configuration**, assign models:
   - `strong`: `gpt-4.1` (OpenAI)
   - `weak`: `gpt-4o-mini` (OpenAI)
4. Set N per cell and seed (use seed `42` to match the paper)
5. Click **Review & Launch**

---

## Step 3: Configure experiment E2 — Mandate Warmth (2×2×2)

E2 adds a warmth manipulation to the buyer and seller prompts via the `[MANDATE]` block.

**Factors:**
- `buyer_capability`: `strong` | `weak`
- `seller_capability`: `strong` | `weak`
- `warmth`: `high` | `low`

**Cells:** 8

**Mode:** multi-issue (price, payment terms, delivery, warranty); enable the `[MULTI_ISSUE]` block

**Budget:** fixed at list price ($100); walkaway = $100

The `[MANDATE]` block content is controlled by the `warmth` factor. The high-warmth and low-warmth mandate texts are in `scenarios/procurement/prompts/mandates/`. In Cell Configuration, set the `MANDATE_TEXT` slot to the appropriate content per cell.

---

## Step 4: Configure experiment E3 — Item Criticality / Kraljic (2×4)

E3 varies the Kraljic quadrant framing of the negotiated item.

**Factors:**
- `capability`: `strong` | `weak` (applied symmetrically to buyer and seller)
- `kraljic_quadrant`: `non_critical` | `leverage` | `bottleneck` | `strategic`

**Cells:** 8

**Mode:** multi-issue; enable the `[CRITICALITY]` block

The `ITEM_DESCRIPTION` and `KRALJIC_FRAMING_TEXT` slots vary by quadrant. Item descriptions are in `scenarios/procurement/prompts/kraljic/`. Set slot values per cell in Cell Configuration.

---

## Step 5: Set model assignments and API keys

1. Go to **Settings > API Keys** and enter keys for OpenAI (required for all experiments) and Anthropic (if replicating with Claude models)
2. Supervisor agents (Judge, Analyst, Appraiser) should be assigned a frontier model — the paper used `gpt-4.1` for all supervisors

---

## Step 6: Launch

Click **Launch** on the experiment. The Run Dashboard shows:
- Per-cell completion counts
- Anomaly flags (OBR, OWR, OPR, DLR)
- Live transcript for any in-progress dyad

Runs can be paused and resumed. A page refresh is safe — the runner picks up pending dyads.

---

## Step 7: Download results

When the run completes, go to **Results > Data Download** and export the CSV. The schema matches the `outcome_records` table:

| Column | Description |
|--------|-------------|
| `dyad_id` | UUID of the dyad |
| `buyer_model` | Provider/model string for the buyer |
| `seller_model` | Provider/model string for the seller |
| `deal` | 1 = agreement, 0 = no deal |
| `final_price` | Agreed price (null if no deal) |
| `prr` | Price-relative-to-reserve ratio |
| `buyer_surplus` | Buyer's surplus (budget − final_price) |
| `buyer_share` | Buyer's share of total surplus |
| `turns` | Number of turns taken |
| `obr` | Opening-bid anomaly (buyer opened above list) |
| `owr` | Over-walkaway anomaly (deal below seller walkaway) |
| `opr` | Over-reserve anomaly (deal above buyer budget) |
| `dlr` | Deadlock anomaly (impasse without explicit rejection) |
| `svi_buyer` | Mean SVI score for buyer (18-item scale) |
| `svi_seller` | Mean SVI score for seller |
| `joint_value` | Weighted joint value [0, 2] |
| `payment_terms_days` | Agreed payment terms (multi-issue only) |
| `delivery_weeks` | Agreed delivery window (multi-issue only) |
| `warranty_months` | Agreed warranty length (multi-issue only) |

---

## Step 8: Run the analysis script

```bash
python analysis/simulate.py --input results_e1.csv --experiment e1
```

The script produces the tables and figures reported in the paper. See `analysis/README.md` for full options.

---

## Verifying replication

The frozen prompt hashes recorded on each dyad row (`frozen_prompts` table, linked via `experiment_runs`) allow exact verification that the prompts used match the paper. Export the `frozen_prompts` rows and compare SHA-256 hashes against the values published in the paper's supplementary materials.
