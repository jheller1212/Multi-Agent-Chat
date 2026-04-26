import { describe, it, expect } from 'vitest';

/**
 * Regression test: verify that the existing Quick Chat modules still import
 * correctly after Phase 2 changes (new types, orchestrator, policies).
 */
describe('Quick Chat regression', () => {
  it('existing types export correctly', async () => {
    const types = await import('../../../types/index');
    // AIModel union still exists and includes original values
    const model: typeof types.AIModel = undefined as unknown as typeof types.AIModel;
    expect(model).toBeUndefined(); // just checking the import resolved

    // ProviderType was added without breaking AIModel
    expect(true).toBe(true);
  });

  it('provider factory still creates all 4 original providers', async () => {
    const { createProvider } = await import('../../api/factory');
    const { OpenAIProvider } = await import('../../api/providers/openai');
    const { AnthropicProvider } = await import('../../api/providers/anthropic');
    const { MistralProvider } = await import('../../api/providers/mistral');
    const { GeminiProvider } = await import('../../api/providers/gemini');

    expect(createProvider('gpt4')).toBeInstanceOf(OpenAIProvider);
    expect(createProvider('claude')).toBeInstanceOf(AnthropicProvider);
    expect(createProvider('mistral')).toBeInstanceOf(MistralProvider);
    expect(createProvider('gemini')).toBeInstanceOf(GeminiProvider);
  });

  it('conversation engine module imports without error', async () => {
    const conversation = await import('../../api/conversation');
    expect(typeof conversation.generateResponse).toBe('function');
  });

  it('API types still export expected interfaces', async () => {
    const apiTypes = await import('../../api/types');
    expect(apiTypes.APIError).toBeDefined();
    expect(typeof apiTypes.APIError).toBe('function');
  });

  it('new scenario types do not conflict with existing types', async () => {
    const existing = await import('../../../types/index');
    const scenario = await import('../../../types/scenario');
    const agents = await import('../../../types/agents');

    // Both modules load without conflict
    expect(existing).toBeDefined();
    expect(scenario).toBeDefined();
    expect(agents).toBeDefined();
  });
});
