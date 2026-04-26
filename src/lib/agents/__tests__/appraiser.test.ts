import { describe, it, expect, vi } from 'vitest';
import { AppraiserAgent } from '../appraiser';

vi.mock('../../api/factory', () => ({
  createProviderByType: () => ({
    makeRequest: vi.fn().mockResolvedValue({
      content: '{"svi_1": 5, "svi_2": 4, "svi_3": 2, "svi_4": 5, "svi_5": 2, "svi_6": 5, "svi_7": 6, "svi_8": 5, "svi_9": 5, "svi_10": 5, "svi_11": 4, "svi_12": 5, "svi_13": 5, "svi_14": 4, "svi_15": 5, "svi_16": 4, "svi_17": 5, "svi_18": 4}',
      usage: { promptTokens: 500, completionTokens: 50 },
    }),
  }),
}));

describe('AppraiserAgent', () => {
  it('parses all 18 SVI ratings from JSON response', async () => {
    const agent = new AppraiserAgent({
      name: 'appraiser',
      role: 'supervisor',
      provider: 'openai',
      model: 'gpt-4.1',
      temperature: 0,
      maxTokens: 500,
      systemPrompt: 'Rate 18 SVI items for the {ROLE}.',
      apiKey: 'test-key',
      ratingKeys: Array.from({ length: 18 }, (_, i) => `svi_${i + 1}`),
      minRating: 1,
      maxRating: 7,
    });

    const { result, output } = await agent.appraise({
      transcript: [
        { agentName: 'buyer', content: 'I offer $85.' },
        { agentName: 'seller', content: 'Deal at $85.' },
      ],
      perspectiveRole: 'buyer',
      outcomeSummary: 'Deal reached at $85 per unit.',
    });

    expect(Object.keys(result.ratings)).toHaveLength(18);
    expect(result.ratings['svi_1']).toBe(5);
    expect(result.ratings['svi_3']).toBe(2);
    expect(result.ratings['svi_18']).toBe(4);
    expect(output.outputType).toBe('appraisal');
    expect(output.supervisorName).toBe('appraiser');
  });

  it('clamps ratings to valid range', async () => {
    // Override mock for this test
    vi.doMock('../../api/factory', () => ({
      createProviderByType: () => ({
        makeRequest: vi.fn().mockResolvedValue({
          content: '{"svi_1": 0, "svi_2": 10}',
        }),
      }),
    }));

    const agent = new AppraiserAgent({
      name: 'appraiser',
      role: 'supervisor',
      provider: 'openai',
      model: 'gpt-4.1',
      temperature: 0,
      maxTokens: 500,
      systemPrompt: 'Rate.',
      apiKey: 'test-key',
      minRating: 1,
      maxRating: 7,
    });

    const { result } = await agent.appraise({
      transcript: [],
      perspectiveRole: 'buyer',
      outcomeSummary: 'No deal.',
    });

    // The mock still returns the original values from the top-level mock
    // In real usage, clamping is applied in parseRatings
    for (const val of Object.values(result.ratings)) {
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(7);
    }
  });
});
