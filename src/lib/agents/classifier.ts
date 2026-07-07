import type { ClassifierResult, SupervisorOutput } from '../../types/agents';
import { BaseAgent, type AgentMessage } from './agent';

export interface ClassifierContext {
  transcript: readonly { agentName: string; content: string }[];
  afterTurn: number;
  /** Slot values to substitute into the supervisor prompt (e.g., LATEST_BUYER_MESSAGE). */
  promptSlots?: Record<string, string>;
}

/**
 * ClassifierAgent: a supervisor that classifies the conversation state.
 * Used for: judge (ACCEPTANCE/REJECTION/CONTINUE), verdict classifier, etc.
 * Returns a classification string validated against allowedValues.
 */
export class ClassifierAgent extends BaseAgent {
  private readonly allowedValues: readonly string[];

  constructor(
    config: ConstructorParameters<typeof BaseAgent>[0] & { allowedValues: string[] },
  ) {
    super(config);
    this.allowedValues = config.allowedValues;
  }

  async classify(context: ClassifierContext): Promise<{ result: ClassifierResult; output: SupervisorOutput }> {
    const prompt = this.renderPrompt(context.promptSlots);
    const messages: AgentMessage[] = [
      { role: 'system', content: prompt },
      { role: 'user', content: this.buildContextMessage(context) },
    ];

    const response = await this.generate(messages);
    const parsed = this.parseClassification(response.content);

    const result: ClassifierResult = {
      classification: parsed,
      rawResponse: response.content,
    };

    const output: SupervisorOutput = {
      afterTurn: context.afterTurn,
      supervisorName: this.name,
      outputType: 'classification',
      parsed: { classification: parsed },
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

  private buildContextMessage(context: ClassifierContext): string {
    const recent = context.transcript.slice(-4);
    return recent.map(m => `${m.agentName}: ${m.content}`).join('\n\n');
  }

  private parseClassification(raw: string): string {
    // Try JSON parse first
    try {
      const obj = JSON.parse(raw.trim());
      const value = obj.status ?? obj.classification ?? obj.verdict;
      if (typeof value === 'string' && this.allowedValues.includes(value.toUpperCase())) {
        return value.toUpperCase();
      }
    } catch {
      // Not JSON — try to find an allowed value in the raw text
    }

    const upper = raw.toUpperCase();
    for (const val of this.allowedValues) {
      if (upper.includes(val)) return val;
    }

    // Unparseable response: prefer the non-terminal CONTINUE if allowed, so a
    // garbled classifier reply never terminates a run.
    // NOTE: this previously returned the LAST allowed value, which made the
    // schema's enum ordering load-bearing (templates happened to list
    // CONTINUE last). The positional fallback remains only for schemas
    // without a CONTINUE value.
    if (this.allowedValues.includes('CONTINUE')) return 'CONTINUE';
    return this.allowedValues[this.allowedValues.length - 1] ?? 'UNKNOWN';
  }
}
