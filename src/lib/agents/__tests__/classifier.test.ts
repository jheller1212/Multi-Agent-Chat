import { describe, it, expect, vi } from 'vitest';
import { ClassifierAgent } from '../classifier';

// Mock the provider factory to avoid real API calls
vi.mock('../../api/factory', () => ({
  createProviderByType: () => ({
    makeRequest: vi.fn().mockResolvedValue({
      content: '{"status": "ACCEPTANCE"}',
      usage: { promptTokens: 100, completionTokens: 10 },
    }),
  }),
}));

describe('ClassifierAgent', () => {
  it('parses a valid JSON classification', async () => {
    const agent = new ClassifierAgent({
      name: 'judge',
      role: 'supervisor',
      provider: 'openai',
      model: 'gpt-4.1',
      temperature: 0,
      maxTokens: 100,
      systemPrompt: 'You are a judge. Classify as ACCEPTANCE, REJECTION, or CONTINUE.',
      apiKey: 'test-key',
      allowedValues: ['ACCEPTANCE', 'REJECTION', 'CONTINUE'],
    });

    const { result, output } = await agent.classify({
      transcript: [
        { agentName: 'buyer', content: 'I accept your offer of $85 per unit.' },
        { agentName: 'seller', content: 'Great, we have a deal at $85 per unit.' },
      ],
      afterTurn: 4,
    });

    expect(result.classification).toBe('ACCEPTANCE');
    expect(output.outputType).toBe('classification');
    expect(output.supervisorName).toBe('judge');
    expect(output.parsed).toEqual({ classification: 'ACCEPTANCE' });
  });
});
