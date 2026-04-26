import { APIProvider, APIConfig, APIResponse, APIError } from '../types';

const REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';

/**
 * Alibaba (Qwen) provider. OpenAI-compatible chat completions endpoint via DashScope.
 * Supports configurable baseUrl for pointing to different hosting providers.
 */
export class AlibabaProvider implements APIProvider {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? DEFAULT_BASE_URL;
  }

  async makeRequest(
    config: APIConfig,
    messages: Array<{ role: string; content: string }>,
    signal?: AbortSignal,
  ): Promise<APIResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    let response: Response;
    try {
      response = await fetch(this.baseUrl, {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const body = await response.text();
      let message = 'Alibaba API request failed';
      try {
        message = JSON.parse(body).error?.message ?? message;
      } catch {
        /* non-JSON body */
      }
      const retryAfterRaw = response.headers.get('Retry-After');
      const retryAfter = retryAfterRaw ? Number(retryAfterRaw) : undefined;
      throw new APIError(message, response.status, retryAfter);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('Unexpected response format from Alibaba API');

    return { content, usage: data.usage };
  }
}
