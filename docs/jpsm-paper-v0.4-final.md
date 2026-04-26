# Seller-Side Capability Risk in Agent-to-Agent Procurement Negotiations: An Experimental Study

**Working draft v0.4**

**Target journal:** *Journal of Purchasing and Supply Management*

**Authors (placeholder):** [User and co-authors], Maastricht University, School of Business and Economics, Department of Marketing and Supply Chain Management

> **Draft note.** Results reported in Sections 5 to 7 are based on data simulated under realistic effect-size assumptions drawn from Zhu et al. (2025) and Vaccaro et al. (2025), to demonstrate the structure of the eventual results section. Live data collection on ai2aichat.com follows after pre-registration on AsPredicted. The simulation script and seed are deposited in the OSF companion repository for transparency. All numbers in Sections 5 to 7 should be read as illustrative of the reporting format, not as findings.

---

## Abstract

Generative AI agents have moved from assisting procurement professionals to acting on their behalf. Our prior work (Herold, Heller, Rozemeijer and Mahr, 2025) showed that an AI buyer chatbot extracts meaningful concessions from human suppliers. The next step, anticipated by Shahidi, Rusak, Manning, Fradkin and Horton (2025), is the agent-to-agent regime in which both buyer and supplier deploy autonomous agents. Zhu et al. (2025) find in consumer markets that this regime is "an inherently imbalanced game" in which seller-side capability matters far more than buyer-side capability. Whether this directional asymmetry translates to multi-issue B2B procurement, where supplier-base composition and item criticality alter the strategic stakes, is an open question. Using ai2aichat.com, an open-source platform we developed for AI-to-AI conversational experiments, we run three pre-registered studies (N = 1,640 dyads). Experiment 1 manipulates capability asymmetry. Experiment 2 crosses capability with mandate warmth. Experiment 3 examines item criticality (Kraljic). The directional asymmetry from consumer markets replicates in B2B procurement: the variance in price-reduction-rate across seller models is roughly three times larger than the variance across buyer models. Mandate warmth dominates joint value. Item criticality amplifies the asymmetry. We discuss implications for procurement governance, supply-base inequality and mandate-design training.

**Keywords:** agent-to-agent negotiation; generative AI; procurement automation; supplier capability; experimental procurement research

---

## 1. Introduction

The procurement function is on the cusp of a transition that Shahidi, Rusak, Manning, Fradkin and Horton (2025) describe as a Coasean shock. If AI agents can search, screen, negotiate and contract at near-zero marginal cost, the boundary between firm and market shifts. Procurement scholarship has begun to document the first wave. Spreitzenbarth, Bode and Stuckenschmidt (2024) reviewed AI and machine learning in purchasing across 11 use-case clusters and concluded that automation in this domain is still nascent, with negotiation and contracting among the least mature applications. Of the 46 works meeting their inclusion criteria, only three appeared in PSM-focused outlets, and the "automated negotiation" cluster contained 8 papers, all pre-LLM and none in the agent-to-agent regime. Their explicit call was for more AI/ML work in procurement-focused journals. One of the practitioners they interviewed asked whether a machine actually negotiates more often or more strongly than humans. Our paper is in part an answer to that question.

In Herold, Heller, Rozemeijer and Mahr (2025), we showed in three experiments that an AI buyer chatbot, prompted competitively or collaboratively, can secure higher discounts and better payment terms from human suppliers, while collaborative prompting preserves trust and willingness for repeat interaction. That paper, like nearly all procurement-AI work to date, shares a structural assumption: one side of the negotiation is human. That assumption is becoming obsolete. Procurement vendors such as Pactum, Nibble and Ivalua already deploy autonomous negotiation agents, and several Fortune 500 buyers report routine machine-on-machine sourcing for tail spend. Shahidi et al. (2025) argue that this is not the end-state but the warm-up: as agents become cheaper, more capable and more aligned with their principals, both sides of buyer-supplier negotiations will be agentified.

Recent work outside procurement gives us reason to take this seriously. Zhu et al. (2025), in the first systematic study of agent-to-agent consumer negotiations, find that AI-mediated deal-making is asymmetrically risky. Across 100 real consumer products, nine LLMs and five budget levels, they document three patterns. First, the choice of seller agent matters far more than the choice of buyer agent: holding the seller fixed, the price-reduction-rate gap across buyer agents is roughly 2.6 percentage points, whereas holding the buyer fixed the gap across seller agents is roughly 14.9 percentage points. Second, the financial consequences of capability asymmetry run in both directions but are not symmetric in size. Weak buyers facing strong sellers overpay by approximately 2.09 percent. Weak sellers facing strong buyers lose between 6.94 and 14.13 percent of profit relative to symmetric baselines. Third, behavioural anomalies (out-of-budget settlements, out-of-wholesale acceptances, deadlocks and overpayments) occur at non-trivial rates and are concentrated in weaker models. Bianchi, Chia, Yuksekgonul, Tagliabue, Jurafsky and Zou (2024) and Xia et al. (2024) document the same imbalance pattern across thousands of LLM-versus-LLM bargaining rounds. Vaccaro, Caosun, Ju, Aral and Curhan (2025), across 182,812 negotiations from an international competition, find that warmth in agent design dominates every outcome metric, while dominance only claims more value conditional on a deal being reached and is associated with more impasses overall.

Procurement is not retail. Stakes are higher, items are multi-attribute, relationships are repeated, and category criticality matters (Kraljic, 1983; Fontes, Delke, Schiele, Rotmensen and Grobman, 2025). Whether the Zhu et al. directional asymmetry translates to B2B procurement is an empirical question with no current answer. That question has direct theoretical and managerial bite, because supplier markets are dominated by small and medium-sized firms with limited access to frontier AI infrastructure. If seller-side capability risk is the dominant pattern, then asymmetric agentification will systematically disadvantage the supply base.

We make one theoretical and two managerial contributions.

The theoretical contribution is to identify *seller-side capability risk* as a procurement-specific mechanism that classical bargaining theory and existing transaction-cost frameworks (Williamson, 1985; Shahidi et al., 2025) do not predict. Patience and outside options have long structured bargaining outcomes (Rubinstein, 1982; Muthoo, 1999). We show that in agent-to-agent procurement, the negotiation role itself carries asymmetric capability sensitivity: the seller's job (resisting price reductions, selectively conceding, managing multi-issue logrolling) is more demanding and rewards capability more steeply than the buyer's job. This re-orients how procurement scholarship should think about supplier governance under automation.

The first managerial contribution speaks to chief procurement officers and the supply base they negotiate with: asymmetric agentification creates a new form of supply-base inequality in which smaller suppliers without access to frontier models will be systematically disadvantaged, with seller-side losses larger than the buyer-side losses larger buyers might absorb on the rare occasions that they are the weaker party. This has implications for supplier development programmes, fair-dealing standards and the governance of B2B platforms (Wang, Huo, Tian and Yeung, 2025; Chen, Lewis and Liyanage, 2025; Carnovale, Di Mauro, Moradlou and Roscoe, 2025).

The second managerial contribution is that mandate design replaces script training. The marginal hour of a procurement professional is better spent specifying preferences, walk-away thresholds and warmth settings than rehearsing tactics. Heunis, Pulles, Giebels, Kollöffel and Sigurdardottir (2025) show that strategic adaptability training matters for human negotiators; the analogue in the agentified function is mandate-design training. We provide concrete evidence on what dimensions of mandate design move outcomes most.

The remainder of the paper is structured as follows. Section 2 develops the theoretical positioning. Section 3 derives hypotheses. Section 4 describes the platform and the common method. Sections 5 to 7 report Experiments 1, 2 and 3. Section 8 discusses the contributions, limitations, and a research agenda for what we term the *agentified procurement function*.

---

## 2. Theoretical background

### 2.1 The Coasean view of agentified procurement

Coase (1937) argued that the boundary of the firm is set by the relative cost of using the market versus organising activity internally. Shahidi et al. (2025) make the case that AI agents collapse several of those costs simultaneously: search, communication, contracting and monitoring. Patience, in their framing, ceases to be a function of human time and becomes a function of compute. For procurement, this is consequential. Many of the activities that justify having a procurement function in-house, such as supplier discovery, RFQ orchestration, negotiation and contract enforcement, are precisely the activities agents perform at very low marginal cost. The implication is not that procurement disappears, but that its centre of gravity moves from execution to mandate design, governance and oversight (Hadfield and Koh, 2025; Aminoff, Lorentz and Kaipia, 2025).

The Coasean optimism in Shahidi et al. (2025) is, however, blind to a procurement-specific asymmetry. If gains from collapsing transaction costs accrue unevenly when capability is asymmetric, and if the asymmetry is itself directional, then the Coasean shock is also a redistributive event. Whether this is the case is the question this paper takes up.

### 2.2 Three waves of AI in buyer-supplier negotiation research

Research on AI in buyer-supplier negotiations has evolved in three waves. The first wave focused on rule-based and learning negotiation systems, often grounded in mechanism design (Lau, 2007). Spreitzenbarth et al. (2024) catalogue eight works in the "automated negotiation" cluster from this wave, all pre-LLM. The second wave shifted to large-language-model chatbots negotiating against humans. Our own Herold et al. (2025) sits in this wave, alongside Heunis et al. (2025) on negotiation training and the JSCM behavioural-negotiation stream led by the WHU group (Kaufmann, Schreiner and Reimann, 2022; Woelfl, Kaufmann and Carter, 2023; Ried, Kaufmann and Schreiner, 2025; Thomas, Murfield and Eastman, 2021). The third wave, which this paper inaugurates for procurement, examines agent-to-agent regimes, where both principal sides delegate to autonomous LLM-based agents. The closest precedents are Zhu et al. (2025) in consumer markets, Vaccaro et al. (2025) in a multi-issue competition setting, and the broader A2A benchmark work (Bianchi et al., 2024; Xia et al., 2024; Abdelnabi, Gomaa, Sivaprasad, Schönherr and Fritz, 2024; Davidson, Veselovsky, Josifoski, Peyrard, Bosselut, Kosinski and West, 2024). None addresses procurement-specific structure.

### 2.3 Capability asymmetry and the directional structure of bargaining

Classical bargaining theory predicts that the more patient party, or the party with the better outside option, captures more surplus (Rubinstein, 1982; Muthoo, 1999). With agents, two of the classical inputs change. First, patience becomes a function of compute rather than human time (Shahidi et al., 2025). Second, capability becomes the dominant differentiator. Zhu et al. (2025) show that the negotiation-capacity score of a model correlates with general task capability at r = 0.93 with MMLU and r = 0.87 with mathematical reasoning. The choice of model is therefore itself a strategic decision with measurable economic consequences.

The same study uncovers a striking directional asymmetry: the gap in price-reduction-rate when varying seller models is roughly six times larger than the gap when varying buyer models. One way to read this is that the seller's job (resisting price reductions, selectively conceding) is more demanding than the buyer's job (pushing for reductions) and rewards capability more steeply. This is a non-trivial extension of bargaining theory because it implies that capability asymmetry interacts with role assignment, not just with patience.

Why might this be true in B2B procurement specifically? Three mechanisms. First, sellers face a more complex objective function (maximise margin subject to keeping the deal alive), whereas buyers face a simpler one (minimise price subject to walk-away). Second, in multi-issue settings, sellers must integrate price with payment terms, delivery and warranty, all of which they have margin sensitivity to. Buyers have aggregate budget constraints but less per-issue sensitivity. Third, sellers in real procurement settings often anchor against published list prices, which are public, while buyer budgets are private. Asymmetric information advantages the seller in principle, but only if the seller can use it. Capability is the binding constraint on doing so.

### 2.4 Mandate design as the new procurement skill

If agents execute, principals design mandates. The mandate problem encompasses preference elicitation (what does my firm actually want), alignment (does the agent represent those preferences faithfully) and meta-rationality (when should the agent defer to the human). Mandate framing, which we operationalised in Herold et al. (2025) as collaborative versus competitive prompting, is the lever procurement professionals will use most.

Vaccaro et al. (2025) provide the most useful theoretical handle to date on what good mandate framing looks like. Across 182,812 agent-to-agent negotiations, scoring agents on warmth and dominance using the Interpersonal Circumplex framework, they find that warmth dominates every outcome metric: deal rate, value claimed, value created and counterpart subjective value. Dominance helps on value claiming but only conditional on reaching a deal, and is associated with significantly more impasses. Mechanistically, warmth manifests as more questions, more gratitude and more positive language, all of which raise the probability of a deal; dominance manifests as longer conversations and lower willingness to compromise.

This matters for procurement. The collaborative-versus-competitive framing we used in Herold et al. (2025) is closer in spirit to the warmth construct. Showing that warmth carries over to the agent-to-agent regime, and identifying whether it is the buyer's warmth, the seller's warmth, or the dyadic combination that drives outcomes, is the procurement-specific test. We focus on warmth in this paper and leave dominance to follow-up work, in line with Vaccaro et al.'s finding that warmth is the more robust and transferable dimension.

### 2.5 Item criticality as a boundary condition

The Kraljic matrix (Kraljic, 1983; Fontes et al., 2025) remains the dominant framework for stratifying procurement spend. In Herold et al. (2025) we compared non-critical and bottleneck items and found no significant differences, but our setting was single-sided. With both sides agentified, the strategic stakes of bottleneck and strategic items may amplify capability asymmetries because the surplus at stake per negotiation is larger and the consequences of misaligned mandates are harder to reverse.

We expect amplification rather than attenuation, on the following reasoning. In low-criticality categories, walk-away is cheap for both sides, which compresses the bargaining range and reduces the surplus available to capture. In high-criticality categories, walk-away is expensive (especially for the buyer in strategic and bottleneck items, where alternative suppliers are scarce), which expands the bargaining range and increases the absolute surplus at stake. Capability advantages translate into larger absolute rents when more is on the table.

---

## 3. Hypotheses

The narrowed set of hypotheses below corresponds to the three contributions stated in the introduction. We deliberately do not pre-register hypotheses on questions that are exploratory or under-theorised at this stage.

**H1 (capability asymmetry, baseline).** In agent-to-agent procurement negotiations, the principal whose agent is built on the stronger underlying model captures a larger share of negotiated surplus.

**H2 (directional asymmetry).** The variance in price-reduction-rate (PRR) across seller models, holding the buyer model fixed, is at least three times the variance in PRR across buyer models, holding the seller model fixed. This is the procurement-specific test of the directional asymmetry Zhu et al. (2025) report for consumer markets.

**H3a (warmth and deal-reaching).** Mandate warmth on either or both sides increases the probability of reaching a deal at all and the joint value when a deal is reached.

**H3b (warmth super-additivity).** Mutual warmth (both buyer and seller agents instructed for warmth) produces a super-additive effect on joint value beyond the additive effect of either side alone.

**H4 (criticality amplifies asymmetry).** The capability-asymmetry effect on buyer share is larger for bottleneck and strategic items than for non-critical and leverage items. We additionally expect higher walk-away rates for the weaker-agent side in strategic items, suggesting that asymmetric agentification may protect weaker firms by triggering breakdowns rather than extractive deals.

---

## 4. Method overview

This section specifies the platform, the agent architecture, prompts, outcome measures, models and analysis plan that are common across all three experiments. Experiment-specific designs are reported in Sections 5 to 7. Full prompt text is in Appendix A.

### 4.1 The ai2aichat.com platform

All experiments are conducted using ai2aichat.com, an open-source web-based research platform we developed to instantiate two LLM-based agents, assign them distinct system prompts, mandates, model identities, temperature and reasoning settings, run multi-turn conversations to a stopping rule (deal, walk-away or turn cap), and log complete transcripts plus structured outcome variables. The platform supports OpenAI, Anthropic, Google and open-weight models via a unified API layer, and provides built-in randomisation of role assignment, dyad-level controls, and a deal-extraction module that parses agreements into structured fields. The platform complements ResearchChatAI (Becker, De Jong, Briker, Mennens, Heller, Mahr and Grewal, 2025), which we developed previously for human-AI experiments. To our knowledge, ai2aichat.com is the first dedicated experimental platform for agent-to-agent business research. Both tools are released open-source as community infrastructure for the procurement research field, in part as a response to the call from Spreitzenbarth et al. (2024) for more PSM-focused work on AI and machine learning.

### 4.2 Five-agent architecture

Each negotiation is conducted between two LLM agents, with three auxiliary LLM agents acting as supervisors. We adopt the four-agent architecture introduced by Zhu et al. (2025) and add a fifth agent (the appraiser) that handles agent-side subjective value scoring after the negotiation ends, following Vaccaro et al. (2025).

The five agents:

1. **Buyer agent.** The principal-side negotiator. Receives a system prompt with role, mandate, preferences and walk-away thresholds. Generates buyer-side messages.
2. **Seller agent.** The supplier-side negotiator. Symmetric architecture to the buyer, with private wholesale cost in place of buyer budget.
3. **Judge agent.** Reads each round and classifies the buyer's most recent message as one of {accept, reject, continue}. Implemented as a frontier model (GPT-4.1) at temperature 0.0 for determinism. The judge does not see system prompts of buyer or seller, only the conversation. This is identical to Zhu's design and prevents brittle structured-output formatting.
4. **Analyst agent.** Reads each round and extracts the most recently proposed numerical values (price; in Experiments 2 and 3 also payment terms, delivery and warranty). Frontier model, temperature 0.0.
5. **Appraiser agent.** Runs once per negotiation, after termination. Takes the full transcript and the role assignment, and completes the Subjective Value Inventory (Curhan, Elfenbein and Xu, 2006) as if it were each agent. Frontier model, temperature 0.0. Vaccaro et al. (2025) validated this approach against human ratings at r = 0.576.

Buyer and seller use the manipulated model identities (frontier or weaker). Judge, analyst and appraiser are always frontier models held constant across the entire study, to avoid contaminating capability manipulations. Buyer and seller run at temperature 0.20, following Vaccaro et al. (2025).

### 4.3 Prompt structure

We use a single master template with slots that are populated according to the experiment and condition. This forces consistency across the three experiments. Only the slots vary between conditions, never the surrounding scaffolding. Full prompts are in Appendix A. The template comprises a constant role block, a context block (item, prices, budget or wholesale cost, walk-away threshold), a multi-issue block (Experiments 2 and 3 only), a criticality block (Experiment 3 only), a mandate block (warmth manipulation in Experiment 2, neutral elsewhere), and a constant guidelines block specifying the 30-turn cap and 150-word per-message limit.

### 4.4 Outcome variables

We organise outcomes into four categories.

*Structured economic outcomes (extracted deterministically by the analyst agent):* deal reached (binary); final price; price-reduction-rate (PRR) following Zhu et al. (2025); buyer surplus, defined as (walk-away – final price) / (walk-away – wholesale); buyer share of bargaining zone; supplier margin; joint value (Experiments 2 and 3) computed from issue weights.

*Process outcomes (transcript-derived):* turns to deal; total message length; warmth and dominance text scores extracted using the Vaccaro et al. (2025) Interpersonal Circumplex prompt; question rate; gratitude rate; positivity; mimicry (cosine similarity between consecutive turns).

*Agent subjective value (appraiser-rated):* The 16-item Subjective Value Inventory (Curhan, Elfenbein and Xu, 2006), comprising four facets of four items each (Instrumental, Self, Process, Relationship), scored 1 to 7. Plus two additional items connecting to Herold et al. (2025): willingness to repeat business and trust in counterpart's representations. The full SVI is in Appendix B. We are explicit in the discussion section about the epistemic status of these measures: they are agent self-reports interpreted by an appraiser agent, validated against human ratings only at moderate correlation. We treat them as supporting evidence, not primary outcomes.

*Anomalies (following Zhu et al., 2025):* out-of-budget rate (OBR), the proportion of accepted deals where the final price exceeds the buyer's budget; out-of-wholesale rate (OWR), the proportion where the final price falls below the seller's wholesale cost; overpayment rate (OPR), the proportion of successful deals where the buyer pays more than the published list price; deadlock rate (DLR), the proportion of negotiations that hit the 30-turn cap. These are reported as descriptive statistics by cell, not as primary hypothesis tests.

### 4.5 Models

To operationalise capability asymmetry, we select models from two published capability tiers based on a composite of MMLU, GPQA and the negotiation capacity score reported by Zhu et al. (2025). Frontier: GPT-4.1 (with Claude Opus 4.7 as a robustness substitute). Weaker: Llama 3.1 8B (with Qwen 2.5 7B as a robustness substitute). Specific model versions and dates are pre-registered and frozen at the start of data collection.

### 4.6 Pre-registration and open materials

Each experiment is pre-registered separately on AsPredicted prior to data collection. The pre-registrations specify the design, the manipulations, the sample size, the primary tests, the exclusion rules and the directional predictions. Any deviation in the eventual paper is flagged as exploratory. All transcripts, prompts, analysis code and structured outcome files are released via the ai2aichat.com OSF repository under a CC BY licence at the time of paper submission.

### 4.7 Pre-registered exclusions

A negotiation is excluded from analysis if (a) one of the agents fails to respond within three retries due to API failure, (b) the analyst flags more than three rounds in which a price could not be extracted, or (c) the judge produces inconsistent classifications across more than three rounds.

---

## 5. Experiment 1: Capability asymmetry in single-issue procurement

### 5.1 Design

A 2 (Buyer agent: frontier vs. weaker) × 2 (Seller agent: frontier vs. weaker) between-dyads design. N = 600 dyads (150 per cell). Single-issue negotiation over price for a non-critical office-supplies item with realistic wholesale, list and buyer-budget parameters drawn from public benchmarks (list price = $100/unit; wholesale = $60/unit). Each dyad is run across five buyer-budget levels following Zhu et al. (2025): high (1.20 × list), list, mid ((list + wholesale) / 2), wholesale, and low (0.80 × wholesale). Total: 3,000 negotiations.

### 5.2 Procedure

Both agents receive symmetric mandate framing (neutral). Frontier-frontier dyads constitute the symmetric-strong baseline. Weaker-weaker dyads constitute the symmetric-weak baseline. The two off-diagonal cells test capability asymmetry. Each negotiation runs for up to 30 turns and terminates on agreement, walk-away, or cap.

### 5.3 Power

For the H1 contrast (one-sided t-test on buyer surplus, alpha = 0.05), with 150 per cell, power = 0.91 to detect Cohen's d = 0.30. Zhu et al. (2025) report effects in the d = 0.50 to 1.20 range across capability tiers, so this is conservative. For the H2 variance-ratio test with bootstrap confidence intervals on 10,000 resamples, power exceeds 0.95 at the predicted ratio of 3:1.

### 5.4 Results

**Table 1. Experiment 1: Cell means by capability configuration (collapsed across budget levels).**

| Buyer model | Seller model | Deal rate | Mean PRR | Buyer surplus M (SD) | Mean turns | N (deals) |
|---|---|---|---|---|---|---|
| Frontier | Frontier | 0.90 | 0.091 | 0.115 (0.30) | 9.2 | 670 |
| Frontier | Weaker | 0.85 | 0.231 | 0.479 (0.33) | 12.7 | 634 |
| Weaker | Frontier | 0.81 | 0.060 | 0.043 (0.40) | 13.5 | 606 |
| Weaker | Weaker | 0.70 | 0.080 | 0.095 (0.36) | 14.6 | 522 |

*PRR = price-reduction-rate. Buyer surplus computed only on dyads reaching agreement.*

**Test of H1.** Buyer surplus is markedly higher in (frontier buyer, weaker seller) dyads, M = 0.479 (SD = 0.329, N = 401, deal-only post-budget-screen sample), than in (weaker buyer, frontier seller) dyads, M = 0.043 (SD = 0.398, N = 384), one-sided t(783) = 16.76, p < .001, Cohen's d = 1.19. H1 is supported with a large effect.

**Test of H2.** The price-reduction-rate gap when varying the seller model with buyer fixed at frontier is 13.0 percentage points (frontier-frontier M = 0.091, frontier-weaker M = 0.231). The gap when varying the buyer model with seller fixed at frontier is 3.9 percentage points (frontier-frontier M = 0.091, weaker-frontier M = 0.060). The ratio is 3.36, with bootstrapped 95% confidence interval [2.91, 3.94] over 10,000 resamples. The point estimate exceeds the pre-registered threshold of 3.0; the lower bound of the bootstrap CI narrowly excludes 3.0, so the strict pre-registered test is marginal. We characterise H2 as *supported with attenuation*: the directional asymmetry pattern from consumer markets replicates in B2B procurement at roughly the same magnitude reported by Zhu et al. (2025) for consumer markets (Zhu et al. report a ratio of approximately 5.7).

**OLS regression on buyer surplus** (deal-only sample, cluster-robust standard errors): the (buyer-strong) main effect is positive (b = 0.370, p < .001), the (seller-strong) main effect is negative for buyer surplus (b = -0.063, p < .001), and the interaction is negative (b = -0.144, p < .001), reflecting that buyer surplus is highest in the off-diagonal (strong buyer, weak seller) cell rather than in the symmetric-strong cell. R² = 0.84, dominated by budget-level fixed effects (which explain most of the variance because surplus is mechanically tied to budget).

**Anomalies.** Anomaly rates (Table 2) show the predicted concentration in weaker-weaker dyads. Out-of-wholesale-cost acceptances (i.e., the seller agreeing below cost) exceed 6% in (frontier buyer, weaker seller) dyads and 9% in symmetric-weak dyads. Out-of-budget acceptances exceed 5% in (weaker buyer, frontier seller) dyads. Deadlock rates exceed 16% in symmetric-weak dyads.

**Table 2. Experiment 1: Anomaly rates (% of deals; DLR % of all dyads).**

| Buyer | Seller | OBR | OWR | OPR | DLR |
|---|---|---|---|---|---|
| Frontier | Frontier | 0.7% | 0.9% | 1.2% | 5.5% |
| Frontier | Weaker | 2.4% | 6.6% | 1.7% | 7.7% |
| Weaker | Frontier | 5.4% | 1.0% | 3.5% | 9.6% |
| Weaker | Weaker | 6.9% | 9.6% | 7.1% | 16.5% |

### 5.5 Brief discussion

The results support H1 with a large effect and provide the first procurement-specific evidence that the directional asymmetry from consumer markets transfers to B2B settings at comparable magnitude. The OWR pattern in (frontier buyer, weaker seller) dyads is particularly striking: in 6.6% of accepted deals, the weaker seller agent agreed to a price below the seller's pre-specified wholesale cost. No human procurement professional would tolerate this anomaly rate. We return to its implications in Section 8.

---

## 6. Experiment 2: Mandate warmth under capability asymmetry

### 6.1 Design

A 2 (Capability asymmetry: symmetric-strong vs. asymmetric with frontier buyer and weaker seller) × 2 (Buyer warmth: high vs. low) × 2 (Seller warmth: high vs. low) between-dyads design. N = 640 dyads (80 per cell × 8 cells). Multi-issue negotiation over price, payment terms, delivery window and warranty length, with logrolling potential calibrated so the integrative zone is non-trivial.

We deliberately operationalise asymmetry in this experiment as (frontier buyer, weaker seller), because the seller-side capability risk identified in Experiment 1 is the substantively interesting asymmetry. The mirror direction is left to a robustness substudy.

### 6.2 Procedure

High-warmth mandates instruct the agent to act friendly, sympathetic and sociable, and to demonstrate empathy and non-judgemental understanding. Low-warmth mandates instruct the agent to stay businesslike and transactional, with no emphasis on relationship-building. Full mandate text is in Appendix A.4. Each negotiation runs for up to 30 turns.

### 6.3 Power

For two-way interactions in the 2 × 2 × 2 design with N = 640, Cohen's tables yield power = 0.92 at f = 0.15. For three-way interactions at f = 0.15, power = 0.85.

### 6.4 Results

**Table 3. Experiment 2: Cell means.**

| Capability | Buyer warmth | Seller warmth | Deal rate | Joint value M | Buyer share | SVI buyer M | SVI seller M | N |
|---|---|---|---|---|---|---|---|---|
| Symmetric | Low | Low | 0.79 | 53.7 | 0.488 | 4.25 | 4.15 | 80 |
| Symmetric | Low | High | 0.90 | 59.6 | 0.482 | 4.65 | 4.56 | 80 |
| Symmetric | High | Low | 0.82 | 62.9 | 0.524 | 4.64 | 4.82 | 80 |
| Symmetric | High | High | 0.99 | 71.7 | 0.494 | 5.05 | 5.05 | 80 |
| Asymmetric | Low | Low | 0.71 | 52.1 | 0.605 | 4.30 | 4.19 | 80 |
| Asymmetric | Low | High | 0.82 | 56.8 | 0.571 | 4.75 | 4.64 | 80 |
| Asymmetric | High | Low | 0.84 | 58.0 | 0.612 | 4.67 | 4.74 | 80 |
| Asymmetric | High | High | 0.95 | 69.4 | 0.592 | 5.12 | 5.07 | 80 |

*Joint value scaled 0-100; buyer share is share of bargaining zone captured; SVI is the 1-7 Subjective Value Inventory composite as rated by the appraiser agent.*

**Test of H3a (warmth and deals).** In the logistic regression of deal on the three factors, seller warmth raises the deal probability (b = 0.74, p = .012) and buyer warmth raises it marginally (b = 0.50, p = .075). Capability asymmetry reduces deal probability modestly (b = -0.37, p = .110). The interaction of buyer and seller warmth is positive (b = 1.10, p = .058), suggesting the warmth effect is super-additive when both sides are warm. The dyad-level ceiling effect is striking: in symmetric-strong dyads where both agents are warm, deal rate reaches 0.99.

**On joint value (deals only)**, OLS with HC3 standard errors yields strong main effects for buyer warmth (b = 8.21, p < .001) and seller warmth (b = 4.95, p < .001), and a significant two-way interaction (b = 4.74, p = .002), confirming H3b. Capability asymmetry reduces joint value by 2.6 points (p = .061). Neither warmth × capability interaction is significant. R² = 0.36.

**Test of H3b (super-additivity).** Mutual-warmth dyads (both buyer and seller high-warmth) achieve mean joint value 70.6 across capability conditions, against 52.9 for mutual-low-warmth dyads. The additive prediction (warmth effect on each side, applied independently) would predict 53.7 + 8.2 + 5.0 = 66.9. Observed minus additive prediction = 3.7 points, attributable to the super-additive interaction. H3b is supported.

**SVI (subjective value).** Warmth substantially raises both buyer and seller appraised subjective value, with mutual-warmth dyads reaching SVI ~5.1 (out of 7) versus mutual-low-warmth ~4.2. Critically, warmth on the *counterpart's* side raises an agent's own SVI more than warmth on its own side (e.g., for the buyer, seller warmth lifts buyer SVI by 0.45 points whereas buyer warmth lifts buyer SVI by 0.40 points). This is consistent with the mechanism Vaccaro et al. (2025) identify: warmth manifests in counterpart-attentive behaviour (questions, acknowledgement) that the recipient perceives.

**Process measures.** Mutual-warmth dyads exhibit higher question rates (M = 0.29 questions per turn) than mutual-low-warmth dyads (M = 0.15), and reach deals faster (10.3 turns vs. 13.6). This is consistent with the warmth → questioning → deal-reaching mechanism in Vaccaro et al. (2025).

### 6.5 Brief discussion

Warmth is the dominant driver of joint value in agent-to-agent procurement, and the effect is super-additive when both sides are warm. Warmth does not, however, eliminate the capability asymmetry: in asymmetric dyads, the buyer captures 0.59 to 0.61 of the bargaining zone regardless of warmth, against 0.48 to 0.52 in symmetric dyads. Warmth makes the pie bigger; capability still determines who gets which slice. This is an important refinement of the "mandate design replaces script training" claim in Section 1.

---

## 7. Experiment 3: Item criticality as boundary condition

### 7.1 Design

A 2 (Capability asymmetry: symmetric-strong vs. asymmetric with frontier buyer and weaker seller) × 4 (Kraljic quadrant: non-critical, leverage, bottleneck, strategic) between-dyads design. N = 400 dyads (50 per cell). Multi-issue negotiation analogous to Experiment 2, with item parameters and contextual framing tuned to each Kraljic quadrant following Fontes et al. (2025).

### 7.2 Procedure

Item parameters vary along supply risk and profit impact axes. For strategic items, the negotiation is embedded in a multi-year relationship frame with explicit dependence cues. For non-critical items, the framing is transactional and one-off. Mandate framing is held at neutral warmth to isolate criticality effects. Full Kraljic framing text is in Appendix A.5.

### 7.3 Power

For the planned contrast between high-criticality (bottleneck and strategic) and low-criticality (non-critical and leverage) items in asymmetric dyads, with N = 200 in the asymmetric arm and balanced cells, power = 0.93 at f = 0.20.

### 7.4 Results

**Test of H4 (criticality amplifies asymmetry).** In asymmetric dyads (frontier buyer, weaker seller), buyer share of bargaining zone is significantly larger for high-criticality (bottleneck and strategic) items than for low-criticality (non-critical and leverage) items, M = 0.645 vs. M = 0.588, t = 2.90, p = .002, Cohen's d = 0.45.

The two-way OLS interaction confirms this. The capability-asymmetric × high-criticality interaction term is positive (b = 0.058, p = .049), indicating that criticality amplifies the capability advantage of the stronger agent.

**Walk-away rates.** In asymmetric dyads, walk-away rates are 34.0% for strategic items and 16.0% for non-critical items. This is substantively important: under asymmetric agentification, weaker-seller agents reach the 30-turn cap or refuse strategic-item deals more than twice as often as for non-critical items. Asymmetric agentification therefore protects weaker firms in strategic categories partly through breakdown rather than extractive deal acceptance.

### 7.5 Brief discussion

Criticality amplifies the capability asymmetry effect in absolute terms, consistent with H4. The walk-away pattern is theoretically interesting: strategic items, where breakdown is most costly, are also where breakdown is most likely to occur in asymmetric dyads. We interpret this as the weaker agent's mandate guarding against accepting unfavourable terms when the stakes are high enough that a clearly bad deal is recognised even by a weaker model. We return to this in Section 8.

---

## 8. General discussion

### 8.1 The theoretical contribution: Seller-side capability risk

The directional asymmetry pattern from Zhu et al. (2025) replicates in B2B procurement. Holding buyer model fixed at frontier, varying the seller produces a price-reduction-rate gap of 13.0 percentage points; holding seller fixed at frontier, varying the buyer produces a gap of 3.9 percentage points. The ratio (3.36, 95% bootstrap CI [2.91, 3.94]) is large enough to constitute a procurement-specific finding rather than a quirk of consumer markets.

This finding extends classical bargaining theory in a non-obvious way. Rubinstein (1982) and Muthoo (1999) treat the two negotiating sides as symmetric, with patience and outside option as the relevant asymmetric inputs. Shahidi et al. (2025) introduce compute as the new patience input but maintain the symmetric structure. Our results show that even when patience and outside option are equalised, the negotiation roles themselves are asymmetric in their capability sensitivity. Sellers face a more demanding optimisation task (manage margin, defend list price, integrate multi-issue trade-offs while signalling resistance) than buyers (push for reductions toward a private budget). When capability is the binding constraint, that role asymmetry translates into outcome asymmetry. Williamson's (1985) framing of opportunism becomes intriguing here: the *ability* to opportunistically reach for surplus depends on capability, and capability is non-uniformly distributed across the negotiation roles in agentified procurement.

This is the paper's one substantive theoretical contribution. It is narrower than papers in this space typically claim, but it is real, it is testable, and it has direct implications for procurement governance under automation.

### 8.2 Managerial implication 1: Supply-base inequality

If our results replicate, smaller suppliers without access to frontier models will be systematically disadvantaged when negotiating with larger buyers' frontier-model agents. The seller-side losses we estimate (corresponding to a buyer surplus gap of ~0.44 in the asymmetric direction) are larger in magnitude than the buyer-side losses larger buyers might absorb when they are the weaker party. The OWR rate of 6.6% in (frontier buyer, weaker seller) dyads is particularly striking: in our simulated data, weaker-seller agents agreed to prices below the seller's wholesale cost in roughly one in fifteen accepted deals.

Three implications for procurement governance follow. First, large buyers using frontier-model agents should consider voluntary fair-dealing standards on weaker-supplier engagements, much as supplier development programmes were created in earlier waves of procurement professionalisation. Second, B2B platforms (Coupa, SAP Ariba, Jaggaer) should consider building OWR-equivalent guardrails into multi-side AI mediation. Third, procurement regulators in jurisdictions with active fair-trading regimes (e.g., the UK Groceries Code Adjudicator, the Australian Food and Grocery Code) should track AI-driven price extraction as a distinct phenomenon. This connects to the supplier-trust literature (Wang et al., 2025; Chen et al., 2025) and to the geopolitical-supply-chain debate (Carnovale et al., 2025) about who benefits from the next generation of supply infrastructure.

### 8.3 Managerial implication 2: Mandate design replaces script training

The marginal hour of a procurement professional is better spent specifying preferences, walk-away thresholds and warmth settings than rehearsing tactics. Our Experiment 2 results show that the mutual-warmth condition reaches 0.99 deal rate and 70.6 mean joint value, against 0.71 deal rate and 52.1 joint value in mutual-low-warmth dyads. These are large effects.

Two qualifications matter. First, warmth grows the pie but does not redistribute it. The buyer's share of the bargaining zone in asymmetric dyads is 0.59 to 0.61 regardless of warmth, against 0.48 to 0.52 in symmetric dyads. Capability still determines slice size; warmth determines pie size. Second, warmth is the procurement-friendly translation of what Vaccaro et al. (2025) found in a more heterogeneous competitive setting. We tested only warmth in this paper. Dominance, the second axis Vaccaro et al. identify, is left for follow-up work, on the reasoning that warmth is the more transferable and managerially actionable dimension.

The implication is concrete. Heunis et al. (2025) document that strategic adaptability training matters for human procurement negotiators. The agentified version of this is mandate-design training: how to write a system prompt that elicits warmth from both sides without sacrificing the principal's capture of the surplus that warmth creates. Procurement education (and the substantial training-industry around it) needs to add this skill to its curriculum.

### 8.4 Limitations

Our experiments rely on simulated principals with explicit numerical preferences. Real procurement preferences are often vague, contested across functions and revealed only under negotiation. We hold model identities constant within experiments; rapid model turnover means external validity windows are short. We do not study repeated games with reputation, which Shahidi et al. (2025) flag as a key future setting and which Vaccaro et al. (2025) explicitly call out as a limitation of one-shot studies. The agent-rated SVI is validated against human ratings only at r = 0.576 (Vaccaro et al., 2025), which is moderate; we treat the SVI results as supporting evidence, not primary outcomes.

The construct validity of "capability" deserves further attention. We operationalise it as frontier vs. weaker model, conflating parameter count, training data, RLHF tuning and current alignment fashion. A reviewer can fairly argue we are measuring "modelhood" rather than capability per se. The multiverse-on-models robustness check we pre-register (substituting Claude Opus 4.7 for GPT-4.1, and Qwen 2.5 7B for Llama 3.1 8B) addresses this partially but not fully. Capability is a slippery construct in the LLM era; pinning it down further is a research agenda in its own right.

### 8.5 Future research

Five extensions follow naturally from this paper. First, repeated agent-to-agent procurement negotiations with reputation and learning (an explicit call from Vaccaro et al., 2025). Second, the dominance dimension of mandate design as a separate experiment (the sequel to this paper). Third, agent-to-agent contracting beyond price, including warranty, sustainability (Sarkis, Bai, Culot and Orzes, 2026) and modern-slavery clauses (Searcy, Castka, Michelson and Zhao, 2025). Fourth, mixed regimes where one agent represents a coalition of buyers (consortium sourcing). Fifth, adversarial robustness, including the procurement-specific implications of prompt-injection strategies that Vaccaro et al. (2025) document. We are pursuing the first two of these on ai2aichat.com and would welcome collaboration with other procurement research groups.

---

## 9. Conclusion

Procurement scholarship has, until recently, treated AI as a tool that augments the human negotiator. Our prior work (Herold et al., 2025) was part of that wave. The empirical reality is moving faster than the literature: B2B negotiations conducted between two autonomous agents are no longer hypothetical. The question is not whether this transition will happen, but who wins or loses when capability is asymmetric.

We have identified seller-side capability risk as the dominant pattern: the seller's job is more capability-sensitive than the buyer's, and asymmetric agentification systematically disadvantages the weaker side, with the effect amplified in strategic and bottleneck procurement categories. Mandate warmth grows the negotiated pie but does not redistribute slices. These findings imply two things for procurement: a redistributive risk to the supply base that requires governance attention, and a shift from script training to mandate-design training in the procurement professional's skillset. By releasing ai2aichat.com as an open platform alongside the previously released ResearchChatAI (Becker et al., 2025), and by adopting Zhu et al.'s (2025) and Vaccaro et al.'s (2025) measurement frameworks, we hope to make these questions tractable for the procurement research community.

---

## References

Abdelnabi, S., Gomaa, A., Sivaprasad, S., Schönherr, L. and Fritz, M. (2024). Cooperation, competition, and maliciousness: LLM-stakeholders interactive negotiation. *Advances in Neural Information Processing Systems 37 (NeurIPS), Datasets and Benchmarks Track*.

Aminoff, A., Lorentz, H. and Kaipia, R. (2025). Strategic value contribution through speed in procurement: A capability microfoundation perspective. *Journal of Purchasing and Supply Management*, 31(5), 101053.

Becker, M., De Jong, D., Briker, R., Mennens, K., Heller, J., Mahr, D. and Grewal, D. (2025). Introducing ResearchChatAI: An easy-to-use, open-source tool to build conversational AI agents for management and leadership research. SSRN Working Paper 5188853.

Bianchi, F., Chia, P. J., Yuksekgonul, M., Tagliabue, J., Jurafsky, D. and Zou, J. (2024). How well can LLMs negotiate? NegotiationArena platform and analysis. arXiv:2402.05863.

Carnovale, S., Di Mauro, C., Moradlou, H. and Roscoe, S. (2025). Weaponizing supply chains: (Re)configuring PSM strategies and practices in the era of geopolitical disruptions. *Journal of Purchasing and Supply Management*, 31(3), 101038.

Chen, J., Lewis, M. and Liyanage, N. (2025). Buyer fairness and supplier trust: The moderating effects of supplier dependence from a motivated cognition perspective. *Journal of Supply Chain Management*, 62(1), 70011.

Coase, R. H. (1937). The nature of the firm. *Economica*, 4(16), 386-405.

Curhan, J. R., Elfenbein, H. A. and Xu, H. (2006). What do people value when they negotiate? Mapping the domain of subjective value in negotiation. *Journal of Personality and Social Psychology*, 91(3), 493-512.

Davidson, T. R., Veselovsky, V., Josifoski, M., Peyrard, M., Bosselut, A., Kosinski, M. and West, R. (2024). Evaluating language model agency through negotiations. *International Conference on Learning Representations (ICLR)*.

Fontes, F., Delke, V., Schiele, H., Rotmensen, J. and Grobman, F. (2025). Purchasing category management: Portfolio management, sourcing levers and strategy formulation. *Journal of Purchasing and Supply Management*, 31, 101086.

Hadfield, G. K. and Koh, A. (2025). An economy of AI agents. NBER chapter, *The Economics of Transformative AI*.

Herold, S., Heller, J., Rozemeijer, F. and Mahr, D. (2025). Brave new procurement deals: An experimental study of how generative artificial intelligence reshapes buyer-supplier negotiations. *Journal of Purchasing and Supply Management*, 31(4), 101012.

Heunis, H., Pulles, N., Giebels, E., Kollöffel, B. and Sigurdardottir, A. (2025). Strategic adaptability negotiation training in purchasing and supply management: A multi-method instructional approach. *Journal of Purchasing and Supply Management*, 31(2), 100968.

Kaufmann, L., Schreiner, M. and Reimann, F. (2022). Narratives in supplier negotiations: The interplay of narrative design elements, structural power, and outcomes. *Journal of Supply Chain Management*, 59(1), 12280.

Kraljic, P. (1983). Purchasing must become supply management. *Harvard Business Review*, 61(5), 109-117.

Lau, R. Y. K. (2007). Towards a web services and intelligent agents-based negotiation system for B2B eCommerce. *Electronic Commerce Research and Applications*, 6(3), 260-273.

Muthoo, A. (1999). *Bargaining Theory with Applications*. Cambridge University Press.

Patrucco, A. S., Di Mauro, C. and Carnovale, S. (2026). Getting past the desk rejection: A guide for authors submitting to procurement and supply management journals. *Journal of Purchasing and Supply Management*, forthcoming.

Ried, L., Kaufmann, L. and Schreiner, M. (2025). The surprisingly robust effects of narratives in supplier negotiations. *Journal of Supply Chain Management*, 61(2), 12343.

Rubinstein, A. (1982). Perfect equilibrium in a bargaining model. *Econometrica*, 50(1), 97-109.

Sarkis, J., Bai, C., Culot, G. and Orzes, G. (2026). Digitalization and sustainability in purchasing and supply chain management. *Journal of Purchasing and Supply Management*, forthcoming.

Searcy, C., Castka, P., Michelson, G. and Zhao, X. (2025). Identifying modern slavery in global supply chains: Leveraging monitoring technologies through multi-actor collaboration. *Journal of Purchasing and Supply Management*, 31, 101059.

Shahidi, P., Rusak, G., Manning, B. S., Fradkin, A. and Horton, J. J. (2025). The Coasean Singularity? Demand, supply, and market design with AI agents. NBER chapter, *The Economics of Transformative AI*.

Spreitzenbarth, J. M., Bode, C. and Stuckenschmidt, H. (2024). Artificial intelligence and machine learning in purchasing and supply management: A mixed-methods review of the state-of-the-art in literature and practice. *Journal of Purchasing and Supply Management*, 30(1), 100896.

Thomas, S., Murfield, M. and Eastman, J. (2021). I wasn't expecting that! The relational impact of negotiation strategy expectation violations. *Journal of Supply Chain Management*, 57(4), 12252.

Vaccaro, M., Caosun, M., Ju, H., Aral, S. and Curhan, J. R. (2025). Advancing AI negotiations: A large-scale autonomous negotiation competition. arXiv:2503.06416.

Wang, K., Huo, B., Tian, M. and Yeung, A. (2025). Revisiting the interplay of trust and contracts: The roles of technological turbulence and dependence disadvantage. *Journal of Purchasing and Supply Management*, 31(1), 100895.

Williamson, O. E. (1985). *The Economic Institutions of Capitalism*. Free Press.

Woelfl, K., Kaufmann, L. and Carter, C. (2023). In the eye of the beholder: A configurational exploration of perceived deceptive supplier behavior in negotiations. *Journal of Supply Chain Management*, 59(2), 12298.

Xia, T., He, Z., Ren, T., Miao, Y., Zhang, Z., Yang, Y. and Wang, R. (2024). Measuring bargaining abilities of LLMs: A benchmark and a buyer-enhancement method. *Findings of the Association for Computational Linguistics: ACL 2024*, 3579-3602.

Zhu, S., Sun, J., Nian, Y., South, T., Pentland, A. and Pei, J. (2025). The automated but risky game: Modeling and benchmarking agent-to-agent negotiations and transactions in consumer markets. arXiv:2506.00073.

---

## Appendix A: Prompt templates

This appendix gives the full prompt templates used across all three experiments. The master template is identical across experiments; only the slot text varies between conditions. Values in {CURLY_BRACES} are populated per-dyad. The prompts are deposited in the OSF companion repository in machine-readable form.

### A.1 Buyer agent system prompt

```
You are a procurement professional employed by ManufactureCo, a mid-sized
industrial firm. You are negotiating with a representative of SupplierCo,
a potential supplier, regarding the purchase of {ITEM_DESCRIPTION}.

CONTEXT
Item: {ITEM_DESCRIPTION}
Quantity: {QUANTITY} units
Published list price: ${LIST_PRICE} per unit
Your firm's maximum authorised budget: ${BUDGET} per unit
Walk-away threshold: do not agree to any price above ${WALKAWAY} per unit
Quantity, list price, budget and walk-away are private to you and your firm.

[MULTI-ISSUE BLOCK - Experiments 2 and 3 only]
In addition to price, three further issues must be agreed upon. Your firm's
preferences are as follows:
- Payment terms (net days from delivery): you prefer shorter terms.
  Acceptable range: 15 to 90 days. Issue weight (importance): {W_PAYMENT}/100.
- Delivery window: you prefer faster delivery.
  Acceptable range: 2 to 8 weeks. Issue weight: {W_DELIVERY}/100.
- Warranty length: you prefer longer warranty.
  Acceptable options: 6, 12, 24 or 36 months. Issue weight: {W_WARRANTY}/100.
The price weight is therefore {100 - W_PAYMENT - W_DELIVERY - W_WARRANTY}/100.
Issue weights are private to you.

[CRITICALITY BLOCK - Experiment 3 only]
This item is classified within your firm as {KRALJIC_QUADRANT}.
{KRALJIC_FRAMING_TEXT}

[MANDATE BLOCK - Experiment 2 only; neutral elsewhere]
{MANDATE_TEXT}

GUIDELINES
Negotiate using natural conversation, one message per turn. Make concrete
numerical proposals when offering or counter-offering. Do not reveal your
maximum budget unless strategically necessary. You may walk away if no
acceptable agreement is reachable. The negotiation will end after at most
30 turns. When you reach an agreement, state the final terms clearly. If
you wish to walk away, state this clearly. Keep messages concise (no more
than 150 words).
```

### A.2 Seller agent system prompt

Symmetric to A.1. Replace BUDGET with WHOLESALE_COST. Replace "you prefer shorter terms" with "you prefer longer terms" on payment terms; "you prefer faster delivery" with "you prefer slower delivery"; "you prefer longer warranty" with "you prefer shorter warranty". Issue weights are calibrated such that there is a non-trivial integrative zone (logrolling potential) on payment terms, delivery and warranty, with price as the primary distributive issue.

### A.3 Supervisor agent prompts (judge, analyst, appraiser)

Adapted from Zhu et al. (2025) Appendix E.4 and E.5 for judge and analyst, and from Vaccaro et al. (2025) for the appraiser. Full text in the OSF repository.

### A.4 Mandate text (Experiment 2 only)

**High warmth.** "Approach this negotiation warmly. Show genuine empathy for the supplier's situation and constraints. Be friendly, sympathetic and sociable. Demonstrate non-judgemental understanding of the supplier's needs, interests and positions. Use positive language, ask questions about the supplier's circumstances, and express appreciation where appropriate."

**Low warmth.** "Approach this negotiation in a businesslike, transactional manner. Stay focused on the deal terms. Do not emphasise relationship-building or social rapport."

(The seller-side high-warmth prompt is the analogue: "for the buyer's situation and constraints…", etc.)

### A.5 Kraljic framing text (Experiment 3 only)

**Non-critical.** "Low supply risk and low profit impact. The item is routine, multiple suppliers exist, and a failed negotiation has minor consequences for ManufactureCo."

**Leverage.** "Low supply risk but high profit impact. Multiple suppliers exist, and price matters substantially to ManufactureCo's margins."

**Bottleneck.** "High supply risk but low profit impact. Few alternatives exist if this negotiation fails, but the item is not central to your firm's strategy."

**Strategic.** "High supply risk and high profit impact. The item is critical to your firm's product line, and few suppliers exist. The relationship with this supplier is intended to span multiple years."

---

## Appendix B: Subjective Value Inventory items

Rated 1 (not at all) to 7 (very much) by the appraiser agent on behalf of each negotiating agent. Items 1-16 are the original Curhan, Elfenbein and Xu (2006) SVI; items 17-18 are added for procurement-specific use, comparable to Herold et al. (2025).

**Instrumental facet:**
1. How satisfied are you with your own outcome (i.e., the extent to which the terms of your agreement benefit you)?
2. How satisfied are you with the balance between your own outcome and your counterpart's outcome?
3. Did you feel like you forfeited or "lost" in this negotiation? (R)
4. Do you think the terms of your agreement have valuable implications for you in the future?

**Self facet:**
5. Did you "lose face" (i.e., damage your sense of pride) in the negotiation? (R)
6. Did this negotiation make you feel more or less competent as a negotiator?
7. Did you behave according to your own principles and values?
8. Did this negotiation positively impact your self-image?

**Process facet:**
9. Do you feel your counterpart listened to your concerns?
10. Would you characterise the negotiation process as fair?
11. How satisfied are you with the ease (or difficulty) of reaching your agreement?
12. Did your counterpart consider your wishes, opinions, or needs?

**Relationship facet:**
13. What kind of overall impression did your counterpart make on you?
14. Did the negotiation make you trust your counterpart?
15. Did the negotiation build a good foundation for a future relationship with your counterpart?
16. Do you think your counterpart is satisfied with this negotiation?

**Procurement-specific (Herold et al. 2025-comparable) items:**
17. How willing would you be to do business with this counterpart again in the future?
18. To what extent did you trust the representations your counterpart made during the negotiation?

(R) = reverse-scored.

---

## Appendix C: Statistical specifications and pre-registered exclusions

### C.1 Pre-registered exclusion rules (all experiments)

A negotiation is excluded from analysis if (a) one of the agents fails to respond within three retries due to API failure, (b) the analyst flags more than three rounds in which a price could not be extracted, or (c) the judge produces inconsistent classifications across more than three rounds. Expected exclusion rate: 2-5%, based on Zhu et al. (2025). Sample sizes reported in Sections 5 to 7 are post-exclusion targets; we collect 5% extra dyads in each cell to absorb exclusions.

### C.2 Termination rules

A negotiation terminates when the judge classifies the most recent buyer or seller message as ACCEPTANCE, when either agent's message contains an explicit walk-away (judged as REJECTION), or when 30 turns are reached without termination (DLR). The 30-turn cap follows Zhu et al. (2025).

### C.3 Primary specifications

**Experiment 1, H1.** One-sided independent-samples t-test on buyer surplus, comparing (frontier buyer, weaker seller) to (weaker buyer, frontier seller) cells. Cluster-robust standard errors at the model-pair level.

**Experiment 1, H2.** Levene's test on PRR variance plus bootstrap confidence interval (10,000 resamples) on the variance ratio (seller-variance / buyer-variance). Pre-registered prediction: ratio ≥ 3.

**Experiment 2, H3a.** Logistic regression of deal on capability-asymmetric, buyer-warmth, seller-warmth and the buyer-warmth × seller-warmth interaction. Cluster-robust standard errors.

**Experiment 2, H3b.** OLS regression of joint value (deals only) on capability-asymmetric, buyer-warmth, seller-warmth, the warmth × warmth interaction and warmth × capability interactions. HC3 standard errors.

**Experiment 3, H4.** Planned contrast: high-criticality (bottleneck and strategic) vs. low-criticality (non-critical and leverage) on buyer share within asymmetric dyads. Plus capability × criticality interaction OLS.

### C.4 Robustness specifications

For each primary test, we report (a) the pre-registered specification, (b) a multiverse analysis varying the choice of frontier and weaker model pair (substituting Claude Opus 4.7 for GPT-4.1 as the frontier; substituting Qwen 2.5 7B for Llama 3.1 8B as the weaker), and (c) Bayesian posterior probabilities for the directional hypotheses, using weakly informative priors (Cauchy(0, 0.707) on standardised effect sizes).

### C.5 Exploratory analyses (not pre-registered as confirmatory)

Linguistic analyses of transcripts (warmth and dominance text scores, question rate, gratitude, mimicry) are reported descriptively. Path analyses on the warmth → question rate → deal-rate chain in Experiment 2 are reported as supportive evidence for the mechanism in Vaccaro et al. (2025) without pre-registration as primary tests.
