# AsPredicted Pre-Registration: Experiment 1

**Study title:** Capability asymmetry in agent-to-agent procurement negotiations: A 2 × 2 between-dyads experiment

**Authors:** [User and co-authors], Maastricht University, School of Business and Economics, Department of Marketing and Supply Chain Management

**Date drafted:** [DATE PRIOR TO DATA COLLECTION]

---

## 1. Have any data been collected for this study already?

No. We will not begin data collection until after this pre-registration is finalised and posted on AsPredicted.

## 2. What is the main question being asked or hypothesis being tested in this study?

We are testing whether capability asymmetry between two LLM-based negotiation agents produces asymmetric economic outcomes in a B2B procurement context, and whether the magnitude of capability-driven rent transfer is directionally asymmetric (larger when the seller is the stronger of the two than when the buyer is the stronger of the two).

Two pre-registered hypotheses.

**H1 (capability asymmetry, baseline).** In agent-to-agent procurement negotiations, the principal whose agent is built on the stronger underlying model captures a larger share of negotiated surplus. Specifically, in dyads where the buyer is frontier and the seller is weaker, buyer surplus exceeds buyer surplus in dyads where the buyer is weaker and the seller is frontier.

**H2 (directional asymmetry).** The variance in price-reduction-rate (PRR) across seller models, holding the buyer model fixed, is at least three times the variance in PRR across buyer models, holding the seller model fixed. This replicates the directional pattern Zhu et al. (2025) report for consumer markets in our B2B procurement setting.

## 3. Describe the key dependent variable(s) specifying how they will be measured.

We pre-register four primary outcomes.

**Buyer surplus (continuous, [0, 1]).** Defined as (walk-away price - final price) / (walk-away price - wholesale cost). Computed deterministically from the analyst-extracted final price and the pre-set walk-away and wholesale parameters. Measured only on dyads that reach a deal (binary: deal vs. walk-away vs. deadlock).

**Price-reduction-rate (PRR, continuous, R).** Following Zhu et al. (2025), PRR = (list price - final price) / list price. Computed deterministically.

**Deal reached (binary).** 1 if both agents agree, 0 if either walks away or the 30-turn cap is reached without resolution.

**Anomaly indicators (four binary variables).** Out-of-budget rate (OBR), out-of-wholesale rate (OWR), overpayment rate (OPR), deadlock rate (DLR), defined exactly as in Zhu et al. (2025).

## 4. How many and which conditions will participants be assigned to?

This is an agent-based study, not a human-subjects study, so "participants" are agent dyads.

A 2 (Buyer agent capability: frontier vs. weaker) x 2 (Seller agent capability: frontier vs. weaker) between-dyads design yielding four cells.

Each dyad is run across five buyer-budget levels (high = 1.2 x list, list, mid = (list + wholesale) / 2, wholesale, low = 0.8 x wholesale), following Zhu et al. (2025), with budget level as a within-dyad covariate.

Manipulation operationalisation:

- **Frontier model:** GPT-4.1 (with Claude Opus 4.7 as a robustness substitute in the multiverse analysis).
- **Weaker model:** Llama 3.1 8B (with Qwen 2.5 7B as a robustness substitute in the multiverse analysis).

Three supervisor agents (judge, analyst, appraiser) are held constant at GPT-4.1, temperature 0.0, across all conditions. Buyer and seller agents run at temperature 0.20, following Vaccaro et al. (2025).

Mandate framing is held neutral (empty mandate slot) across all four cells. Item is a non-critical office-supplies category with realistic wholesale, list, and budget parameters drawn from public benchmarks.

## 5. Specify exactly which analyses you will conduct to examine the main question/hypothesis.

**Primary test of H1.** Linear mixed model with buyer surplus as the dependent variable, capability cell as a categorical predictor (four levels), and budget-level as a within-dyad covariate. Random effect for model-pair instance. Cluster-robust standard errors at the model-pair level.

The pre-registered planned contrast tests buyer surplus in (frontier buyer, weaker seller) vs. (weaker buyer, frontier seller). One-sided test at alpha = 0.05. Effect size reported as Cohen's d with 95% confidence interval.

**Primary test of H2.** Levene's test on PRR variance across the two off-diagonal cells. Specifically, we compare the variance of PRR within (frontier buyer, weaker seller) and (frontier buyer, frontier seller) (this is the "vary seller" set with buyer fixed at frontier) against the variance of PRR within (frontier seller, weaker buyer) and (frontier seller, frontier buyer) (this is the "vary buyer" set with seller fixed at frontier).

Pre-registered prediction: ratio of seller-variance to buyer-variance >= 3.

We additionally report the bootstrapped 95% confidence interval on the variance ratio using 10,000 resamples.

**Secondary test on deal rate.** Logistic regression of deal (1/0) on capability cell, with the same clustering structure.

**Anomaly reporting.** OBR, OWR, OPR, DLR reported as descriptive tables by cell x budget level, with cell counts and 95% binomial confidence intervals. We pre-register that any cell with an anomaly rate exceeding 5% will be flagged and discussed in the paper. We do not pre-register anomaly rates as primary hypothesis tests.

## 6. Any secondary analyses?

Yes, three.

**Multiverse on model-pair selection.** We re-run the primary tests substituting Claude Opus 4.7 for GPT-4.1 as the frontier model, and substituting Qwen 2.5 7B for Llama 3.1 8B as the weaker model, in all four combinations. We will report whether the directional findings (H1 and H2) replicate across model-pair choices.

**Bayesian posteriors.** For both H1 and H2, we will report Bayesian posterior probabilities of the directional hypothesis using weakly informative priors (Cauchy(0, 0.707) on the standardised effect size).

**Exploratory transcript analyses.** We will explore conversation length, warmth and dominance text scores (extracted via the procedure in Vaccaro et al., 2025), and question/gratitude/hedging rates as exploratory descriptive statistics. These are not pre-registered as hypothesis tests.

## 7. How many observations will be collected or what will determine sample size?

Target final N: 600 dyads (150 per cell, four cells), each run across five budget levels, yielding 3,000 negotiations.

We collect 5% extra dyads per cell to absorb pre-registered exclusions, so initial collection target is 158 dyads per cell x 4 = 632 dyads.

**Sample size justification.** Power analysis for the H1 contrast (one-sided t-test, alpha = 0.05):

- Cohen's d = 0.20 (small effect), N = 150 per group: power = 0.65.
- Cohen's d = 0.30 (small-to-moderate), N = 150 per group: power = 0.91.
- Cohen's d = 0.50 (moderate), N = 150 per group: power > 0.99.

Zhu et al. (2025) report effects in the d = 0.50 to d = 1.20 range across capability tiers in B2C consumer negotiations. Our N = 150 per cell is therefore conservative for the H1 contrast.

For H2 (variance ratio test) with 300 observations on each side and a true variance ratio of 3:1, power exceeds 0.95.

We do not stop data collection early. We do not add observations after reaching N = 632.

## 8. Anything else you would like to pre-register?

**Pre-registered exclusion rules.** A negotiation is excluded from analysis if (a) one of the agents fails to respond within three retries due to API failure, (b) the analyst flags more than three rounds in which a price could not be extracted, or (c) the judge produces inconsistent classifications across more than three rounds.

**Pre-registered termination rule.** A negotiation terminates when the judge classifies the most recent buyer or seller message as ACCEPTANCE, when either agent's message contains an explicit walk-away (judged as REJECTION), or when 30 turns are reached without termination (DLR).

**Pre-registered prompt freeze.** All five agent prompts (buyer, seller, judge, analyst, appraiser) are frozen at the start of data collection and will not be modified during the run. The frozen prompts are deposited in the OSF repository at the time of pre-registration.

**Pre-registered model freeze.** Specific model versions (e.g., gpt-4.1-2025-04-14, claude-opus-4-7) are frozen at the start of data collection. If a frozen model is deprecated mid-run, we restart the run on a substitute and report this transparently.

**Open materials and data commitment.** All transcripts, prompts, analysis code and structured outcome files will be released via the ai2aichat.com OSF repository under a CC BY licence at the time of paper submission.

---

## Note on companion pre-registrations

This pre-registration is for Experiment 1 only. Experiments 2 and 3 will be pre-registered separately on AsPredicted prior to their respective data collection windows. Pre-registering separately is deliberate: it allows reviewers to assess each experiment's design independently and avoids the situation where a finding from Experiment 1 informs the design of Experiments 2 and 3 in ways that are not transparently flagged.
