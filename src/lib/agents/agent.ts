import type { AgentConfig, TranscriptMessage } from '../../types/agents';
import type { ProviderType } from '../../types';
import type { APIResponse } from '../api/types';
import { createProviderByType } from '../api/factory';
import { withRetry } from '../api/retry';

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  content: string;
  tokenUsage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  timeTakenMs: number;
}

/**
 * Base agent class. Wraps a provider + model configuration and generates messages.
 * Used by both domain agents and supervisor agents.
 */
export class BaseAgent {
  readonly name: string;
  readonly role: 'domain' | 'supervisor';
  readonly provider: ProviderType;
  readonly model: string;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly systemPrompt: string;
  private readonly apiKey: string;
  private readonly runtime: 'browser' | 'node';
  private readonly baseUrl?: string;

  constructor(config: AgentConfig & { apiKey: string; runtime?: 'browser' | 'node'; baseUrl?: string }) {
    this.name = config.name;
    this.role = config.role;
    this.provider = config.provider;
    this.model = config.model;
    this.temperature = config.temperature;
    this.maxTokens = config.maxTokens;
    this.systemPrompt = config.systemPrompt;
    this.apiKey = config.apiKey;
    this.runtime = config.runtime ?? 'browser';
    this.baseUrl = config.baseUrl;
  }

  /**
   * Generate a response given conversation history.
   * Handles provider creation, message formatting, and retry logic.
   */
  async generate(messages: AgentMessage[], signal?: AbortSignal): Promise<AgentResponse> {
    const provider = createProviderByType(this.provider, {
      runtime: this.runtime,
      baseUrl: this.baseUrl,
    });

    const startTime = Date.now();

    const result: APIResponse = await withRetry(
      () => provider.makeRequest(
        {
          apiKey: this.apiKey,
          model: this.model,
          temperature: this.temperature,
          maxTokens: this.maxTokens,
        },
        messages.map(m => ({ role: m.role, content: m.content })),
        signal,
      ),
      { maxAttempts: 3, signal },
    );

    return {
      content: result.content,
      tokenUsage: result.usage,
      timeTakenMs: Date.now() - startTime,
    };
  }

  /**
   * Build the message array for a domain agent from a transcript.
   * The agent sees its own messages as 'assistant' and all others as 'user'.
   */
  buildMessagesFromTranscript(transcript: readonly TranscriptMessage[]): AgentMessage[] {
    const messages: AgentMessage[] = [
      { role: 'system', content: this.systemPrompt },
    ];

    for (const msg of transcript) {
      messages.push({
        role: msg.agentName === this.name ? 'assistant' : 'user',
        content: msg.content,
      });
    }

    return messages;
  }
}
