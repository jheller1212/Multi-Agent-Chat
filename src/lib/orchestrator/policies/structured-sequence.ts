import type { TurnPolicy, TurnPolicyState, TurnPolicyResult } from './types';

/**
 * Structured sequence policy: agents follow a fixed sequence that may include
 * repeated agents and non-uniform orderings.
 * A round completes when the full sequence has been traversed once.
 * Used by: Legal Advocacy (plaintiff -> defense -> judge interjection -> closings -> ruling).
 */
export class StructuredSequencePolicy implements TurnPolicy {
  private positionInSequence = 0;

  selectNext(state: TurnPolicyState): TurnPolicyResult {
    const { roundDefinition } = state;
    if (roundDefinition.length === 0) {
      throw new Error('StructuredSequencePolicy: roundDefinition must not be empty');
    }

    const nextAgent = roundDefinition[this.positionInSequence];
    this.positionInSequence = (this.positionInSequence + 1) % roundDefinition.length;
    const roundComplete = this.positionInSequence === 0;

    return { nextAgent, roundComplete };
  }

  reset(): void {
    this.positionInSequence = 0;
  }
}
