import { describe, it, expect, vi } from 'vitest';
import { ExtractorAgent } from '../extractor';

vi.mock('../../api/factory', () => ({
  createProviderByType: () => ({
    makeRequest: vi.fn().mockResolvedValue({
      content: '{"price": 84.50, "payment_terms_days": 30, "delivery_weeks": 4, "warranty_months": 12}',
      usage: { promptTokens: 100, completionTokens: 20 },
    }),
  }),
}));

describe('ExtractorAgent', () => {
  it('parses structured extraction from JSON response', async () => {
    const agent = new ExtractorAgent({
      name: 'analyst',
      role: 'supervisor',
      provider: 'openai',
      model: 'gpt-4.1',
      temperature: 0,
      maxTokens: 200,
      systemPrompt: 'Extract price and terms.',
      apiKey: 'test-key',
      expectedKeys: ['price', 'payment_terms_days', 'delivery_weeks', 'warranty_months'],
    });

    const { result, output } = await agent.extract({
      transcript: [
        { agentName: 'seller', content: 'I can offer $84.50 per unit with net-30 payment, 4-week delivery, and 12-month warranty.' },
      ],
      afterTurn: 3,
    });

    expect(result.parsed).toEqual({
      price: 84.50,
      payment_terms_days: 30,
      delivery_weeks: 4,
      warranty_months: 12,
    });
    expect(output.outputType).toBe('extraction');
    expect(output.supervisorName).toBe('analyst');
  });
});
