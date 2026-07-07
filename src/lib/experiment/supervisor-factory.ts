import type { AgentConfig } from '../../types/agents';
import type { ProviderType } from '../../types';
import type { Scenario, SupervisorDefinition } from '../../types/scenario';
import { ClassifierAgent } from '../agents/classifier';
import { ExtractorAgent } from '../agents/extractor';
import { AppraiserAgent } from '../agents/appraiser';
import { extractAllowedValues, extractExpectedKeys } from './schema-utils';

export type SupervisorAgent = ClassifierAgent | ExtractorAgent | AppraiserAgent;

/** Sensible default model per provider, used when no supervisor override exists. */
const DEFAULT_SUPERVISOR_MODELS: Record<string, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-6',
  google: 'gemini-1.5-pro',
  mistral: 'mistral-large-latest',
  meta: 'llama-3.1-70b-instruct',
  alibaba: 'qwen-2.5-72b-instruct',
};

/**
 * Default supervisor provider/model for a cell.
 * Prefer the provider/model already mapped for the cell's domain agents — the
 * researcher necessarily has an API key for it. Only if no domain config is
 * available, fall back to the first provider with a configured key (avoids the
 * old hardcoded 'openai' default that failed for researchers without an
 * OpenAI key).
 */
export function resolveSupervisorDefault(
  cellDomainConfigs: readonly Pick<AgentConfig, 'provider' | 'model'>[],
  apiKeys: Record<string, string>,
): { provider: ProviderType; model: string } {
  const first = cellDomainConfigs[0];
  if (first) {
    return { provider: first.provider, model: first.model };
  }

  for (const [provider, model] of Object.entries(DEFAULT_SUPERVISOR_MODELS)) {
    if (apiKeys[provider]) {
      return { provider: provider as ProviderType, model };
    }
  }

  throw new Error('No API key configured for any provider — cannot run supervisors.');
}

/**
 * Construct a supervisor agent of the right class for a supervisor definition:
 * classifier → ClassifierAgent, appraiser → AppraiserAgent (SVI-style ratings),
 * everything else (extractor) → ExtractorAgent.
 */
export function createSupervisorAgent(
  supervisorDef: SupervisorDefinition,
  config: AgentConfig,
  apiKey: string,
): SupervisorAgent {
  if (supervisorDef.type === 'classifier') {
    return new ClassifierAgent({
      ...config,
      apiKey,
      allowedValues: extractAllowedValues(supervisorDef.outputSchema),
    });
  }

  if (supervisorDef.type === 'appraiser') {
    return new AppraiserAgent({
      ...config,
      apiKey,
      ratingKeys: extractExpectedKeys(supervisorDef.outputSchema),
    });
  }

  return new ExtractorAgent({
    ...config,
    apiKey,
    expectedKeys: extractExpectedKeys(supervisorDef.outputSchema),
  });
}

/**
 * Build the supervisor agents for a scenario.
 *
 * In devMode the runner never invokes supervisors (it returns stub outputs),
 * so no agents are constructed — construction resolves API keys and would
 * otherwise throw for providers the researcher has no key for.
 */
export function buildSupervisorAgents(
  scenario: Scenario,
  supervisorConfigs: Map<string, AgentConfig>,
  apiKeys: Record<string, string>,
  devMode: boolean,
): Map<string, SupervisorAgent> {
  const agents = new Map<string, SupervisorAgent>();
  if (devMode) return agents;

  for (const supervisorDef of scenario.supervisors) {
    const config = supervisorConfigs.get(supervisorDef.name);
    if (!config) continue;

    const apiKey = apiKeys[config.provider];
    if (!apiKey) {
      throw new Error(`No API key provided for provider: ${config.provider}`);
    }

    agents.set(supervisorDef.name, createSupervisorAgent(supervisorDef, config, apiKey));
  }

  return agents;
}
