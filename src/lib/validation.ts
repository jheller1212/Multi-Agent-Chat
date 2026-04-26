import { AIModel, ModelConfig } from '../types';

const API_KEY_PATTERNS: Record<AIModel, { prefix: string; pattern: RegExp } | null> = {
  gpt4:    { prefix: 'sk-',     pattern: /^sk-/ },
  claude:  { prefix: 'sk-ant-', pattern: /^sk-ant-/ },
  gemini:  { prefix: 'AIza',    pattern: /^AIza/ },
  mistral: null, // no known fixed prefix
};

export function validateApiKey(apiKey: string, model?: AIModel): boolean {
  const key = apiKey.trim();
  if (key.length <= 10) return false;
  if (model) {
    const rule = API_KEY_PATTERNS[model];
    if (rule && !rule.pattern.test(key)) return false;
  }
  return true;
}

export function validateModelConfig(model: AIModel, config: Partial<ModelConfig>): string[] {
  const errors: string[] = [];

  if (!config.apiKey || !validateApiKey(config.apiKey, model)) {
    const rule = API_KEY_PATTERNS[model];
    const hint = rule ? ` (should start with "${rule.prefix}")` : '';
    errors.push(`Valid API key is required for ${getModelLabel(model)}${hint}`);
  }

  if (config.temperature !== undefined) {
    if (config.temperature < 0 || config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }
  }

  if (config.maxTokens !== undefined) {
    if (config.maxTokens < 1) {
      errors.push('Max tokens must be at least 1');
    }
    if (config.maxTokens > 200_000) {
      errors.push('Max tokens cannot exceed 200,000');
    }
  }

  return errors;
}

export function getModelLabel(model: AIModel): string {
  switch (model) {
    case 'gpt4': return 'OpenAI';
    case 'claude': return 'Anthropic Claude';
    case 'gemini': return 'Google Gemini';
    case 'mistral': return 'Mistral';
    default: return model;
  }
}
