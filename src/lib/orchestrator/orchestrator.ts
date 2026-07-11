import type { AgentConfig, TranscriptMessage, SupervisorOutput } from '../../types/agents';
import type { Scenario, SupervisorDefinition } from '../../types/scenario';
import type { TurnPolicy, TurnPolicyState } from './policies/types';
import { createTurnPolicy } from './policy-factory';
import { checkTermination } from './termination';

/** Callback to generate a message from a domain agent. Provided by the caller. */
export type GenerateMessageFn = (
  agentConfig: AgentConfig,
  transcript: readonly TranscriptMessage[],
  signal?: AbortSignal,
) => Promise<TranscriptMessage>;

/** Callback to run a supervisor agent. Provided by the caller. */
export type RunSupervisorFn = (
  supervisor: SupervisorDefinition,
  agentConfig: AgentConfig,
  transcript: readonly TranscriptMessage[],
  signal?: AbortSignal,
) => Promise<SupervisorOutput>;

/** Callback invoked after each turn with the latest state. */
export type OnTurnCallback = (
  message: TranscriptMessage,
  transcript: readonly TranscriptMessage[],
  supervisorOutputs: readonly SupervisorOutput[],
) => void;

/** Callback invoked when a round completes. */
export type OnRoundCallback = (
  roundNumber: number,
  supervisorOutputs: readonly SupervisorOutput[],
) => void;

export interface OrchestratorConfig {
  scenario: Scenario;
  agentConfigs: Map<string, AgentConfig>;
  supervisorConfigs: Map<string, AgentConfig>;
  generateMessage: GenerateMessageFn;
  runSupervisor: RunSupervisorFn;
  onTurn?: OnTurnCallback;
  onRound?: OnRoundCallback;
  signal?: AbortSignal;
}

export interface OrchestratorResult {
  transcript: TranscriptMessage[];
  supervisorOutputs: SupervisorOutput[];
  terminationReason: string;
  terminationTurn: number;
  totalTurns: number;
}

/**
 * ConversationOrchestrator: runs a multi-agent conversation following a scenario's
 * turn policy, termination conditions, and supervisor configuration.
 *
 * The orchestrator is agnostic to providers — it delegates message generation
 * and supervisor execution to caller-provided functions.
 */
export class ConversationOrchestrator {
  private readonly turnPolicy: TurnPolicy;
  private readonly scenario: Scenario;
  private readonly agentConfigs: Map<string, AgentConfig>;
  private readonly supervisorConfigs: Map<string, AgentConfig>;
  private readonly generateMessage: GenerateMessageFn;
  private readonly runSupervisor: RunSupervisorFn;
  private readonly onTurn?: OnTurnCallback;
  private readonly onRound?: OnRoundCallback;
  private readonly signal?: AbortSignal;

  constructor(config: OrchestratorConfig) {
    this.scenario = config.scenario;
    this.agentConfigs = config.agentConfigs;
    this.supervisorConfigs = config.supervisorConfigs;
    this.generateMessage = config.generateMessage;
    this.runSupervisor = config.runSupervisor;
    this.onTurn = config.onTurn;
    this.onRound = config.onRound;
    this.signal = config.signal;
    this.turnPolicy = createTurnPolicy(this.scenario.turnPolicy);
  }

  async run(): Promise<OrchestratorResult> {
    this.turnPolicy.reset();

    const transcript: TranscriptMessage[] = [];
    const supervisorOutputs: SupervisorOutput[] = [];
    let currentTurn = 0;
    let roundNumber = 0;
    let terminationReason = 'unknown';

    const policyState: TurnPolicyState = {
      agentNames: this.scenario.domainAgents.map(a => a.name),
      turnHistory: [],
      roundDefinition: this.scenario.turnPolicy.roundDefinition,
    };

    while (true) {
      if (this.signal?.aborted) {
        terminationReason = 'aborted';
        break;
      }

      // Check turn cap before generating a new message
      const turnCapCheck = checkTermination(
        this.scenario.terminationConditions,
        currentTurn,
        supervisorOutputs,
      );
      if (turnCapCheck.shouldTerminate) {
        terminationReason = turnCapCheck.reason ?? 'turn_cap';
        break;
      }

      // Select next agent
      const { nextAgent, roundComplete } = this.turnPolicy.selectNext(policyState);

      const agentConfig = this.agentConfigs.get(nextAgent);
      if (!agentConfig) {
        throw new Error(`No agent config found for "${nextAgent}"`);
      }

      // Generate message
      currentTurn++;
      const message = await this.generateMessage(agentConfig, transcript, this.signal);
      transcript.push(message);
      (policyState.turnHistory as string[]).push(nextAgent);

      this.onTurn?.(message, transcript, supervisorOutputs);

      // If a round just completed, run per-round supervisors
      if (roundComplete) {
        roundNumber++;
        const perRoundSupervisors = this.scenario.supervisors.filter(
          s => s.timing === 'per_round',
        );

        for (const supervisor of perRoundSupervisors) {
          if (this.signal?.aborted) break;

          const supervisorConfig = this.supervisorConfigs.get(supervisor.name);
          if (!supervisorConfig) {
            throw new Error(`No supervisor config found for "${supervisor.name}"`);
          }

          const output = await this.runSupervisor(
            supervisor,
            supervisorConfig,
            transcript,
            this.signal,
          );
          supervisorOutputs.push(output);
        }

        this.onRound?.(roundNumber, supervisorOutputs);

        // Check termination after supervisors run
        const postRoundCheck = checkTermination(
          this.scenario.terminationConditions,
          currentTurn,
          supervisorOutputs,
        );
        if (postRoundCheck.shouldTerminate) {
          terminationReason = postRoundCheck.reason ?? 'supervisor';
          break;
        }
      }
    }

    // Run post-termination supervisors
    const postTerminationSupervisors = this.scenario.supervisors.filter(
      s => s.timing === 'post_termination',
    );

    for (const supervisor of postTerminationSupervisors) {
      if (this.signal?.aborted) break;

      const supervisorConfig = this.supervisorConfigs.get(supervisor.name);
      if (!supervisorConfig) {
        throw new Error(`No supervisor config found for "${supervisor.name}"`);
      }

      const output = await this.runSupervisor(
        supervisor,
        supervisorConfig,
        transcript,
        this.signal,
      );
      supervisorOutputs.push(output);
    }

    return {
      transcript,
      supervisorOutputs,
      terminationReason,
      terminationTurn: currentTurn,
      totalTurns: currentTurn,
    };
  }
}
