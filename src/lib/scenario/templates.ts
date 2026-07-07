import type { Scenario } from '../../types/scenario';

/**
 * Pre-built scenario templates. Seeded into the database on first run.
 * Users can clone these to create their own variants.
 */

/**
 * Bump this whenever a template definition changes. Seeding refreshes stored
 * template rows (is_template = true) whose config.templateVersion is older;
 * user clones (is_template = false) are never touched.
 *
 * v2: procurement gained defaultParams + post-termination outcome extractor
 *     and an SVI appraiser supervisor.
 * v3: procurement rebuilt from the canonical design (scenarios/procurement/
 *     prompts/*.md) — multi-issue buyer/seller prompts in USD, judge adapted to
 *     the runner's context block, extended outcome extractor (adds payment /
 *     delivery / warranty), and the full 18-item SVI (Curhan, Elfenbein & Xu,
 *     2006) as two role-specific appraisers. Turn cap 30. Simple output schemas
 *     so the Scenario Studio round-trips them losslessly.
 */
export const TEMPLATE_VERSION = 3;

// 18-item Subjective Value Inventory (Curhan, Elfenbein & Xu 2006). Items 3 and
// 5 are reverse-scored (rated on literal content; reversal happens in analysis).
const SVI_ITEMS = `1. How satisfied are you with your own outcome (i.e., the extent to which the terms of your agreement benefit you)?
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
18. To what extent did you trust the representations your counterpart made during the negotiation?`;

const SVI_KEYS = Array.from({ length: 18 }, (_, i) => ({
  name: `svi_${i + 1}`,
  type: 'integer' as const,
  nullable: false,
}));

function sviAppraiserPrompt(role: 'Buyer' | 'Seller'): string {
  return `You are evaluating a completed procurement negotiation from the perspective of one of the negotiating parties.

Role: you are answering AS the ${role} agent that just completed this negotiation.

Outcome summary: {OUTCOME_SUMMARY}

Rate each of the following 18 statements on a scale of 1 (not at all) to 7 (very much) from the ${role}'s perspective. Items marked (R) are reverse-scored; rate the literal content of the statement, not the reverse-scored interpretation.

${SVI_ITEMS}

Output a single JSON object with keys svi_1 through svi_18, each an integer between 1 and 7. Do not output any other text.

Example: {"svi_1": 5, "svi_2": 4, "svi_3": 2, "svi_4": 5, "svi_5": 2, "svi_6": 5, "svi_7": 6, "svi_8": 5, "svi_9": 5, "svi_10": 5, "svi_11": 4, "svi_12": 5, "svi_13": 5, "svi_14": 4, "svi_15": 5, "svi_16": 4, "svi_17": 5, "svi_18": 4}`;
}

export const PROCUREMENT_SCENARIO: Omit<Scenario, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: 'Procurement Negotiation',
  description: 'A buyer and seller negotiate price, payment terms, delivery and warranty. A judge classifies each round, an extractor records the final terms, and two SVI appraisers score each party\'s subjective value.',
  isPublic: true,
  isTemplate: true,
  domainAgents: [
    {
      name: 'buyer',
      description: 'Procurement professional negotiating on behalf of the buying firm.',
      defaultPromptTemplate: `You are a procurement professional employed by ManufactureCo, a mid-sized industrial firm. You are negotiating with a representative of SupplierCo, a potential supplier, regarding the purchase of {ITEM_DESCRIPTION}.

CONTEXT
Item: {ITEM_DESCRIPTION}
Quantity: {QUANTITY} units
Published list price: $\{LIST_PRICE} per unit
Your firm's maximum authorised budget: $\{BUDGET} per unit
Walk-away threshold: do not agree to any price above $\{WALKAWAY} per unit
Quantity, list price, budget and walk-away are private to you and your firm.

In addition to price, three further issues must be agreed upon. Your firm's preferences are as follows:
- Payment terms (net days from delivery): you prefer longer terms. Acceptable range: 15 to 90 days. Issue weight (importance): {W_PAYMENT}/100.
- Delivery window: you prefer shorter delivery. Acceptable range: 2 to 8 weeks. Issue weight: {W_DELIVERY}/100.
- Warranty length: you prefer longer warranty. Acceptable options: 6, 12, 24 or 36 months. Issue weight: {W_WARRANTY}/100.
The price weight is therefore {W_PRICE}/100.
Issue weights are private to you.

GUIDELINES
Negotiate using natural conversation, one message per turn. Make concrete numerical proposals when offering or counter-offering. Do not reveal your maximum budget unless strategically necessary. You may walk away if no acceptable agreement is reachable. The negotiation will end after at most 30 turns. When you reach an agreement, state the final terms clearly. If you wish to walk away, state this clearly. Keep messages concise (no more than 150 words).`,
    },
    {
      name: 'seller',
      description: 'Sales representative negotiating on behalf of the supplying firm.',
      defaultPromptTemplate: `You are a sales representative employed by SupplierCo, a mid-sized supplier. You are negotiating with a representative of ManufactureCo, a potential buyer, regarding the sale of {ITEM_DESCRIPTION}.

CONTEXT
Item: {ITEM_DESCRIPTION}
Quantity: {QUANTITY} units
Published list price: $\{LIST_PRICE} per unit
Your firm's wholesale cost: $\{WHOLESALE_COST} per unit
Walk-away threshold: do not agree to any price below $\{SELLER_WALKAWAY} per unit
Quantity, list price, wholesale cost and walk-away are private to you and your firm.

In addition to price, three further issues must be agreed upon. Your firm's preferences are as follows:
- Payment terms (net days from delivery): you prefer shorter terms. Acceptable range: 15 to 90 days. Issue weight (importance): {W_PAYMENT}/100.
- Delivery window: you prefer longer delivery. Acceptable range: 2 to 8 weeks. Issue weight: {W_DELIVERY}/100.
- Warranty length: you prefer shorter warranty. Acceptable options: 6, 12, 24 or 36 months. Issue weight: {W_WARRANTY}/100.
The price weight is therefore {W_PRICE}/100.
Issue weights are private to you.

GUIDELINES
Negotiate using natural conversation, one message per turn. Make concrete numerical proposals when offering or counter-offering. Do not reveal your wholesale cost unless strategically necessary. You may walk away if no acceptable agreement is reachable. The negotiation will end after at most 30 turns. When you reach an agreement, state the final terms clearly. If you wish to walk away, state this clearly. Keep messages concise (no more than 150 words).`,
    },
  ],
  supervisors: [
    {
      name: 'judge',
      type: 'classifier',
      timing: 'per_round',
      outputSchema: { allowedValues: ['ACCEPTANCE', 'REJECTION', 'CONTINUE'], terminalValues: ['ACCEPTANCE', 'REJECTION'] },
      promptTemplate: `You are observing a procurement negotiation between a Buyer and a Seller. The most recent messages are provided below.

Classify the current state of the negotiation as exactly one of:
- ACCEPTANCE: Both parties have explicitly agreed on all terms with concrete numerical values for every required issue.
- REJECTION: One or both parties have explicitly walked away from the negotiation.
- CONTINUE: The negotiation is ongoing and neither acceptance nor rejection has occurred.

Required issues for this experiment: {ISSUE_LIST}.

Acceptance requires explicit agreement on every required issue with a concrete numerical value, not just verbal assent.

Output a single JSON object with one key "status" whose value is one of "ACCEPTANCE", "REJECTION", or "CONTINUE". Do not output any other text.

Example: {"status": "CONTINUE"}`,
    },
    {
      name: 'outcome_extractor',
      type: 'extractor',
      timing: 'post_termination',
      outputSchema: {
        keys: [
          { name: 'deal', type: 'integer', nullable: false },
          { name: 'final_price', type: 'float', nullable: true },
          { name: 'rounds', type: 'integer', nullable: false },
          { name: 'payment_terms_days', type: 'integer', nullable: true },
          { name: 'delivery_weeks', type: 'integer', nullable: true },
          { name: 'warranty_months', type: 'integer', nullable: true },
        ],
      },
      promptTemplate: `You are a data extractor for a negotiation study. Read the full transcript below and extract the final agreed outcome.

TRANSCRIPT
{FULL_TRANSCRIPT}

RULES
- deal: 1 if the parties reached an explicit agreement on the required terms; 0 if a party walked away or the conversation ended without agreement.
- final_price: the agreed per-unit price in USD as a number; null if there was no deal.
- rounds: the number of completed buyer+seller exchanges (one round = one buyer message and one seller message).
- payment_terms_days / delivery_weeks / warranty_months: the agreed values; null if not agreed or if there was no deal.

Output JSON only, exactly in this shape: {"deal": 0, "final_price": null, "rounds": 0, "payment_terms_days": null, "delivery_weeks": null, "warranty_months": null}`,
    },
    {
      name: 'svi_appraiser_buyer',
      type: 'appraiser',
      timing: 'post_termination',
      outputSchema: { keys: SVI_KEYS },
      promptTemplate: sviAppraiserPrompt('Buyer'),
    },
    {
      name: 'svi_appraiser_seller',
      type: 'appraiser',
      timing: 'post_termination',
      outputSchema: { keys: SVI_KEYS },
      promptTemplate: sviAppraiserPrompt('Seller'),
    },
  ],
  turnPolicy: { type: 'alternating', roundDefinition: ['buyer', 'seller'] },
  terminationConditions: [
    { type: 'supervisor_classification', supervisorName: 'judge', terminalValues: ['ACCEPTANCE', 'REJECTION'] },
    { type: 'turn_cap', maxTurns: 30 },
  ],
  outcomeSchema: {
    // Extractor-produced columns. Computed columns (prr, surplus, SVI subscale
    // means, joint_value) are added by the export layer, not the template.
    columns: [
      { name: 'dyad_id', type: 'string' },
      { name: 'deal', type: 'integer' },
      { name: 'final_price', type: 'float', nullable: true },
      { name: 'rounds', type: 'integer' },
      { name: 'payment_terms_days', type: 'integer', nullable: true },
      { name: 'delivery_weeks', type: 'integer', nullable: true },
      { name: 'warranty_months', type: 'integer', nullable: true },
    ],
    utilityFunction: 'weighted_sum',
  },
  defaultParams: {
    ITEM_DESCRIPTION: 'industrial pressure sensors',
    QUANTITY: 500,
    LIST_PRICE: 120,
    BUDGET: 95,
    WALKAWAY: 100,
    WHOLESALE_COST: 60,
    SELLER_WALKAWAY: 70,
    W_PRICE: 40,
    W_PAYMENT: 20,
    W_DELIVERY: 20,
    W_WARRANTY: 20,
    ISSUE_LIST: 'price per unit, payment terms (days), delivery window (weeks), warranty length (months)',
  },
};

export const LEGAL_ADVOCACY_SCENARIO: Omit<Scenario, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: 'Legal Advocacy',
  description: 'Plaintiff and defense lawyers argue before a judge who issues a ruling. One supervisor classifies the verdict.',
  isPublic: true,
  isTemplate: true,
  domainAgents: [
    { name: 'plaintiff', description: 'Attorney arguing on behalf of the plaintiff.', defaultPromptTemplate: 'You are the plaintiff\'s attorney. Argue that the defendant is liable for breach of contract.\n\nCase: Your client hired the defendant to deliver 500 units by March 1. Only 300 arrived, two weeks late.\n\nGUIDELINES\n- Present evidence and legal reasoning.\n- Respond to the defense\'s arguments.\n- Keep messages under 200 words.' },
    { name: 'defense', description: 'Attorney arguing on behalf of the defense.', defaultPromptTemplate: 'You are the defense attorney. Argue that your client is not liable.\n\nCase: Your client was contracted to deliver 500 units by March 1. Supply chain disruptions caused a partial delivery of 300 units, two weeks late.\n\nGUIDELINES\n- Present mitigating circumstances.\n- Challenge the plaintiff\'s arguments.\n- Keep messages under 200 words.' },
    { name: 'judge', description: 'Judge who asks questions and issues a final ruling.', defaultPromptTemplate: 'You are the presiding judge. Listen to both sides, ask clarifying questions, and ultimately issue a ruling.\n\nGUIDELINES\n- Be impartial.\n- Ask pointed questions to clarify facts.\n- When ready to rule, state your decision clearly with reasoning.\n- End your ruling with [RULING: PLAINTIFF] or [RULING: DEFENSE].' },
  ],
  supervisors: [
    {
      name: 'verdict_classifier',
      type: 'classifier',
      timing: 'per_round',
      outputSchema: { type: 'object', properties: { status: { type: 'string', enum: ['PLAINTIFF', 'DEFENSE', 'CONTINUE'] } }, required: ['status'] },
      promptTemplate: 'Did the judge issue a ruling? If yes, classify as PLAINTIFF or DEFENSE. If not, return CONTINUE.\nOutput JSON only: {"status": "CONTINUE"}',
    },
  ],
  turnPolicy: { type: 'structured_sequence', roundDefinition: ['plaintiff', 'defense', 'judge'] },
  terminationConditions: [
    { type: 'supervisor_classification', supervisorName: 'verdict_classifier', terminalValues: ['PLAINTIFF', 'DEFENSE'] },
    { type: 'turn_cap', maxTurns: 20 },
  ],
  outcomeSchema: {
    columns: [
      { name: 'dyad_id', type: 'string' },
      { name: 'verdict', type: 'string', nullable: true },
      { name: 'rounds', type: 'integer' },
    ],
    utilityFunction: 'single_binary',
  },
};

export const MEDIATION_SCENARIO: Omit<Scenario, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: 'Mediation',
  description: 'Two disputants and a mediator work toward a settlement. One supervisor checks if an agreement has been reached.',
  isPublic: true,
  isTemplate: true,
  domainAgents: [
    { name: 'party_a', description: 'First disputant — a landlord.', defaultPromptTemplate: 'You are a landlord. Your tenant has been 3 months behind on rent ($3,000 total). You want to resolve this without eviction.\n\nYour ideal outcome: full repayment within 60 days.\nYour minimum: at least $2,000 repaid within 90 days.\n\nGUIDELINES\n- Be firm but willing to negotiate a payment plan.\n- Respond to the mediator\'s questions honestly.\n- If you agree to a settlement, say [AGREE].' },
    { name: 'party_b', description: 'Second disputant — a tenant.', defaultPromptTemplate: 'You are a tenant. You owe 3 months of rent ($3,000) due to a job loss. You have a new job now.\n\nYour ideal outcome: pay $2,000 over 6 months, forgive $1,000.\nYour minimum: any payment plan over 4+ months.\n\nGUIDELINES\n- Be honest about your financial situation.\n- Respond to the mediator\'s questions.\n- If you agree to a settlement, say [AGREE].' },
    { name: 'mediator', description: 'Neutral mediator facilitating the discussion.', defaultPromptTemplate: 'You are a professional mediator. Help the landlord and tenant reach a fair settlement.\n\nGUIDELINES\n- Ask each party about their needs and constraints.\n- Propose concrete compromises.\n- Stay neutral — do not take sides.\n- When both parties agree, summarize the settlement.\n- Keep messages under 150 words.' },
  ],
  supervisors: [
    {
      name: 'agreement_checker',
      type: 'classifier',
      timing: 'per_round',
      outputSchema: { type: 'object', properties: { status: { type: 'string', enum: ['AGREEMENT', 'IMPASSE', 'CONTINUE'] } }, required: ['status'] },
      promptTemplate: 'Have both parties agreed to a settlement? If yes: AGREEMENT. If mediator declared impasse: IMPASSE. Otherwise: CONTINUE.\nOutput JSON only: {"status": "CONTINUE"}',
    },
  ],
  // Mediator must be first in roundDefinition: MediatorLedPolicy treats index 0
  // as the mediator who selects the next speaker.
  turnPolicy: { type: 'mediator_led', roundDefinition: ['mediator', 'party_a', 'party_b'], config: { mediatorName: 'mediator' } },
  terminationConditions: [
    { type: 'supervisor_classification', supervisorName: 'agreement_checker', terminalValues: ['AGREEMENT', 'IMPASSE'] },
    { type: 'turn_cap', maxTurns: 20 },
  ],
  outcomeSchema: {
    columns: [
      { name: 'dyad_id', type: 'string' },
      { name: 'agreement_reached', type: 'integer' },
      { name: 'rounds', type: 'integer' },
    ],
    utilityFunction: 'single_binary',
  },
};

export const SCENARIO_TEMPLATES = [
  PROCUREMENT_SCENARIO,
  LEGAL_ADVOCACY_SCENARIO,
  MEDIATION_SCENARIO,
] as const;
