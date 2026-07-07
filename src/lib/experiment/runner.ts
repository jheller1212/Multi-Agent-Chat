import type { AgentConfig, TranscriptMessage, SupervisorOutput } from '../../types/agents';
import type { ExperimentDefinition, DyadRecord } from '../../types/experiment';
import type { Scenario } from '../../types/scenario';
import type { ProviderType } from '../../types';
import type { OrchestratorResult } from '../orchestrator/orchestrator';
import { ConversationOrchestrator } from '../orchestrator/orchestrator';
import { DomainAgent } from '../agents/domain-agent';
import { ClassifierAgent } from '../agents/classifier';
import { ExtractorAgent } from '../agents/extractor';
import { AppraiserAgent } from '../agents/appraiser';
import { enumerateCells } from './cell-enumerator';
import { resolveFactorMapping, validateAgentAssignments } from './config-validation';
import { buildSupervisorAgents, resolveSupervisorDefault } from './supervisor-factory';
import { getExperimentProgress, updateExperimentProgress } from './progress';
import { supabase } from '../supabase';

// ---------------------------------------------------------------------------
// Event emitter
// ---------------------------------------------------------------------------

export type RunnerEventType =
  | 'experiment:started'
  | 'experiment:completed'
  | 'experiment:failed'
  | 'experiment:paused'
  | 'experiment:resumed'
  | 'dyad:started'
  | 'dyad:completed'
  | 'dyad:failed'
  | 'dyad:turn'
  | 'progress';

export interface RunnerEvent {
  type: RunnerEventType;
  experimentId: string;
  dyadId?: string;
  message?: TranscriptMessage;
  error?: string;
  progress?: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    pending: number;
  };
}

type RunnerEventListener = (event: RunnerEvent) => void;

// ---------------------------------------------------------------------------
// Keyword termination for devMode
// ---------------------------------------------------------------------------

const DEV_MODE_KEYWORDS = ['DEAL', 'NO DEAL', 'ACCEPT', 'REJECT', 'AGREEMENT', 'TERMINATE'];

function containsTerminationKeyword(content: string): boolean {
  const upper = content.toUpperCase();
  return DEV_MODE_KEYWORDS.some(kw => upper.includes(kw));
}

// ---------------------------------------------------------------------------
// ExperimentRunner
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;

/**
 * Thrown when the LLM conversation succeeded but a post-conversation database
 * write kept failing. Non-retryable at the dyad level: re-running the dyad
 * would re-run the whole (already successful) conversation and double-insert
 * transcript rows (there is no unique key on dyad_id+turn).
 */
export class DyadPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DyadPersistenceError';
  }
}

export class ExperimentRunner {
  private readonly experiment: ExperimentDefinition;
  private readonly scenario: Scenario;
  private readonly apiKeys: Record<string, string>;
  private readonly concurrency: number;

  private paused = false;
  private abortController: AbortController | null = null;
  private listeners: RunnerEventListener[] = [];

  constructor(
    experiment: ExperimentDefinition,
    scenario: Scenario,
    apiKeys: Record<string, string>,
  ) {
    this.experiment = experiment;
    this.scenario = scenario;
    this.apiKeys = apiKeys;
    this.concurrency = experiment.concurrency > 0 ? experiment.concurrency : 5;
  }

  // -----------------------------------------------------------------------
  // Event emitter interface
  // -----------------------------------------------------------------------

  on(listener: RunnerEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(event: RunnerEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // listener errors should not break the runner
      }
    }
  }

  // -----------------------------------------------------------------------
  // Pause / resume / abort
  // -----------------------------------------------------------------------

  pause(): void {
    this.paused = true;
    this.emit({ type: 'experiment:paused', experimentId: this.experiment.id ?? '' });
  }

  resume(): void {
    this.paused = false;
    this.emit({ type: 'experiment:resumed', experimentId: this.experiment.id ?? '' });
  }

  abort(): void {
    this.abortController?.abort();
  }

  // -----------------------------------------------------------------------
  // start()
  // -----------------------------------------------------------------------

  async start(): Promise<string> {
    this.abortController = new AbortController();
    this.paused = false;

    const experimentId = this.experiment.id ?? crypto.randomUUID();

    // 0. Validate config upfront: every cell must have a provider/model
    // mapping for every domain agent. Catching this before any dyads exist
    // avoids the pointless 3x-retry-per-dyad path on a deterministic config
    // error and prevents an all-dyads-failed experiment from ending
    // 'completed'.
    const validationErrors = validateAgentAssignments(
      this.experiment.factors,
      this.scenario.domainAgents,
      this.experiment.agentAssignments,
    );

    if (validationErrors.length > 0) {
      const message = `Invalid experiment configuration:\n${validationErrors.join('\n')}`;
      const { error: failError } = await supabase
        .from('research_experiments')
        .update({ status: 'failed' })
        .eq('id', experimentId);
      if (failError) {
        console.error(`[Runner] Failed to mark experiment ${experimentId} as failed:`, failError.message);
      }
      this.emit({ type: 'experiment:failed', experimentId, error: message });
      throw new Error(message);
    }

    // 1. Update research_experiments row (experiment IS the run)
    const { error: updateError } = await supabase
      .from('research_experiments')
      .update({
        status: 'running',
        config_snapshot: this.experiment,
        prompt_hashes: this.buildPromptHashes(),
        started_at: new Date().toISOString(),
        progress: { total: 0, completed: 0, failed: 0, excluded: 0 },
      })
      .eq('id', experimentId);

    if (updateError) {
      throw new Error(`Failed to start experiment: ${updateError.message}`);
    }

    // 2. Enumerate cells and create dyad records
    const cells = enumerateCells(this.experiment.factors);
    const nPerCell = Math.ceil(
      this.experiment.targetNPerCell * (1 + this.experiment.bufferPercent / 100),
    );

    const dyadInserts: Array<{
      experiment_id: string;
      cell_label: string;
      dyad_index: number;
      seed: number;
      factors: Record<string, string>;
      status: string;
    }> = [];

    let globalIndex = 0;
    for (const cell of cells) {
      for (let i = 0; i < nPerCell; i++) {
        dyadInserts.push({
          experiment_id: experimentId,
          cell_label: cell.label,
          dyad_index: globalIndex,
          seed: globalIndex,
          factors: cell.factors,
          status: 'pending',
        });
        globalIndex++;
      }
    }

    const { data: dyadRows, error: dyadError } = await supabase
      .from('dyads')
      .insert(dyadInserts)
      .select('id, cell_label, dyad_index, seed, factors');

    if (dyadError || !dyadRows) {
      throw new Error(`Failed to create dyad records: ${dyadError?.message ?? 'unknown'}`);
    }

    // Update experiment progress
    await updateExperimentProgress(experimentId, {
      total: dyadRows.length,
      completed: 0,
      failed: 0,
      excluded: 0,
      running: 0,
      pending: dyadRows.length,
    });

    this.emit({
      type: 'experiment:started',
      experimentId,
      progress: {
        total: dyadRows.length,
        completed: 0,
        failed: 0,
        running: 0,
        pending: dyadRows.length,
      },
    });

    // 3. Process dyads with concurrency control
    const dyadIds = dyadRows.map(r => r.id as string);

    try {
      await this.processDyads(dyadIds, experimentId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const { error: failError } = await supabase
        .from('research_experiments')
        .update({ status: 'failed' })
        .eq('id', experimentId);
      if (failError) {
        console.error(`[Runner] Failed to mark experiment ${experimentId} as failed:`, failError.message);
      }
      this.emit({ type: 'experiment:failed', experimentId, error: message });
      throw err;
    }

    // 4. Finalize experiment
    const finalProgress = await getExperimentProgress(experimentId);

    const { error: completeError } = await supabase
      .from('research_experiments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress: finalProgress,
      })
      .eq('id', experimentId);

    if (completeError) {
      console.error(`[Runner] Failed to mark experiment ${experimentId} as completed:`, completeError.message);
      this.emit({ type: 'experiment:failed', experimentId, error: `Failed to mark experiment as completed: ${completeError.message}` });
      throw new Error(`Failed to mark experiment as completed: ${completeError.message}`);
    }

    this.emit({
      type: 'experiment:completed',
      experimentId,
      progress: {
        total: finalProgress.total,
        completed: finalProgress.completed,
        failed: finalProgress.failed,
        running: finalProgress.running,
        pending: finalProgress.pending,
      },
    });

    return experimentId;
  }

  // -----------------------------------------------------------------------
  // Concurrency pool
  // -----------------------------------------------------------------------

  private async processDyads(dyadIds: string[], experimentId: string): Promise<void> {
    const queue = [...dyadIds];
    const active = new Set<Promise<void>>();

    while (queue.length > 0 || active.size > 0) {
      // Wait while paused
      while (this.paused) {
        await sleep(500);
        if (this.abortController?.signal.aborted) return;
      }

      if (this.abortController?.signal.aborted) return;

      // Fill up to concurrency limit
      while (active.size < this.concurrency && queue.length > 0) {
        const dyadId = queue.shift()!;
        const task = this.runDyadWithRetry(dyadId, experimentId).then(() => {
          active.delete(task);
        });
        active.add(task);
      }

      // Wait for at least one to finish
      if (active.size > 0) {
        await Promise.race(active);
      }

      // Sync progress to Supabase
      const progress = await getExperimentProgress(experimentId);
      await updateExperimentProgress(experimentId, progress);
      this.emit({
        type: 'progress',
        experimentId,
        progress: {
          total: progress.total,
          completed: progress.completed,
          failed: progress.failed,
          running: progress.running,
          pending: progress.pending,
        },
      });
    }
  }

  // -----------------------------------------------------------------------
  // Retry wrapper
  // -----------------------------------------------------------------------

  private async runDyadWithRetry(dyadId: string, experimentId: string): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await this.runDyad(dyadId, experimentId);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (this.abortController?.signal.aborted) break;
        // Persistence failures after a successful conversation are retried at
        // the individual write level inside runDyad. Do NOT re-run the dyad:
        // that would repeat the whole LLM conversation and double-insert
        // transcript rows.
        if (lastError instanceof DyadPersistenceError) break;
        // Exponential backoff between retries
        if (attempt < MAX_RETRIES - 1) {
          await sleep(1000 * Math.pow(2, attempt));
        }
      }
    }

    // Mark dyad as permanently failed
    const { error: failUpdateError } = await supabase
      .from('dyads')
      .update({
        status: 'failed',
        failure_reason: lastError?.message ?? 'unknown',
      })
      .eq('id', dyadId);

    if (failUpdateError) {
      console.error(`[Runner] Failed to mark dyad ${dyadId} as failed:`, failUpdateError.message);
    }

    this.emit({
      type: 'dyad:failed',
      experimentId,
      dyadId,
      error: lastError?.message ?? 'unknown',
    });
  }

  // -----------------------------------------------------------------------
  // runDyad()
  // -----------------------------------------------------------------------

  async runDyad(dyadId: string, experimentId: string): Promise<void> {
    // Fetch dyad record
    const { data: dyad, error: fetchError } = await supabase
      .from('dyads')
      .select('*')
      .eq('id', dyadId)
      .single();

    if (fetchError || !dyad) {
      throw new Error(`Failed to fetch dyad ${dyadId}: ${fetchError?.message ?? 'not found'}`);
    }

    const factors = dyad.factors as Record<string, string>;

    // Mark as running
    const { error: runningError } = await supabase
      .from('dyads')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', dyadId);

    if (runningError) {
      console.error(`[Runner] Failed to mark dyad ${dyadId} as running:`, runningError.message);
      throw new Error(`Failed to mark dyad ${dyadId} as running: ${runningError.message}`);
    }

    this.emit({ type: 'dyad:started', experimentId, dyadId });

    // Build agent configs from experiment definition + cell factors
    const { agentConfigs, supervisorConfigs } = this.buildAgentConfigs(factors);

    // Build orchestrator callbacks. In devMode supervisors are never invoked
    // (runSupervisor returns stubs), and constructing them resolves API keys —
    // so buildSupervisorAgents skips construction entirely in devMode.
    const domainAgents = this.createDomainAgents(agentConfigs);
    const supervisorAgents = buildSupervisorAgents(
      this.scenario,
      supervisorConfigs,
      this.apiKeys,
      this.experiment.devMode,
    );

    const orchestrator = new ConversationOrchestrator({
      scenario: this.maybeDevModeScenario(),
      agentConfigs,
      supervisorConfigs,
      generateMessage: async (config, transcript, signal) => {
        const agent = domainAgents.get(config.name);
        if (!agent) throw new Error(`Domain agent not found: ${config.name}`);
        const turn = transcript.length + 1;
        const message = await agent.generateMessage(transcript, turn, signal);

        // devMode: check for keyword termination
        if (this.experiment.devMode && containsTerminationKeyword(message.content)) {
          // Let the message through but it will be picked up by the turn cap
        }

        return message;
      },
      runSupervisor: async (supervisorDef, config, transcript, signal) => {
        if (this.experiment.devMode) {
          // In devMode, skip real supervisor calls.
          // For classifiers: check transcript for termination keywords → return ACCEPTANCE.
          let classification = 'CONTINUE';
          if (supervisorDef.type === 'classifier' || supervisorDef.type === 'appraiser') {
            const lastMessages = transcript.slice(-2);
            if (lastMessages.some(m => containsTerminationKeyword(m.content))) {
              classification = 'ACCEPTANCE';
            }
          }
          return {
            afterTurn: transcript.length,
            supervisorName: supervisorDef.name,
            outputType: supervisorDef.type === 'classifier' || supervisorDef.type === 'appraiser'
              ? 'classification'
              : 'extraction',
            parsed: supervisorDef.type === 'classifier' || supervisorDef.type === 'appraiser'
              ? { classification }
              : {},
            rawResponse: `[devMode: ${classification}]`,
          } satisfies SupervisorOutput;
        }

        const agent = supervisorAgents.get(config.name);
        if (!agent) throw new Error(`Supervisor agent not found: ${config.name}`);

        if (agent instanceof ClassifierAgent) {
          const { output } = await agent.classify({
            transcript,
            afterTurn: transcript.length,
          });
          return output;
        } else if (agent instanceof AppraiserAgent) {
          const lastMessage = transcript[transcript.length - 1];
          const { output } = await agent.appraise({
            transcript,
            perspectiveRole: 'each negotiator',
            outcomeSummary: lastMessage
              ? `Final message (${lastMessage.agentName}): ${lastMessage.content}`
              : 'No messages were exchanged.',
          });
          return output;
        } else if (agent instanceof ExtractorAgent) {
          // The extractor only feeds recent messages to the model, so inject
          // the full transcript via the {FULL_TRANSCRIPT} prompt slot.
          const { output } = await agent.extract({
            transcript,
            afterTurn: transcript.length,
            promptSlots: {
              FULL_TRANSCRIPT: transcript
                .map(m => `[turn ${m.turn}] ${m.agentName}: ${m.content}`)
                .join('\n\n'),
            },
          });
          return output;
        }

        throw new Error(`Unknown supervisor agent type for: ${config.name}`);
      },
      onTurn: (message) => {
        this.emit({
          type: 'dyad:turn',
          experimentId,
          dyadId,
          message,
        });
      },
      signal: this.abortController?.signal,
    });

    // Run the conversation
    const result: OrchestratorResult = await orchestrator.run();

    // -- Post-conversation persistence --------------------------------------
    // The conversation succeeded, so every write below is retried at the
    // write level (persistWithRetry) and, if it still fails, throws a
    // DyadPersistenceError which the dyad retry wrapper treats as permanent —
    // the conversation is never re-run because of a failed insert.

    // Persist transcript
    if (result.transcript.length > 0) {
      const transcriptInserts = result.transcript.map(msg => ({
        dyad_id: dyadId,
        turn: msg.turn,
        agent_name: msg.agentName,
        content: msg.content,
        provider: msg.provider,
        model: msg.model,
        token_usage: msg.tokenUsage ?? null,
        time_taken_ms: msg.timeTakenMs,
        word_count: msg.wordCount,
        created_at: msg.createdAt,
      }));

      await this.persistWithRetry(
        `Failed to persist transcript for dyad ${dyadId}`,
        () => supabase.from('transcript_messages').insert(transcriptInserts),
      );
    }

    // Persist supervisor outputs (incl. post-termination appraiser ratings)
    if (result.supervisorOutputs.length > 0) {
      const supervisorInserts = result.supervisorOutputs.map(output => ({
        dyad_id: dyadId,
        after_turn: output.afterTurn,
        supervisor_name: output.supervisorName,
        output_type: output.outputType,
        parsed: output.parsed,
        raw_response: output.rawResponse,
      }));

      await this.persistWithRetry(
        `Failed to persist supervisor outputs for dyad ${dyadId}`,
        () => supabase.from('supervisor_outputs').insert(supervisorInserts),
      );
    }

    // Create outcome record from post-termination extractors
    const extractorOutputs = result.supervisorOutputs.filter(
      o => o.outputType === 'extraction',
    );
    const mergedOutcome: Record<string, unknown> = {};
    for (const output of extractorOutputs) {
      Object.assign(mergedOutcome, output.parsed);
    }

    if (Object.keys(mergedOutcome).length > 0) {
      await this.persistWithRetry(
        `Failed to persist outcome record for dyad ${dyadId}`,
        () => supabase.from('outcome_records').insert({
          dyad_id: dyadId,
          experiment_id: experimentId,
          data: mergedOutcome,
        }),
      );
    }

    // Mark dyad as completed
    await this.persistWithRetry(
      `Failed to mark dyad ${dyadId} as completed`,
      () => supabase
        .from('dyads')
        .update({
          status: 'completed',
          termination_reason: result.terminationReason,
          termination_turn: result.terminationTurn,
          completed_at: new Date().toISOString(),
        })
        .eq('id', dyadId),
    );

    this.emit({ type: 'dyad:completed', experimentId, dyadId });
  }

  // -----------------------------------------------------------------------
  // Agent construction
  // -----------------------------------------------------------------------

  private buildAgentConfigs(
    cellFactors: Record<string, string>,
  ): { agentConfigs: Map<string, AgentConfig>; supervisorConfigs: Map<string, AgentConfig> } {
    const agentConfigs = new Map<string, AgentConfig>();
    const supervisorConfigs = new Map<string, AgentConfig>();

    // Domain agents — resolve provider/model from factor assignments
    for (const scenarioAgent of this.scenario.domainAgents) {
      const assignment = this.experiment.agentAssignments.find(
        a => a.agentName === scenarioAgent.name,
      );

      // No silent fallback: an unmapped cell means the experiment config is
      // incomplete — fail fast with a clear error instead of defaulting to a
      // provider the user may have no API key for. start() validates all
      // cells upfront, so this throw is defense-in-depth.
      const resolved = resolveFactorMapping(assignment, cellFactors);
      if (!resolved) {
        const cellDesc = Object.entries(cellFactors).map(([k, v]) => `${k}=${v}`).join(', ');
        throw new Error(
          `No provider/model mapping for agent "${scenarioAgent.name}" in cell (${cellDesc}). ` +
          `Add a factorMapping for this cell to the experiment's agent assignments.`,
        );
      }
      const { provider, model, temperature } = resolved;

      // Render prompt template with experiment params
      const systemPrompt = this.renderPromptTemplate(
        scenarioAgent.defaultPromptTemplate,
        cellFactors,
      );

      agentConfigs.set(scenarioAgent.name, {
        name: scenarioAgent.name,
        role: 'domain',
        provider,
        model,
        temperature,
        maxTokens: 1024,
        systemPrompt,
      });
    }

    // Supervisor agents — default to the provider/model already mapped for
    // this cell's domain agents (a key is guaranteed for it) instead of a
    // hardcoded openai default the researcher may have no key for.
    const supervisorDefault = resolveSupervisorDefault(
      [...agentConfigs.values()],
      this.apiKeys,
    );
    for (const supervisor of this.scenario.supervisors) {
      const override = this.experiment.supervisors?.[supervisor.name];
      const provider: ProviderType = override?.provider ?? supervisorDefault.provider;
      const model = override?.model ?? supervisorDefault.model;
      const temperature = override?.temperature ?? 0;

      supervisorConfigs.set(supervisor.name, {
        name: supervisor.name,
        role: 'supervisor',
        provider,
        model,
        temperature,
        maxTokens: 512,
        systemPrompt: supervisor.promptTemplate,
      });
    }

    return { agentConfigs, supervisorConfigs };
  }

  private createDomainAgents(agentConfigs: Map<string, AgentConfig>): Map<string, DomainAgent> {
    const agents = new Map<string, DomainAgent>();
    for (const [name, config] of agentConfigs) {
      const apiKey = this.resolveApiKey(config.provider);
      agents.set(name, new DomainAgent({ ...config, apiKey }));
    }
    return agents;
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * Retry a single persistence write with backoff. Throws DyadPersistenceError
   * once retries are exhausted so the dyad retry wrapper does not re-run the
   * (already successful) LLM conversation.
   */
  private async persistWithRetry(
    label: string,
    op: () => PromiseLike<{ error: { message: string } | null }>,
  ): Promise<void> {
    let lastMessage = 'unknown';
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const { error } = await op();
      if (!error) return;
      lastMessage = error.message;
      console.error(`[Runner] ${label} (attempt ${attempt + 1}/${MAX_RETRIES}):`, error.message);
      if (attempt < MAX_RETRIES - 1) {
        await sleep(1000 * Math.pow(2, attempt));
      }
    }
    throw new DyadPersistenceError(`${label}: ${lastMessage}`);
  }

  private resolveApiKey(provider: ProviderType): string {
    const key = this.apiKeys[provider];
    if (!key) {
      throw new Error(`No API key provided for provider: ${provider}`);
    }
    return key;
  }

  private renderPromptTemplate(
    template: string,
    cellFactors: Record<string, string>,
  ): string {
    let rendered = template;
    // Substitute params: scenario defaults, overridden by experiment params
    const params: Record<string, unknown> = {
      ...(this.scenario.defaultParams ?? {}),
      ...this.experiment.params,
    };
    for (const [key, value] of Object.entries(params)) {
      rendered = rendered.replaceAll(`{${key}}`, String(value));
    }
    // Substitute cell factor values
    for (const [key, value] of Object.entries(cellFactors)) {
      rendered = rendered.replaceAll(`{${key}}`, value);
    }
    return rendered;
  }

  private buildPromptHashes(): Record<string, string> {
    const hashes: Record<string, string> = {};
    for (const agent of this.scenario.domainAgents) {
      hashes[agent.name] = simpleHash(agent.defaultPromptTemplate);
    }
    for (const supervisor of this.scenario.supervisors) {
      hashes[supervisor.name] = simpleHash(supervisor.promptTemplate);
    }
    return hashes;
  }

  /**
   * In devMode, inject a keyword-based turn cap as a safety net.
   * Real supervisors are skipped (handled in runSupervisor callback).
   */
  private maybeDevModeScenario(): Scenario {
    if (!this.experiment.devMode) return this.scenario;

    const devTermination = this.scenario.terminationConditions.some(
      c => c.type === 'turn_cap',
    );

    // Ensure there's always a turn cap in devMode
    if (devTermination) return this.scenario;

    return {
      ...this.scenario,
      terminationConditions: [
        ...this.scenario.terminationConditions,
        { type: 'turn_cap', maxTurns: 20 },
      ],
    };
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
