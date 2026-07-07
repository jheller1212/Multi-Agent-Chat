import { describe, it, expect, vi } from 'vitest';
import { ClassifierAgent } from '../classifier';

// Mock the provider factory to avoid real API calls
const mock = vi.hoisted(() => ({ content: '{"status": "ACCEPTANCE"}' }));

vi.mock('../../api/factory', () => ({
  createProviderByType: () => ({
    makeRequest: vi.fn().mockImplementation(() => Promise.resolve({
      content: mock.content,
      usage: { promptTokens: 100, completionTokens: 10 },
    })),
  }),
}));

function makeAgent(allowedValues: string[]): ClassifierAgent {
  return new ClassifierAgent({
    name: 'judge',
    role: 'supervisor',
    provider: 'openai',
    model: 'gpt-4.1',
    temperature: 0,
    maxTokens: 100,
    systemPrompt: 'You are a judge. Classify as ACCEPTANCE, REJECTION, or CONTINUE.',
    apiKey: 'test-key',
    allowedValues,
  });
}

describe('ClassifierAgent', () => {
  it('parses a valid JSON classification', async () => {
    mock.content = '{"status": "ACCEPTANCE"}';
    const agent = makeAgent(['ACCEPTANCE', 'REJECTION', 'CONTINUE']);

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

  it('falls back to CONTINUE on an unparseable response, regardless of enum order', async () => {
    mock.content = 'I am not sure what to make of this.';
    // CONTINUE deliberately NOT last — ordering must not be load-bearing.
    const agent = makeAgent(['CONTINUE', 'ACCEPTANCE', 'REJECTION']);

    const { result } = await agent.classify({
      transcript: [{ agentName: 'buyer', content: 'Hello.' }],
      afterTurn: 1,
    });

    expect(result.classification).toBe('CONTINUE');
  });

  it('keeps the positional fallback for schemas without CONTINUE', async () => {
    mock.content = 'gibberish'; // contains neither YES nor NO as substrings
    const agent = makeAgent(['YES', 'NO']);

    const { result } = await agent.classify({
      transcript: [{ agentName: 'buyer', content: 'Hello.' }],
      afterTurn: 1,
    });

    expect(result.classification).toBe('NO');
  });
});
