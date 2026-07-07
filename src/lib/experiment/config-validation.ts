import type { ProviderType } from '../../types';
import type { AgentAssignment, FactorDefinition } from '../../types/experiment';
import type { ScenarioAgent } from '../../types/scenario';
import { enumerateCells } from './cell-enumerator';

export interface ResolvedMapping {
  provider: ProviderType;
  model: string;
  temperature: number;
}

/**
 * Resolve the provider/model mapping for one agent in one cell.
 * factorMappings keys are "factorName=level" (e.g., "buyer_capability=strong");
 * a legacy plain-factor-name key matches any level of that factor.
 * Returns null when no mapping matches the cell.
 */
export function resolveFactorMapping(
  assignment: AgentAssignment | undefined,
  cellFactors: Record<string, string>,
): ResolvedMapping | null {
  if (!assignment) return null;

  for (const [key, mapping] of Object.entries(assignment.factorMappings)) {
    const eqIdx = key.indexOf('=');
    if (eqIdx === -1) {
      // Legacy: treat key as a plain factor name
      if (cellFactors[key] !== undefined) return mapping;
    } else {
      const factorName = key.slice(0, eqIdx);
      const factorLevel = key.slice(eqIdx + 1);
      if (cellFactors[factorName] === factorLevel) return mapping;
    }
  }

  return null;
}

/**
 * Validate that every enumerated cell has a provider/model mapping for every
 * domain agent. Returns a list of human-readable errors (empty = valid).
 *
 * Zero factors are rejected: the launcher UI disables launch when no factors
 * are defined, so a zero-factor config can only come from a malformed
 * definition — there is no way to attach a factorMapping to the synthetic
 * "default" cell, so we fail with a clear message instead of supporting it.
 */
export function validateAgentAssignments(
  factors: FactorDefinition[],
  domainAgents: readonly Pick<ScenarioAgent, 'name'>[],
  assignments: AgentAssignment[],
): string[] {
  const errors: string[] = [];

  if (factors.length === 0) {
    return [
      'Experiment has no factors. Define at least one factor with two or more levels — ' +
      'zero-factor (single default cell) runs are not supported.',
    ];
  }

  const cells = enumerateCells(factors);

  for (const agent of domainAgents) {
    const assignment = assignments.find(a => a.agentName === agent.name);

    if (!assignment) {
      errors.push(
        `No model assignment for agent "${agent.name}". Every domain agent needs a provider/model assignment before launch.`,
      );
      continue;
    }

    for (const cell of cells) {
      if (!resolveFactorMapping(assignment, cell.factors)) {
        const cellDesc = Object.entries(cell.factors).map(([k, v]) => `${k}=${v}`).join(', ');
        errors.push(
          `No provider/model mapping for agent "${agent.name}" in cell (${cellDesc}). ` +
          `Add a factorMapping for this cell to the experiment's agent assignments.`,
        );
      }
    }
  }

  return errors;
}
