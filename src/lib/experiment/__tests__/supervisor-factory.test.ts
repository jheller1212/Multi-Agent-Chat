import { describe, it, expect } from 'vitest';
import {
  buildSupervisorAgents,
  createSupervisorAgent,
  resolveSupervisorDefault,
} from '../supervisor-factory';
import { ClassifierAgent } from '../../agents/classifier';
import { ExtractorAgent } from '../../agents/extractor';
import { AppraiserAgent } from '../../agents/appraiser';
import { PROCUREMENT_SCENARIO } from '../../scenario/templates';
import type { AgentConfig } from '../../../types/agents';
import type { Scenario, SupervisorDefinition } from '../../../types/scenario';

function supervisorConfig(name: string): AgentConfig {
  return {
    name,
    role: 'supervisor',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    temperature: 0,
    maxTokens: 512,
    systemPrompt: 'test',
  };
}

function procurementScenario(): Scenario {
  return {
    ...PROCUREMENT_SCENARIO,
    id: 'test',
    userId: 'test',
    createdAt: '',
    updatedAt: '',
  };
}

describe('createSupervisorAgent', () => {
  const byType = (type: SupervisorDefinition['type']) =>
    procurementScenario().supervisors.find(s => s.type === type)!;

  it('routes classifier definitions to ClassifierAgent', () => {
    const agent = createSupervisorAgent(byType('classifier'), supervisorConfig('judge'), 'key');
    expect(agent).toBeInstanceOf(ClassifierAgent);
  });

  it('routes extractor definitions to ExtractorAgent', () => {
    const agent = createSupervisorAgent(byType('extractor'), supervisorConfig('outcome_extractor'), 'key');
    expect(agent).toBeInstanceOf(ExtractorAgent);
  });

  it('routes appraiser definitions to AppraiserAgent (not ClassifierAgent)', () => {
    const agent = createSupervisorAgent(byType('appraiser'), supervisorConfig('svi_appraiser'), 'key');
    expect(agent).toBeInstanceOf(AppraiserAgent);
    expect(agent).not.toBeInstanceOf(ClassifierAgent);
  });
});

describe('buildSupervisorAgents', () => {
  const scenario = procurementScenario();
  const configs = new Map<string, AgentConfig>(
    scenario.supervisors.map(s => [s.name, supervisorConfig(s.name)]),
  );

  it('devMode: constructs no agents and does not resolve API keys', () => {
    // No keys at all — must not throw, because devMode never calls supervisors.
    const agents = buildSupervisorAgents(scenario, configs, {}, true);
    expect(agents.size).toBe(0);
  });

  it('production: throws a clear error when the provider key is missing', () => {
    expect(() => buildSupervisorAgents(scenario, configs, {}, false))
      .toThrow('No API key provided for provider: anthropic');
  });

  it('production: builds one agent per supervisor with the right classes', () => {
    const agents = buildSupervisorAgents(scenario, configs, { anthropic: 'key' }, false);
    expect(agents.size).toBe(3);
    expect(agents.get('judge')).toBeInstanceOf(ClassifierAgent);
    expect(agents.get('outcome_extractor')).toBeInstanceOf(ExtractorAgent);
    expect(agents.get('svi_appraiser')).toBeInstanceOf(AppraiserAgent);
  });
});

describe('resolveSupervisorDefault', () => {
  it('prefers the provider/model mapped for the cell domain agents', () => {
    const domainConfigs = [
      { provider: 'mistral' as const, model: 'mistral-large-latest' },
    ];
    expect(resolveSupervisorDefault(domainConfigs, { openai: 'also-present' })).toEqual({
      provider: 'mistral',
      model: 'mistral-large-latest',
    });
  });

  it('falls back to the first provider with a configured key', () => {
    expect(resolveSupervisorDefault([], { anthropic: 'key' })).toEqual({
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
    });
  });

  it('throws when no domain config and no keys are available', () => {
    expect(() => resolveSupervisorDefault([], {})).toThrow(/No API key configured/);
  });
});
