/** Provider + model catalog for experiment configuration (mirrors ExperimentLauncher). */
import type { ProviderType } from '../../../types';

export interface ModelOption {
  id: string;
  label: string;
}

export const PROVIDER_LABELS: Record<ProviderType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  mistral: 'Mistral',
  meta: 'Meta',
  alibaba: 'Alibaba',
};

/** Provider identity dot colors (same values as the legacy .prov-* classes). */
export const PROVIDER_COLORS: Record<ProviderType, string> = {
  openai: '#10A37F',
  anthropic: '#D97757',
  google: '#4285F4',
  mistral: '#FA520F',
  meta: '#0064E0',
  alibaba: '#FF6A00',
};

export const MODEL_CATALOG: Record<ProviderType, ModelOption[]> = {
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4.1', label: 'GPT-4.1' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
    { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
  ],
  google: [
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  mistral: [
    { id: 'mistral-large-latest', label: 'Mistral Large' },
    { id: 'mistral-small-latest', label: 'Mistral Small' },
  ],
  meta: [
    { id: 'llama-3.1-8b-instruct', label: 'Llama 3.1 8B' },
    { id: 'llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
  ],
  alibaba: [
    { id: 'qwen-2.5-7b-instruct', label: 'Qwen 2.5 7B' },
    { id: 'qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B' },
  ],
};

export const PROVIDERS = Object.keys(MODEL_CATALOG) as ProviderType[];

export interface ModelChoice {
  provider: ProviderType;
  model: string;
  temperature: number;
}

export const DEFAULT_CHOICE: ModelChoice = { provider: 'anthropic', model: 'claude-sonnet-4-6', temperature: 0.7 };
