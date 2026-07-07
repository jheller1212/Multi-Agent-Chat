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
