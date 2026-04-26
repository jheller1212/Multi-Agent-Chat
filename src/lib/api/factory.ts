import { AIModel } from '../../types';
import type { ProviderType } from '../../types';
import { APIProvider } from './types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { MistralProvider } from './providers/mistral';
import { GeminiProvider } from './providers/gemini';
import { MetaProvider } from './providers/meta';
import { AlibabaProvider } from './providers/alibaba';

/** Create a provider from the legacy AIModel type (used by Quick Chat). */
export function createProvider(model: AIModel): APIProvider {
  switch (model) {
    case 'gpt4':
      return new OpenAIProvider();
    case 'claude':
      return new AnthropicProvider();
    case 'mistral':
      return new MistralProvider();
    case 'gemini':
      return new GeminiProvider();
    default:
      throw new Error(`Unsupported model: ${model}`);
  }
}

export interface ProviderOptions {
  baseUrl?: string;
  runtime?: 'browser' | 'node';
}

/** Create a provider from the research platform ProviderType (used by multi-agent runner). */
export function createProviderByType(provider: ProviderType, options?: ProviderOptions): APIProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider(options?.runtime);
    case 'google':
      return new GeminiProvider();
    case 'mistral':
      return new MistralProvider();
    case 'meta':
      return new MetaProvider(options?.baseUrl);
    case 'alibaba':
      return new AlibabaProvider(options?.baseUrl);
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unsupported provider: ${_exhaustive}`);
    }
  }
}