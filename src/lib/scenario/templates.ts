import type { Scenario } from '../../types/scenario';

/**
 * Pre-built scenario templates. Seeded into the database on first run.
 * Users can clone these to create their own variants.
 *
 * Simplified: 1 supervisor per scenario, 2-3 domain agents, clear outcome schemas.
 */

export const PROCUREMENT_SCENARIO: Omit<Scenario, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: 'Procurement Negotiation',
  description: 'Buyer and seller negotiate price and terms. A judge supervisor classifies each round as acceptance, rejection, or continuation.',
  isPublic: true,
  isTemplate: true,
  domainAgents: [
    { name: 'buyer', description: 'Procurement professional negotiating on behalf of the buying firm.', defaultPromptTemplate: 'You are a procurement professional at ManufactureCo. Negotiate the best price for industrial sensors.\n\nYour target price: €{TARGET_PRICE} per unit.\nYour walk-away (max): €{WALKAWAY} per unit.\n\nGUIDELINES\n- Make concrete numerical offers.\n- Do not reveal your walk-away.\n- When you accept, end with [ACCEPT].\n- To walk away, end with [WALKAWAY].\n- Keep messages under 150 words.' },
    { name: 'seller', description: 'Sales representative negotiating on behalf of the supplying firm.', defaultPromptTemplate: 'You are a sales representative at SupplierCo. Sell industrial sensors at the best margin.\n\nYour floor price (min): €{FLOOR_PRICE} per unit.\nList price: €{LIST_PRICE} per unit.\n\nGUIDELINES\n- Make concrete numerical offers.\n- Do not reveal your floor price.\n- When you accept, end with [ACCEPT].\n- To walk away, end with [WALKAWAY].\n- Keep messages under 150 words.' },
  ],
  supervisors: [
    {
      name: 'judge',
      type: 'classifier',
      timing: 'per_round',
      outputSchema: { type: 'object', properties: { status: { type: 'string', enum: ['ACCEPTANCE', 'REJECTION', 'CONTINUE'] } }, required: ['status'] },
      promptTemplate: 'Classify the negotiation state as ACCEPTANCE, REJECTION, or CONTINUE.\nOutput JSON only: {"status": "CONTINUE"}',
    },
  ],
  turnPolicy: { type: 'alternating', roundDefinition: ['buyer', 'seller'] },
  terminationConditions: [
    { type: 'supervisor_classification', supervisorName: 'judge', terminalValues: ['ACCEPTANCE', 'REJECTION'] },
    { type: 'turn_cap', maxTurns: 20 },
  ],
  outcomeSchema: {
    columns: [
      { name: 'dyad_id', type: 'string' },
      { name: 'deal', type: 'integer' },
      { name: 'final_price', type: 'float', nullable: true },
      { name: 'rounds', type: 'integer' },
    ],
    utilityFunction: 'weighted_sum',
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
    { name: 'party_a', description: 'First disputant — a landlord.', defaultPromptTemplate: 'You are a landlord. Your tenant has been 3 months behind on rent (€3,000 total). You want to resolve this without eviction.\n\nYour ideal outcome: full repayment within 60 days.\nYour minimum: at least €2,000 repaid within 90 days.\n\nGUIDELINES\n- Be firm but willing to negotiate a payment plan.\n- Respond to the mediator\'s questions honestly.\n- If you agree to a settlement, say [AGREE].' },
    { name: 'party_b', description: 'Second disputant — a tenant.', defaultPromptTemplate: 'You are a tenant. You owe 3 months of rent (€3,000) due to a job loss. You have a new job now.\n\nYour ideal outcome: pay €2,000 over 6 months, forgive €1,000.\nYour minimum: any payment plan over 4+ months.\n\nGUIDELINES\n- Be honest about your financial situation.\n- Respond to the mediator\'s questions.\n- If you agree to a settlement, say [AGREE].' },
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
