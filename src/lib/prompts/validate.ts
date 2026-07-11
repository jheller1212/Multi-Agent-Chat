import { extractSlotNames, validateRendered } from './template-engine';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate that a rendered prompt has no unfilled slots.
 */
export function validatePrompt(rendered: string, agentName: string): ValidationResult {
  const unfilled = validateRendered(rendered);
  if (unfilled.length === 0) {
    return { valid: true, errors: [] };
  }
  return {
    valid: false,
    errors: unfilled.map(slot => `${agentName}: unfilled slot {${slot}}`),
  };
}

/**
 * Validate that all required slots for a template are present in the context.
 */
export function validateSlotCoverage(
  template: string,
  providedSlots: Record<string, string | number>,
  _activeBlocks: string[],
): ValidationResult {
  const allSlots = extractSlotNames(template);
  const missing = allSlots.filter(slot => !(slot in providedSlots));

  if (missing.length === 0) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: missing.map(slot => `Missing slot value: {${slot}}`),
  };
}
