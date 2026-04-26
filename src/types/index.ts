export type AIModel = 'gpt4' | 'claude' | 'gemini' | 'mistral';

/** Provider identifier for the multi-agent research platform (superset of AIModel). */
export type ProviderType = 'anthropic' | 'openai' | 'google' | 'mistral' | 'meta' | 'alibaba';

export interface ModelConfig {
  apiKey: string;
  orgId?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface Message {
  id: string;
  role: 'system' | 'assistant' | 'user';
  content: string;
  timestamp: number;
  model?: AIModel;
  modelVersion?: string;
  temperature?: number;
  systemPrompt?: string;
  conversationId?: string;
  wordCount?: number;
  timeTaken?: number;
  hidden?: boolean;
  botIndex?: 1 | 2;
  repetitionNumber?: number; // 0-indexed repetition within a run
}

export interface ChatConfig {
  model: AIModel;
  apiKey: string;
  orgId?: string;
  modelVersion: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}