import { describe, it, expect, beforeEach } from 'vitest';
import { AlternatingPolicy } from '../policies/alternating';
import { StructuredSequencePolicy } from '../policies/structured-sequence';
import { MediatorLedPolicy } from '../policies/mediator-led';
import type { TurnPolicyState } from '../policies/types';

function makeState(roundDefinition: string[]): TurnPolicyState {
  return {
    agentNames: [...new Set(roundDefinition)],
    turnHistory: [],
    roundDefinition,
  };
}

describe('AlternatingPolicy', () => {
  let policy: AlternatingPolicy;

  beforeEach(() => {
    policy = new AlternatingPolicy();
  });

  it('alternates between two agents', () => {
    const state = makeState(['buyer', 'seller']);
    const r1 = policy.selectNext(state);
    expect(r1.nextAgent).toBe('buyer');
    expect(r1.roundComplete).toBe(false);

    const r2 = policy.selectNext(state);
    expect(r2.nextAgent).toBe('seller');
    expect(r2.roundComplete).toBe(true);

    const r3 = policy.selectNext(state);
    expect(r3.nextAgent).toBe('buyer');
    expect(r3.roundComplete).toBe(false);
  });

  it('handles three agents in round definition', () => {
    const state = makeState(['a', 'b', 'c']);
    expect(policy.selectNext(state).nextAgent).toBe('a');
    expect(policy.selectNext(state).nextAgent).toBe('b');
    const r3 = policy.selectNext(state);
    expect(r3.nextAgent).toBe('c');
    expect(r3.roundComplete).toBe(true);
  });

  it('resets position', () => {
    const state = makeState(['buyer', 'seller']);
    policy.selectNext(state);
    policy.reset();
    expect(policy.selectNext(state).nextAgent).toBe('buyer');
  });

  it('throws on empty roundDefinition', () => {
    expect(() => policy.selectNext(makeState([]))).toThrow('must not be empty');
  });
});

describe('StructuredSequencePolicy', () => {
  let policy: StructuredSequencePolicy;

  beforeEach(() => {
    policy = new StructuredSequencePolicy();
  });

  it('follows the sequence exactly', () => {
    const state = makeState(['plaintiff', 'defense', 'judge', 'plaintiff', 'defense']);
    expect(policy.selectNext(state).nextAgent).toBe('plaintiff');
    expect(policy.selectNext(state).nextAgent).toBe('defense');
    expect(policy.selectNext(state).nextAgent).toBe('judge');
    expect(policy.selectNext(state).nextAgent).toBe('plaintiff');
    const r5 = policy.selectNext(state);
    expect(r5.nextAgent).toBe('defense');
    expect(r5.roundComplete).toBe(true);
  });

  it('resets position', () => {
    const state = makeState(['a', 'b']);
    policy.selectNext(state);
    policy.reset();
    expect(policy.selectNext(state).nextAgent).toBe('a');
  });
});

describe('MediatorLedPolicy', () => {
  let policy: MediatorLedPolicy;

  beforeEach(() => {
    policy = new MediatorLedPolicy();
  });

  it('alternates mediator with participants', () => {
    const state = makeState(['mediator', 'disputantA', 'disputantB']);
    // mediator -> disputantA -> mediator -> disputantB -> round complete
    expect(policy.selectNext(state).nextAgent).toBe('mediator');
    expect(policy.selectNext(state).nextAgent).toBe('disputantA');
    expect(policy.selectNext(state).nextAgent).toBe('mediator');
    const r4 = policy.selectNext(state);
    expect(r4.nextAgent).toBe('disputantB');
    expect(r4.roundComplete).toBe(true);
  });

  it('works with single participant', () => {
    const state = makeState(['mediator', 'party']);
    const r1 = policy.selectNext(state);
    expect(r1.nextAgent).toBe('mediator');
    expect(r1.roundComplete).toBe(false);
    const r2 = policy.selectNext(state);
    expect(r2.nextAgent).toBe('party');
    expect(r2.roundComplete).toBe(true);
  });

  it('resets to start', () => {
    const state = makeState(['mediator', 'a', 'b']);
    policy.selectNext(state);
    policy.selectNext(state);
    policy.reset();
    expect(policy.selectNext(state).nextAgent).toBe('mediator');
  });

  it('throws with fewer than 2 agents', () => {
    expect(() => policy.selectNext(makeState(['only']))).toThrow('at least 2 agents');
  });
});
