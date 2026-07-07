import { describe, it, expect } from 'vitest';
import { resolveFactorMapping, validateAgentAssignments } from '../config-validation';
import type { AgentAssignment, FactorDefinition } from '../../../types/experiment';

const FACTORS: FactorDefinition[] = [
  { name: 'buyer_capability', levels: ['strong', 'weak'] },
  { name: 'seller_capability', levels: ['strong', 'weak'] },
];

function fullAssignment(agentName: string): AgentAssignment {
  const factorMappings: AgentAssignment['factorMappings'] = {};
  for (const factor of FACTORS) {
    for (const level of factor.levels) {
      factorMappings[`${factor.name}=${level}`] = {
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        temperature: 0.7,
      };
    }
  }
  return { agentName, factorMappings };
}

describe('resolveFactorMapping', () => {
  it('resolves a factorName=level key matching the cell', () => {
    const assignment = fullAssignment('buyer');
    const mapping = resolveFactorMapping(assignment, { buyer_capability: 'strong', seller_capability: 'weak' });
    expect(mapping).toEqual({ provider: 'anthropic', model: 'claude-sonnet-4-6', temperature: 0.7 });
  });

  it('resolves a legacy plain-factor-name key for any level', () => {
    const assignment: AgentAssignment = {
      agentName: 'buyer',
      factorMappings: {
        buyer_capability: { provider: 'openai', model: 'gpt-4o', temperature: 0.5 },
      },
    };
    expect(resolveFactorMapping(assignment, { buyer_capability: 'weak' })).toEqual({
      provider: 'openai', model: 'gpt-4o', temperature: 0.5,
    });
  });

  it('returns null when no key matches the cell', () => {
    const assignment: AgentAssignment = {
      agentName: 'buyer',
      factorMappings: {
        'buyer_capability=strong': { provider: 'openai', model: 'gpt-4o', temperature: 0.7 },
      },
    };
    expect(resolveFactorMapping(assignment, { buyer_capability: 'weak' })).toBeNull();
  });

  it('returns null when the assignment is missing', () => {
    expect(resolveFactorMapping(undefined, { buyer_capability: 'strong' })).toBeNull();
  });
});

describe('validateAgentAssignments', () => {
  const AGENTS = [{ name: 'buyer' }, { name: 'seller' }];

  it('passes when every cell has a mapping for every agent', () => {
    const errors = validateAgentAssignments(FACTORS, AGENTS, [
      fullAssignment('buyer'),
      fullAssignment('seller'),
    ]);
    expect(errors).toEqual([]);
  });

  it('rejects zero factors with a clear message', () => {
    const errors = validateAgentAssignments([], AGENTS, [fullAssignment('buyer')]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/no factors/i);
  });

  it('reports a missing agent assignment', () => {
    const errors = validateAgentAssignments(FACTORS, AGENTS, [fullAssignment('buyer')]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('"seller"');
  });

  it('reports every unmapped cell, naming agent and cell', () => {
    const partial: AgentAssignment = {
      agentName: 'buyer',
      factorMappings: {
        'buyer_capability=strong': { provider: 'openai', model: 'gpt-4o', temperature: 0.7 },
      },
    };
    const errors = validateAgentAssignments(FACTORS, [{ name: 'buyer' }], [partial]);
    // strong/weak x strong/weak = 4 cells; only buyer_capability=strong cells are mapped
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('"buyer"');
    expect(errors[0]).toContain('buyer_capability=weak');
  });
});
