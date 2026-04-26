import type { TurnPolicy, TurnPolicyState, TurnPolicyResult } from './types';

/**
 * Alternating turn policy: agents take turns in the order defined by roundDefinition.
 * A round completes when every agent in the roundDefinition has spoken once.
 * Used by: Procurement Negotiation (buyer, seller).
 */
export class AlternatingPolicy implements TurnPolicy {
  private positionInRound = 0;

  selectNext(state: TurnPolicyState): TurnPolicyResult {
    const { roundDefinition } = state;
    if (roundDefinition.length === 0) {
      throw new Error('AlternatingPolicy: roundDefinition must not be empty');
    }

    const nextAgent = roundDefinition[this.positionInRound];
    this.positionInRound = (this.positionInRound + 1) % roundDefinition.length;
    const roundComplete = this.positionInRound === 0;

    return { nextAgent, roundComplete };
  }

  reset(): void {
    this.positionInRound = 0;
  }
}
