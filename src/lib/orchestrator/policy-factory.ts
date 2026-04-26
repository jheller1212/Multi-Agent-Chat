import type { TurnPolicy as ScenarioTurnPolicy } from '../../types/scenario';
import type { TurnPolicy } from './policies/types';
import { AlternatingPolicy } from './policies/alternating';
import { StructuredSequencePolicy } from './policies/structured-sequence';
import { MediatorLedPolicy } from './policies/mediator-led';

/**
 * Creates a TurnPolicy instance from a scenario's turn policy configuration.
 * round_robin uses the same implementation as alternating (agents cycle in order).
 */
export function createTurnPolicy(config: ScenarioTurnPolicy): TurnPolicy {
  switch (config.type) {
    case 'alternating':
    case 'round_robin':
      return new AlternatingPolicy();
    case 'structured_sequence':
      return new StructuredSequencePolicy();
    case 'mediator_led':
      return new MediatorLedPolicy();
    default: {
      const _exhaustive: never = config.type;
      throw new Error(`Unknown turn policy type: ${_exhaustive}`);
    }
  }
}
