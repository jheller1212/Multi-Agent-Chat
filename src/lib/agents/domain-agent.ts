import type { TranscriptMessage } from '../../types/agents';
import { BaseAgent } from './agent';

/**
 * DomainAgent: a participant in the conversation (buyer, seller, lawyer, mediator, etc.).
 * Generates free-text messages based on its system prompt and the conversation transcript.
 */
export class DomainAgent extends BaseAgent {
  /**
   * Generate the next message in the conversation.
   * Returns a TranscriptMessage ready to append to the transcript.
   */
  async generateMessage(
    transcript: readonly TranscriptMessage[],
    currentTurn: number,
    signal?: AbortSignal,
  ): Promise<TranscriptMessage> {
    const messages = this.buildMessagesFromTranscript(transcript);
    const response = await this.generate(messages, signal);

    return {
      turn: currentTurn,
      agentName: this.name,
      content: response.content,
      provider: this.provider,
      model: this.model,
      tokenUsage: response.tokenUsage,
      timeTakenMs: response.timeTakenMs,
      wordCount: response.content.trim().split(/\s+/).filter(Boolean).length,
      createdAt: new Date().toISOString(),
    };
  }
}
