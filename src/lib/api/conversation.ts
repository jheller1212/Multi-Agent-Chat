import { Message, ChatConfig } from '../../types';
import { createProvider } from './factory';
import { withRetry } from './retry';

export async function generateResponse(
  config: ChatConfig,
  messages: Message[],
  signal?: AbortSignal
): Promise<Message> {
  const startTime = Date.now();
  const provider = createProvider(config.model);

  const apiMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  const result = await withRetry(
    () => provider.makeRequest({
      apiKey: config.apiKey,
      orgId: config.orgId,
      model: config.modelVersion,
      temperature: config.temperature,
      maxTokens: config.maxTokens
    }, apiMessages, signal),
    { maxAttempts: 3, signal },
  );

  const timeTaken = Date.now() - startTime;
  const wordCount = result.content.trim().split(/\s+/).filter(Boolean).length;

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    model: config.model,
    content: result.content,
    timestamp: Date.now(),
    wordCount,
    timeTaken
  };
}
