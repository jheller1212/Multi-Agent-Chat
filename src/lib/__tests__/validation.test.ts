import { describe, it, expect } from 'vitest';
import { validateApiKey, validateModelConfig, getModelLabel } from '../validation';

describe('validateApiKey', () => {
  it('rejects keys shorter than 11 characters', () => {
    expect(validateApiKey('short')).toBe(false);
    expect(validateApiKey('12345678901')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateApiKey('')).toBe(false);
  });

  it('validates OpenAI key prefix', () => {
    expect(validateApiKey('sk-abcdefghijklmnop', 'gpt4')).toBe(true);
    expect(validateApiKey('wrong-prefix-key-long', 'gpt4')).toBe(false);
  });

  it('validates Anthropic key prefix', () => {
    expect(validateApiKey('sk-ant-abcdefghijklmnop', 'claude')).toBe(true);
    expect(validateApiKey('sk-notanthropic12345', 'claude')).toBe(false);
  });

  it('validates Gemini key prefix', () => {
    expect(validateApiKey('AIzaSyDabc123456789', 'gemini')).toBe(true);
    expect(validateApiKey('wrong-prefix-very-long', 'gemini')).toBe(false);
  });

  it('accepts any long key for Mistral (no prefix rule)', () => {
    expect(validateApiKey('any-long-key-here-12345', 'mistral')).toBe(true);
  });

  it('accepts any long key when no model specified', () => {
    expect(validateApiKey('any-long-key-here-12345')).toBe(true);
  });
});

describe('validateModelConfig', () => {
  const validGpt4Key = 'sk-abcdefghijklmnop';

  it('returns no errors for valid config', () => {
    expect(validateModelConfig('gpt4', {
      apiKey: validGpt4Key,
      temperature: 0.7,
      maxTokens: 2000,
    })).toEqual([]);
  });

  it('returns error for missing API key', () => {
    const errors = validateModelConfig('gpt4', { apiKey: '', temperature: 0.7, maxTokens: 2000 });
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('API key');
  });

  it('returns error for temperature out of range', () => {
    expect(validateModelConfig('gpt4', { apiKey: validGpt4Key, temperature: -1 }))
      .toEqual(expect.arrayContaining([expect.stringContaining('Temperature')]));

    expect(validateModelConfig('gpt4', { apiKey: validGpt4Key, temperature: 3 }))
      .toEqual(expect.arrayContaining([expect.stringContaining('Temperature')]));
  });

  it('accepts temperature at boundaries', () => {
    expect(validateModelConfig('gpt4', { apiKey: validGpt4Key, temperature: 0 })).toEqual([]);
    expect(validateModelConfig('gpt4', { apiKey: validGpt4Key, temperature: 2 })).toEqual([]);
  });

  it('returns error for maxTokens out of range', () => {
    expect(validateModelConfig('gpt4', { apiKey: validGpt4Key, maxTokens: 0 }))
      .toEqual(expect.arrayContaining([expect.stringContaining('Max tokens')]));

    expect(validateModelConfig('gpt4', { apiKey: validGpt4Key, maxTokens: 200_001 }))
      .toEqual(expect.arrayContaining([expect.stringContaining('Max tokens')]));
  });

  it('can return multiple errors at once', () => {
    const errors = validateModelConfig('gpt4', { apiKey: '', temperature: -1, maxTokens: 0 });
    expect(errors.length).toBe(3);
  });
});

describe('getModelLabel', () => {
  it('returns human-readable labels', () => {
    expect(getModelLabel('gpt4')).toBe('OpenAI');
    expect(getModelLabel('claude')).toBe('Anthropic Claude');
    expect(getModelLabel('gemini')).toBe('Google Gemini');
    expect(getModelLabel('mistral')).toBe('Mistral');
  });
});
