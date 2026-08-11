import { describe, expect, it } from 'vitest';

import { collectPlaceholders, isBound, scenarioToStudio, studioToScenario } from '../model';
import type { StudioState } from '../model';
import type { Scenario } from '../../../../types/scenario';

describe('collectPlaceholders', () => {
  it('detects {SLOT} and ${SLOT} patterns across agents, deduplicated in order', () => {
    const slots = collectPlaceholders([
      { prompt: 'Target: {TARGET_PRICE}, walkaway {WALKAWAY}' },
      { prompt: 'Floor: ${FLOOR_PRICE} and again {TARGET_PRICE}' },
    ]);
    expect(slots).toEqual(['TARGET_PRICE', 'WALKAWAY', 'FLOOR_PRICE']);
  });

  it('ignores lowercase braces and JSON braces', () => {
    expect(collectPlaceholders([{ prompt: 'Respond with {"label": "x"} or {notASlot}' }])).toEqual([]);
  });
});

describe('isBound', () => {
  it('treats missing or blank defaults as unbound', () => {
    expect(isBound('A', {})).toBe(false);
    expect(isBound('A', { A: '' })).toBe(false);
    expect(isBound('A', { A: '  ' })).toBe(false);
    expect(isBound('A', { A: 0 })).toBe(true);
    expect(isBound('A', { A: 'x' })).toBe(true);
  });
});

function makeState(): StudioState {
  return {
    agents: [
      {
        id: 'n1', name: 'Buyer', description: 'buys', lane: 'negotiator',
        prompt: 'Target {TARGET}', supervisorType: 'classifier', timing: 'per_round',
        classifierSchema: { allowedValues: [], terminalValues: [] }, extractorSchema: { keys: [] },
      },
      {
        id: 'n2', name: 'Seller', description: 'sells', lane: 'negotiator',
        prompt: 'Floor {FLOOR}', supervisorType: 'classifier', timing: 'per_round',
        classifierSchema: { allowedValues: [], terminalValues: [] }, extractorSchema: { keys: [] },
      },
      {
        id: 's1', name: 'Judge', description: '', lane: 'supervisor',
        prompt: 'Classify.', supervisorType: 'classifier', timing: 'per_round',
        classifierSchema: { allowedValues: ['Ongoing', 'Deal'], terminalValues: ['Deal'] },
        extractorSchema: { keys: [] },
      },
      {
        id: 's2', name: 'Analyst', description: '', lane: 'supervisor',
        prompt: 'Extract.', supervisorType: 'extractor', timing: 'post_termination',
        classifierSchema: { allowedValues: [], terminalValues: [] },
        extractorSchema: { keys: [{ name: 'price', type: 'float', nullable: true }] },
      },
    ],
    settings: { turnPolicyType: 'alternating', mediatorId: null, turnCap: 10, defaultParams: { TARGET: 100 } },
  };
}

describe('scenarioToStudio — legacy production fixture (Procurement template)', () => {
  // Exactly as stored in the production `scenarios` table (posted on PR #10 as
  // the round-trip regression fixture). Legacy shapes: classifier outputSchema
  // has no terminalValues (that lives only in terminationConditions), and the
  // appraiser uses a patternProperties JSON-Schema shape.
  const fixture = {
    id: 'fx', userId: 'u', createdAt: '', updatedAt: '',
    name: 'Procurement', description: '', isPublic: true, isTemplate: true,
    turnPolicy: { type: 'alternating' as const, roundDefinition: ['buyer', 'seller'] },
    supervisors: [
      {
        name: 'judge', type: 'classifier' as const, timing: 'per_round' as const,
        outputSchema: {
          type: 'object', required: ['status'],
          properties: { status: { enum: ['ACCEPTANCE', 'REJECTION', 'CONTINUE'], type: 'string' } },
        },
        promptTemplate: 'scenarios/procurement/prompts/judge.md',
      },
      {
        name: 'analyst', type: 'extractor' as const, timing: 'per_round' as const,
        outputSchema: {
          type: 'object',
          properties: {
            price: { type: ['number', 'null'] },
            delivery_weeks: { type: ['integer', 'null'] },
          },
        },
        promptTemplate: 'scenarios/procurement/prompts/analyst.md',
      },
      {
        name: 'appraiser', type: 'appraiser' as const, timing: 'post_termination' as const,
        outputSchema: {
          type: 'object',
          patternProperties: { '^svi_\\d+$': { type: 'integer', minimum: 1, maximum: 7 } },
        },
        promptTemplate: 'scenarios/procurement/prompts/appraiser.md',
      },
    ],
    domainAgents: [
      { name: 'buyer', description: 'Procurement professional', defaultPromptTemplate: 'scenarios/procurement/prompts/buyer.md' },
      { name: 'seller', description: 'Sales representative', defaultPromptTemplate: 'scenarios/procurement/prompts/seller.md' },
    ],
    outcomeSchema: {
      columns: [
        { name: 'dyad_id', type: 'string' as const },
        { name: 'final_price', type: 'float' as const, nullable: true },
      ],
      utilityFunction: 'weighted_sum',
    },
    terminationConditions: [
      { type: 'supervisor_classification' as const, supervisorName: 'judge', terminalValues: ['ACCEPTANCE', 'REJECTION'] },
      { type: 'turn_cap' as const, maxTurns: 30 },
    ],
  } as unknown as Scenario;

  it('recovers terminalValues from terminationConditions for a legacy classifier schema (blocker 2)', () => {
    const studio = scenarioToStudio(fixture);
    const judge = studio.agents.find(a => a.name === 'judge')!;
    expect(judge.classifierSchema.allowedValues).toEqual(['ACCEPTANCE', 'REJECTION', 'CONTINUE']);
    expect(judge.classifierSchema.terminalValues).toEqual(['ACCEPTANCE', 'REJECTION']);
  });

  it('does not produce garbage expected keys from a patternProperties appraiser schema', () => {
    const studio = scenarioToStudio(fixture);
    const appraiser = studio.agents.find(a => a.name === 'appraiser')!;
    expect(appraiser.extractorSchema.keys).toEqual([]);
  });

  it('leaves promptTemplate file-path strings untouched', () => {
    const studio = scenarioToStudio(fixture);
    expect(studio.agents.map(a => a.prompt)).toEqual(
      expect.arrayContaining([
        'scenarios/procurement/prompts/buyer.md',
        'scenarios/procurement/prompts/seller.md',
        'scenarios/procurement/prompts/judge.md',
        'scenarios/procurement/prompts/analyst.md',
        'scenarios/procurement/prompts/appraiser.md',
      ]),
    );
  });

  it('round-trip preserves the supervisor_classification termination condition (blocker 2)', () => {
    const studio = scenarioToStudio(fixture);
    const out = studioToScenario(studio, {
      name: fixture.name, description: fixture.description,
      isPublic: fixture.isPublic, isTemplate: fixture.isTemplate,
      outcomeSchema: fixture.outcomeSchema,
    });
    expect(out.terminationConditions).toEqual(
      expect.arrayContaining([
        { type: 'supervisor_classification', supervisorName: 'judge', terminalValues: ['ACCEPTANCE', 'REJECTION'] },
      ]),
    );
    // outcomeSchema.columns pass through without loss (read-only in the Studio, carried via `base`).
    expect(out.outcomeSchema.columns).toEqual(fixture.outcomeSchema.columns);
  });
});

describe('studioToScenario', () => {
  const base = {
    name: 'Test', description: 'd', isPublic: false, isTemplate: false,
    outcomeSchema: { columns: [] },
  };

  it('writes speaking order from negotiator lane order into turnPolicy.roundDefinition', () => {
    const out = studioToScenario(makeState(), base);
    expect(out.turnPolicy.roundDefinition).toEqual(['Buyer', 'Seller']);

    const reordered = makeState();
    reordered.agents = [reordered.agents[1], reordered.agents[0], ...reordered.agents.slice(2)];
    expect(studioToScenario(reordered, base).turnPolicy.roundDefinition).toEqual(['Seller', 'Buyer']);
  });

  it('serializes supervisor schemas in the SIMPLE shape', () => {
    const out = studioToScenario(makeState(), base);
    expect(out.supervisors[0].outputSchema).toEqual({ allowedValues: ['Ongoing', 'Deal'], terminalValues: ['Deal'] });
    expect(out.supervisors[1].outputSchema).toEqual({ keys: [{ name: 'price', type: 'float', nullable: true }] });
  });

  it('derives termination conditions from turn cap + classifier terminal values', () => {
    const out = studioToScenario(makeState(), base);
    expect(out.terminationConditions).toEqual([
      { type: 'turn_cap', maxTurns: 10 },
      { type: 'supervisor_classification', supervisorName: 'Judge', terminalValues: ['Deal'] },
    ]);
  });

  it('records the mediator name only for mediator-led policies', () => {
    const state = makeState();
    state.settings.turnPolicyType = 'mediator_led';
    state.settings.mediatorId = 's1';
    const out = studioToScenario(state, base);
    expect(out.turnPolicy.config).toEqual({ mediator: 'Judge' });
    expect(studioToScenario(makeState(), base).turnPolicy.config).toBeUndefined();
  });

  it('never emits a mediator from the negotiator lane, even with a stale mediatorId (blocker 5)', () => {
    const state = makeState();
    state.settings.turnPolicyType = 'mediator_led';
    // n1 (Buyer) is a negotiator; a stale mediatorId pointing at it (e.g. after
    // a drag-out-of-supervisor-lane that didn't clear it) must not surface.
    state.settings.mediatorId = 'n1';
    const out = studioToScenario(state, base);
    expect(out.turnPolicy.config).toBeUndefined();
  });

  it('round-trips through scenarioToStudio preserving lanes, order, and schemas', () => {
    const scenario = {
      id: 'x', userId: 'u', createdAt: '', updatedAt: '',
      ...studioToScenario(makeState(), base),
    } as Scenario;
    const back = scenarioToStudio(scenario);
    expect(back.agents.map(a => [a.name, a.lane])).toEqual([
      ['Buyer', 'negotiator'], ['Seller', 'negotiator'], ['Judge', 'supervisor'], ['Analyst', 'supervisor'],
    ]);
    expect(back.agents[2].classifierSchema).toEqual({ allowedValues: ['Ongoing', 'Deal'], terminalValues: ['Deal'] });
    expect(back.agents[3].extractorSchema).toEqual({ keys: [{ name: 'price', type: 'float', nullable: true }] });
    expect(back.settings.turnCap).toBe(10);
    expect(back.settings.defaultParams).toEqual({ TARGET: 100 });
  });
});
