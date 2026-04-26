import { APIProvider, APIConfig, APIResponse, APIError } from '../types';

const REQUEST_TIMEOUT_MS = 30_000;

export class GeminiProvider implements APIProvider {
  async makeRequest(config: APIConfig, messages: Array<{role: string; content: string}>, signal?: AbortSignal): Promise<APIResponse> {
    const systemText = messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n');

    const chatMessages = messages.filter(m => m.role !== 'system');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    let response: Response;
    try {
      // API key goes in a header, not the URL, to avoid it appearing in logs/history
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`,
        {
          signal: controller.signal,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': config.apiKey
          },
          body: JSON.stringify({
            contents: chatMessages.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }]
            })),
            ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
            generationConfig: {
              temperature: config.temperature,
              maxOutputTokens: config.maxTokens
            }
          })
        }
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const body = await response.text();
      let message = 'Gemini API request failed';
      try { message = JSON.parse(body).error?.message ?? message; } catch { /* non-JSON body */ }
      const retryAfterRaw = response.headers.get('Retry-After');
      const retryAfter = retryAfterRaw ? Number(retryAfterRaw) : undefined;
      throw new APIError(message, response.status, retryAfter);
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof content !== 'string') throw new Error('Unexpected response format from Gemini');

    return { content };
  }
}
