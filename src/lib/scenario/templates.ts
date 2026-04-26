import type { Scenario } from '../../types/scenario';

/**
 * Pre-built scenario templates. Seeded into the database on first run.
 * Users can clone these to create their own variants.
 */

export const PROCUREMENT_SCENARIO: Omit<Scenario, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: 'Procurement Negotiation',
  description: 'Two-party buyer-seller negotiation with judge, analyst, and appraiser supervisors. Supports single-issue (price only) and multi-issue (price, payment terms, delivery, warranty) modes.',
  isPublic: true,
  isTemplate: true,
  domainAgents: [
    { name: 'buyer', description: 'Procurement professional negotiating on behalf of the buying firm', defaultPromptTemplate: 'scenarios/procurement/prompts/buyer.md' },
    { name: 'seller', description: 'Sales representative negotiating on behalf of the supplying firm', defaultPromptTemplate: 'scenarios/procurement/prompts/seller.md' },
  ],
  supervisors: [
    {
      name: 'judge',
      type: 'classifier',
      timing: 'per_round',
      outputSchema: { type: 'object', properties: { status: { type: 'string', enum: ['ACCEPTANCE', 'REJECTION', 'CONTINUE'] } }, required: ['status'] },
      promptTemplate: 'scenarios/procurement/prompts/judge.md',
    },
    {
      name: 'analyst',
      type: 'extractor',
      timing: 'per_round',
      outputSchema: { type: 'object', properties: { price: { type: ['number', 'null'] }, payment_terms_days: { type: ['integer', 'null'] }, delivery_weeks: { type: ['integer', 'null'] }, warranty_months: { type: ['integer', 'null'] } } },
      promptTemplate: 'scenarios/procurement/prompts/analyst.md',
    },
    {
      name: 'appraiser',
      type: 'appraiser',
      timing: 'post_termination',
      outputSchema: { type: 'object', patternProperties: { '^svi_\\d+$': { type: 'integer', minimum: 1, maximum: 7 } } },
      promptTemplate: 'scenarios/procurement/prompts/appraiser.md',
    },
  ],
  turnPolicy: {
    type: 'alternating',
    roundDefinition: ['buyer', 'seller'],
  },
  terminationConditions: [
    { type: 'supervisor_classification', supervisorName: 'judge', terminalValues: ['ACCEPTANCE', 'REJECTION'] },
    { type: 'turn_cap', maxTurns: 30 },
  ],
  outcomeSchema: {
    columns: [
      { name: 'dyad_id', type: 'string' },
      { name: 'buyer_model', type: 'string' },
      { name: 'seller_model', type: 'string' },
      { name: 'deal', type: 'integer' },
      { name: 'final_price', type: 'float', nullable: true },
      { name: 'prr', type: 'float', nullable: true },
      { name: 'buyer_surplus', type: 'float', nullable: true },
      { name: 'buyer_share', type: 'float', nullable: true },
      { name: 'turns', type: 'integer' },
      { name: 'obr', type: 'integer' },
      { name: 'owr', type: 'integer' },
      { name: 'opr', type: 'integer' },
      { name: 'dlr', type: 'integer' },
      { name: 'svi_buyer', type: 'float', nullable: true },
      { name: 'svi_seller', type: 'float', nullable: true },
      { name: 'joint_value', type: 'float', nullable: true },
      { name: 'payment_terms_days', type: 'integer', nullable: true },
      { name: 'delivery_weeks', type: 'integer', nullable: true },
      { name: 'warranty_months', type: 'integer', nullable: true },
    ],
    utilityFunction: 'weighted_sum',
  },
};

export const LEGAL_ADVOCACY_SCENARIO: Omit<Scenario, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: 'Legal Advocacy',
  description: 'Three-party adversarial scenario: plaintiff lawyer, defense lawyer, and a judge who participates and issues a ruling. Supervisors classify verdict, analyse arguments, and rate persuasiveness.',
  isPublic: true,
  isTemplate: true,
  domainAgents: [
    { name: 'plaintiff_lawyer', description: 'Attorney arguing on behalf of the plaintiff', defaultPromptTemplate: '' },
    { name: 'defense_lawyer', description: 'Attorney arguing on behalf of the defense', defaultPromptTemplate: '' },
    { name: 'judge', description: 'Judge who presides, asks questions, and issues a ruling', defaultPromptTemplate: '' },
  ],
  supervisors: [
    {
      name: 'verdict_classifier',
      type: 'classifier',
      timing: 'post_termination',
      outputSchema: { type: 'object', properties: { verdict: { type: 'string', enum: ['PLAINTIFF', 'DEFENSE', 'DISMISSAL'] } }, required: ['verdict'] },
      promptTemplate: '',
    },
    {
      name: 'argument_analyst',
      type: 'extractor',
      timing: 'per_round',
      outputSchema: { type: 'object', properties: { cited_authorities: { type: 'array' }, rhetorical_moves: { type: 'array' } } },
      promptTemplate: '',
    },
    {
      name: 'persuasiveness_appraiser',
      type: 'appraiser',
      timing: 'post_termination',
      outputSchema: { type: 'object' },
      promptTemplate: '',
    },
  ],
  turnPolicy: {
    type: 'structured_sequence',
    roundDefinition: ['plaintiff_lawyer', 'defense_lawyer', 'judge'],
  },
  terminationConditions: [
    { type: 'turn_cap', maxTurns: 40 },
  ],
  outcomeSchema: {
    columns: [
      { name: 'dyad_id', type: 'string' },
      { name: 'verdict', type: 'string' },
      { name: 'turns', type: 'integer' },
    ],
    utilityFunction: 'multi_class',
  },
};

export const MEDIATION_SCENARIO: Omit<Scenario, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: 'Mediation',
  description: 'Three-party mediation: two disputants and an active mediator who selects the next speaker. Supervisors extract agreements, analyse emotional tone, and rate fairness.',
  isPublic: true,
  isTemplate: true,
  domainAgents: [
    { name: 'disputant_a', description: 'First disputant in the mediation', defaultPromptTemplate: '' },
    { name: 'disputant_b', description: 'Second disputant in the mediation', defaultPromptTemplate: '' },
    { name: 'mediator', description: 'Active mediator who facilitates discussion and selects next speaker', defaultPromptTemplate: '' },
  ],
  supervisors: [
    {
      name: 'agreement_extractor',
      type: 'extractor',
      timing: 'post_termination',
      outputSchema: { type: 'object', properties: { agreement_reached: { type: 'boolean' }, terms: { type: 'object' } } },
      promptTemplate: '',
    },
    {
      name: 'emotional_tone_analyser',
      type: 'extractor',
      timing: 'per_round',
      outputSchema: { type: 'object' },
      promptTemplate: '',
    },
    {
      name: 'fairness_appraiser',
      type: 'appraiser',
      timing: 'post_termination',
      outputSchema: { type: 'object' },
      promptTemplate: '',
    },
  ],
  turnPolicy: {
    type: 'mediator_led',
    roundDefinition: ['disputant_a', 'disputant_b', 'mediator'],
    config: { mediatorName: 'mediator' },
  },
  terminationConditions: [
    { type: 'turn_cap', maxTurns: 50 },
  ],
  outcomeSchema: {
    columns: [
      { name: 'dyad_id', type: 'string' },
      { name: 'agreement_reached', type: 'integer' },
      { name: 'turns', type: 'integer' },
    ],
    utilityFunction: 'single_binary',
  },
};

export const SCENARIO_TEMPLATES = [
  PROCUREMENT_SCENARIO,
  LEGAL_ADVOCACY_SCENARIO,
  MEDIATION_SCENARIO,
] as const;
