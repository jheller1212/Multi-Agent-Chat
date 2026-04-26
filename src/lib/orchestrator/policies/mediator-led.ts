import type { TurnPolicy, TurnPolicyState, TurnPolicyResult } from './types';

/**
 * Mediator-led turn policy: a designated mediator (first in roundDefinition)
 * speaks after every other agent, rotating through the remaining agents.
 *
 * Pattern: mediator -> agentA -> mediator -> agentB -> mediator -> agentA -> ...
 * A round completes after each non-mediator agent has spoken once (with mediator
 * interjections between each).
 *
 * Used by: Mediation scenario (Mediator, Disputant A, Disputant B).
 */
export class MediatorLedPolicy implements TurnPolicy {
  private stepIndex = 0;

  selectNext(state: TurnPolicyState): TurnPolicyResult {
    const { roundDefinition } = state;
    if (roundDefinition.length < 2) {
      throw new Error('MediatorLedPolicy: roundDefinition must have at least 2 agents (mediator + 1 participant)');
    }

    const mediator = roundDefinition[0];
    const participants = roundDefinition.slice(1);
    const stepsPerRound = participants.length * 2;

    const isMediatorTurn = this.stepIndex % 2 === 0;
    const participantIndex = Math.floor(this.stepIndex / 2) % participants.length;

    const nextAgent = isMediatorTurn ? mediator : participants[participantIndex];
    this.stepIndex = (this.stepIndex + 1) % stepsPerRound;
    const roundComplete = this.stepIndex === 0;

    return { nextAgent, roundComplete };
  }

  reset(): void {
    this.stepIndex = 0;
  }
}
