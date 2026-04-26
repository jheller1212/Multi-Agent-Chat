import type { ProviderType } from './index';

export interface FactorDefinition {
  name: string;
  levels: string[];
}

export interface AgentAssignment {
  agentName: string;
  factorMappings: Record<string, {
    provider: ProviderType;
    model: string;
    temperature: number;
  }>;
}

export interface SupervisorConfig {
  provider: ProviderType;
  model: string;
  temperature: number;
}

export interface ExperimentDefinition {
  id?: string;
  scenarioId: string;
  name: string;
  description: string;
  version: string;

  factors: FactorDefinition[];
  targetNPerCell: number;
  bufferPercent: number;

  agentAssignments: AgentAssignment[];

  /** Scenario-specific parameters (e.g., maxTurns, listPrice, budgetLevels, issueWeights). */
  params: Record<string, unknown>;

  /** Override default supervisor models if needed. */
  supervisors?: Record<string, SupervisorConfig>;

  concurrency: number;
  devMode: boolean;
}

export interface ExperimentRun {
  id: string;
  experimentId: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  configSnapshot: ExperimentDefinition;
  promptHashes: Record<string, string>;
  startedAt: string;
  completedAt?: string;
  progress: {
    total: number;
    completed: number;
    failed: number;
    excluded: number;
  };
}

export interface DyadRecord {
  id: string;
  runId: string;
  cellLabel: string;
  dyadIndex: number;
  seed: number;
  factors: Record<string, string>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'excluded';
  terminationReason?: string;
  terminationTurn?: number;
  failureReason?: string;
  exclusionReason?: string;
  startedAt?: string;
  completedAt?: string;
}
