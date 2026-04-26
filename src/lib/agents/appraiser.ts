import type { AppraisalResult, SupervisorOutput } from '../../types/agents';
import { BaseAgent, type AgentMessage } from './agent';

export interface AppraisalContext {
  transcript: readonly { agentName: string; content: string }[];
  /** The role perspective to appraise from (e.g., "buyer", "seller"). */
  perspectiveRole: string;
  /** Summary of the negotiation outcome. */
  outcomeSummary: string;
  /** Slot values to substitute into the supervisor prompt. */
  promptSlots?: Record<string, string>;
}

/**
 * AppraiserAgent: a supervisor that rates the conversation post-termination.
 * Used for: SVI scoring (procurement), persuasiveness appraiser (legal),
 * fairness appraiser (mediation), etc.
 * Returns structured ratings as a Record<string, number>.
 */
export class AppraiserAgent extends BaseAgent {
  /** Expected rating keys (e.g., svi_1 through svi_18). */
  private readonly ratingKeys: readonly string[];
  /** Valid rating range. */
  private readonly minRating: number;
  private readonly maxRating: number;

  constructor(
    config: ConstructorParameters<typeof BaseAgent>[0] & {
      ratingKeys?: string[];
      minRating?: number;
      maxRating?: number;
    },
  ) {
    super(config);
    this.ratingKeys = config.ratingKeys ?? [];
    this.minRating = config.minRating ?? 1;
    this.maxRating = config.maxRating ?? 7;
  }

  async appraise(context: AppraisalContext): Promise<{ result: AppraisalResult; output: SupervisorOutput }> {
    const prompt = this.renderPrompt(context);
    const transcriptText = context.transcript
      .map(m => `${m.agentName}: ${m.content}`)
      .join('\n\n');

    const messages: AgentMessage[] = [
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: `Full transcript:\n${transcriptText}\n\nOutcome summary: ${context.outcomeSummary}`,
      },
    ];

    const response = await this.generate(messages);
    const ratings = this.parseRatings(response.content);

    const result: AppraisalResult = {
      ratings,
      rawResponse: response.content,
    };

    const output: SupervisorOutput = {
      afterTurn: -1, // post-termination
      supervisorName: this.name,
      outputType: 'appraisal',
      parsed: ratings as Record<string, unknown>,
      rawResponse: response.content,
    };

    return { result, output };
  }

  private renderPrompt(context: AppraisalContext): string {
    let prompt = this.systemPrompt;
    const slots: Record<string, string> = {
      ROLE: context.perspectiveRole,
      OUTCOME_SUMMARY: context.outcomeSummary,
      ...context.promptSlots,
    };
    for (const [key, value] of Object.entries(slots)) {
      prompt = prompt.replaceAll(`{${key}}`, value);
    }
    return prompt;
  }

  private parseRatings(raw: string): Record<string, number> {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    try {
      const obj = JSON.parse(jsonMatch[0]);
      if (typeof obj !== 'object' || obj === null) return {};

      const ratings: Record<string, number> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'number') {
          ratings[key] = Math.max(this.minRating, Math.min(this.maxRating, Math.round(value)));
        }
      }
      return ratings;
    } catch {
      return {};
    }
  }
}
