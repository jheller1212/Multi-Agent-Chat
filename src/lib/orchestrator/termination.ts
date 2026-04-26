import type { TerminationCondition } from '../../types/scenario';
import type { SupervisorOutput } from '../../types/agents';

export interface TerminationCheckResult {
  shouldTerminate: boolean;
  reason?: string;
}

/**
 * Evaluates termination conditions against the current state.
 * Called after each round (when supervisor results are available) and after each turn (for turn cap).
 */
export function checkTermination(
  conditions: readonly TerminationCondition[],
  currentTurn: number,
  supervisorOutputs: readonly SupervisorOutput[],
): TerminationCheckResult {
  for (const condition of conditions) {
    switch (condition.type) {
      case 'turn_cap': {
        if (currentTurn >= condition.maxTurns) {
          return { shouldTerminate: true, reason: `turn_cap:${condition.maxTurns}` };
        }
        break;
      }
      case 'supervisor_classification': {
        const latestClassification = findLatestClassification(
          supervisorOutputs,
          condition.supervisorName,
        );
        if (
          latestClassification !== null &&
          condition.terminalValues.includes(latestClassification)
        ) {
          return {
            shouldTerminate: true,
            reason: `supervisor:${condition.supervisorName}:${latestClassification}`,
          };
        }
        break;
      }
    }
  }

  return { shouldTerminate: false };
}

function findLatestClassification(
  outputs: readonly SupervisorOutput[],
  supervisorName: string,
): string | null {
  for (let i = outputs.length - 1; i >= 0; i--) {
    const output = outputs[i];
    if (
      output.supervisorName === supervisorName &&
      output.outputType === 'classification' &&
      typeof output.parsed['classification'] === 'string'
    ) {
      return output.parsed['classification'];
    }
  }
  return null;
}
