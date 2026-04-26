import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateResponse } from '../conversation';
import { APIError } from '../types';
import type { ChatConfig } from '../../../types';

// Mock the factory to avoid real provider instantiation
vi.mock('../factory', () => ({
  createProvider: vi.fn(),
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' });

import { createProvider } from '../factory';

const mockConfig: ChatConfig = {
  model: 'gpt4',
  apiKey: 'sk-test1234567890',
  modelVersion: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: 'You are helpful.',
};

const mockMessages = [
  { id: '1', role: 'user' as const, content: 'Hello', timestamp: Date.now() },
];

function mockProvider(makeRequest: ReturnType<typeof vi.fn>) {
  (createProvider as ReturnType<typeof vi.fn>).mockReturnValue({ makeRequest });
}

describe('generateResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a message on successful response', async () => {
    const makeRequest = vi.fn().mockResolvedValue({ content: 'Hello back!' });
    mockProvider(makeRequest);

    const result = await generateResponse(mockConfig, mockMessages);

    expect(result.content).toBe('Hello back!');
    expect(result.role).toBe('assistant');
    expect(result.wordCount).toBe(2);
    expect(typeof result.timeTaken).toBe('number');
  });

  it('passes abort signal to provider', async () => {
    const makeRequest = vi.fn().mockResolvedValue({ content: 'ok' });
    mockProvider(makeRequest);

    const ac = new AbortController();
    await generateResponse(mockConfig, mockMessages, ac.signal);

    expect(makeRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      ac.signal,
    );
  });

  it('throws immediately on non-retryable API error (401)', async () => {
    const makeRequest = vi.fn().mockRejectedValue(new APIError('Unauthorized', 401));
    mockProvider(makeRequest);

    await expect(generateResponse(mockConfig, mockMessages)).rejects.toThrow('Unauthorized');
    expect(makeRequest).toHaveBeenCalledTimes(1);
  });
});
