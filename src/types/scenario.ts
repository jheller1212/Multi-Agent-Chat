/** Scenario type definitions for the multi-agent research platform. */

export interface ScenarioAgent {
  name: string;
  description: string;
  defaultPromptTemplate: string;
}

export interface SupervisorDefinition {
  name: string;
  type: 'classifier' | 'extractor' | 'appraiser';
  timing: 'per_round' | 'post_termination';
  outputSchema: Record<string, unknown>;
  promptTemplate: string;
}

export interface TurnPolicy {
  type: 'alternating' | 'round_robin' | 'mediator_led' | 'structured_sequence';
  roundDefinition: string[];
  config?: Record<string, unknown>;
}

export type TerminationCondition =
  | {
      type: 'supervisor_classification';
      supervisorName: string;
      terminalValues: string[];
    }
  | {
      type: 'turn_cap';
      maxTurns: number;
    };

export interface OutcomeColumn {
  name: string;
  type: 'string' | 'integer' | 'float';
  nullable?: boolean;
}

export interface OutcomeSchema {
  columns: OutcomeColumn[];
  utilityFunction?: 'weighted_sum' | 'single_binary' | 'multi_class' | 'custom';
  utilityConfig?: Record<string, unknown>;
}

export interface Scenario {
  id: string;
  userId: string;
  name: string;
  description: string;
  isPublic: boolean;
  isTemplate: boolean;
  domainAgents: ScenarioAgent[];
  supervisors: SupervisorDefinition[];
  turnPolicy: TurnPolicy;
  terminationConditions: TerminationCondition[];
  outcomeSchema: OutcomeSchema;
  /** Default values for prompt template placeholders (e.g., {TARGET_PRICE}). Experiment params override these. */
  defaultParams?: Record<string, string | number>;
  /** Version of the built-in template this scenario was seeded from (template rows only). */
  templateVersion?: number;
  createdAt: string;
  updatedAt: string;
}
