import type { ExtractorResult, SupervisorOutput } from '../../types/agents';
import { BaseAgent, type AgentMessage } from './agent';

export interface ExtractorContext {
  transcript: readonly { agentName: string; content: string }[];
  afterTurn: number;
  /** Slot values to substitute into the supervisor prompt. */
  promptSlots?: Record<string, string>;
}

/**
 * ExtractorAgent: a supervisor that extracts structured data from messages.
 * Used for: analyst (price, payment terms, delivery, warranty), argument analyst, etc.
 * Returns parsed JSON validated against the scenario's output schema.
 */
export class ExtractorAgent extends BaseAgent {
  /** Expected keys in the output JSON. Used for validation. */
  private readonly expectedKeys: readonly string[];

  constructor(
    config: ConstructorParameters<typeof BaseAgent>[0] & { expectedKeys?: string[] },
  ) {
    super(config);
    this.expectedKeys = config.expectedKeys ?? [];
  }

  async extract(context: ExtractorContext): Promise<{ result: ExtractorResult; output: SupervisorOutput }> {
    const prompt = this.renderPrompt(context.promptSlots);
    const messages: AgentMessage[] = [
      { role: 'system', content: prompt },
      { role: 'user', content: this.buildContextMessage(context) },
    ];

    const response = await this.generate(messages);
    const parsed = this.parseExtraction(response.content);

    const result: ExtractorResult = {
      parsed,
      rawResponse: response.content,
    };

    const output: SupervisorOutput = {
      afterTurn: context.afterTurn,
      supervisorName: this.name,
      outputType: 'extraction',
      parsed,
      rawResponse: response.content,
    };

    return { result, output };
  }

  private renderPrompt(slots?: Record<string, string>): string {
    if (!slots) return this.systemPrompt;
    let prompt = this.systemPrompt;
    for (const [key, value] of Object.entries(slots)) {
      prompt = prompt.replaceAll(`{${key}}`, value);
    }
    return prompt;
  }

  private buildContextMessage(context: ExtractorContext): string {
    const recent = context.transcript.slice(-2);
    return recent.map(m => `${m.agentName}: ${m.content}`).join('\n\n');
  }

  private parseExtraction(raw: string): Record<string, unknown> {
    // Try to extract JSON from the response (may be wrapped in markdown code blocks)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    try {
      const obj = JSON.parse(jsonMatch[0]);
      if (typeof obj === 'object' && obj !== null) return obj;
    } catch {
      // Parse failure
    }

    return {};
  }
}
