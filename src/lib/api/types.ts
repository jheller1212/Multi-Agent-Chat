export interface APIResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface APIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
}

export interface APIConfig {
  apiKey: string;
  orgId?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface APIProvider {
  makeRequest: (config: APIConfig, messages: Array<{role: string; content: string}>, signal?: AbortSignal) => Promise<APIResponse>;
}

/** Error thrown by providers when the HTTP response is not OK. */
export class APIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    /** Seconds to wait before retrying, from the Retry-After header (if present). */
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'APIError';
  }
}