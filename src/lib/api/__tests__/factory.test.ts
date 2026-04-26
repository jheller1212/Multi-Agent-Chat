import { describe, it, expect } from 'vitest';
import { createProvider } from '../factory';
import { OpenAIProvider } from '../providers/openai';
import { AnthropicProvider } from '../providers/anthropic';
import { MistralProvider } from '../providers/mistral';
import { GeminiProvider } from '../providers/gemini';

describe('createProvider', () => {
  it('returns OpenAIProvider for gpt4', () => {
    expect(createProvider('gpt4')).toBeInstanceOf(OpenAIProvider);
  });

  it('returns AnthropicProvider for claude', () => {
    expect(createProvider('claude')).toBeInstanceOf(AnthropicProvider);
  });

  it('returns MistralProvider for mistral', () => {
    expect(createProvider('mistral')).toBeInstanceOf(MistralProvider);
  });

  it('returns GeminiProvider for gemini', () => {
    expect(createProvider('gemini')).toBeInstanceOf(GeminiProvider);
  });

  it('throws for unsupported model', () => {
    // @ts-expect-error testing invalid input
    expect(() => createProvider('invalid')).toThrow('Unsupported model');
  });
});
