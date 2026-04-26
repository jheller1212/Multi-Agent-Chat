/** Turn policy interface and types for the conversation orchestrator. */

export interface TurnPolicyState {
  /** Names of all domain agents in the scenario. */
  agentNames: readonly string[];
  /** Messages produced so far (agent name per turn). */
  turnHistory: readonly string[];
  /** The round definition from the scenario (agent names per round). */
  roundDefinition: readonly string[];
}

export interface TurnPolicyResult {
  /** The name of the next agent to speak. */
  nextAgent: string;
  /** Whether a full round just completed (triggers per-round supervisors). */
  roundComplete: boolean;
}

export interface TurnPolicy {
  /** Select the next agent to speak given the current state. */
  selectNext(state: TurnPolicyState): TurnPolicyResult;
  /** Reset any internal state (called at the start of each dyad). */
  reset(): void;
}
