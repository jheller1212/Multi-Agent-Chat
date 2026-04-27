import type { AgentConfig, TranscriptMessage, SupervisorOutput } from '../../types/agents';
import type { ExperimentDefinition, DyadRecord } from '../../types/experiment';
import type { Scenario, SupervisorDefinition } from '../../types/scenario';
import type { ProviderType } from '../../types';
import type { OrchestratorResult } from '../orchestrator/orchestrator';
import { ConversationOrchestrator } from '../orchestrator/orchestrator';
import { DomainAgent } from '../agents/domain-agent';
import { ClassifierAgent } from '../agents/classifier';
import { ExtractorAgent } from '../agents/extractor';
import { enumerateCells, type CellDefinition } from './cell-enumerator';
import { getRunProgress, updateRunProgress } from './progress';
import { supabase } from '../supabase';

// ---------------------------------------------------------------------------
// Event emitter
// ---------------------------------------------------------------------------

export type RunnerEventType =
  | 'run:started'
  | 'run:completed'
  | 'run:failed'
  | 'run:paused'
  | 'run:resumed'
  | 'dyad:started'
  | 'dyad:completed'
  | 'dyad:failed'
  | 'dyad:turn'
  | 'progress';

export interface RunnerEvent {
  type: RunnerEventType;
  runId: string;
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

export class ExperimentRunner {
  private readonly experiment: ExperimentDefinition;
  private readonly scenario: Scenario;
  private readonly apiKeys: Record<string, string>;
  private readonly concurrency: number;

  private runId = '';
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
    this.emit({ type: 'run:paused', runId: this.runId });
  }

  resume(): void {
    this.paused = false;
    this.emit({ type: 'run:resumed', runId: this.runId });
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

    // 1. Create experiment_run row
    const { data: runRow, error: runError } = await supabase
      .from('experiment_runs')
      .insert({
        experiment_id: this.experiment.id ?? crypto.randomUUID(),
        status: 'running',
        config_snapshot: this.experiment,
        prompt_hashes: this.buildPromptHashes(),
        started_at: new Date().toISOString(),
        progress: { total: 0, completed: 0, failed: 0, excluded: 0 },
      })
      .select('id')
      .single();

    if (runError || !runRow) {
      throw new Error(`Failed to create experiment run: ${runError?.message ?? 'unknown'}`);
    }

    this.runId = runRow.id as string;

    // 2. Enumerate cells and create dyad records
    const cells = enumerateCells(this.experiment.factors);
    const nPerCell = Math.ceil(
      this.experiment.targetNPerCell * (1 + this.experiment.bufferPercent / 100),
    );

    const dyadInserts: Array<{
      run_id: string;
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
          run_id: this.runId,
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

    // Update run progress
    await updateRunProgress(this.runId, {
      total: dyadRows.length,
      completed: 0,
      failed: 0,
      excluded: 0,
      running: 0,
      pending: dyadRows.length,
    });

    this.emit({
      type: 'run:started',
      runId: this.runId,
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
      await this.processDyads(dyadIds);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabase
        .from('experiment_runs')
        .update({ status: 'failed' })
        .eq('id', this.runId);
      this.emit({ type: 'run:failed', runId: this.runId, error: message });
      throw err;
    }

    // 4. Finalize run
    const finalProgress = await getRunProgress(this.runId);
    const finalStatus = finalProgress.failed > 0 ? 'completed' : 'completed';

    await supabase
      .from('experiment_runs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        progress: finalProgress,
      })
      .eq('id', this.runId);

    this.emit({
      type: 'run:completed',
      runId: this.runId,
      progress: {
        total: finalProgress.total,
        completed: finalProgress.completed,
        failed: finalProgress.failed,
        running: finalProgress.running,
        pending: finalProgress.pending,
      },
    });

    return this.runId;
  }

  // -----------------------------------------------------------------------
  // Concurrency pool
  // -----------------------------------------------------------------------

  private async processDyads(dyadIds: string[]): Promise<void> {
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
        const task = this.runDyadWithRetry(dyadId).then(() => {
          active.delete(task);
        });
        active.add(task);
      }

      // Wait for at least one to finish
      if (active.size > 0) {
        await Promise.race(active);
      }

      // Sync progress to Supabase
      const progress = await getRunProgress(this.runId);
      await updateRunProgress(this.runId, progress);
      this.emit({
        type: 'progress',
        runId: this.runId,
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

  private async runDyadWithRetry(dyadId: string): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await this.runDyad(dyadId);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (this.abortController?.signal.aborted) break;
        // Exponential backoff between retries
        if (attempt < MAX_RETRIES - 1) {
          await sleep(1000 * Math.pow(2, attempt));
        }
      }
    }

    // Mark dyad as permanently failed
    await supabase
      .from('dyads')
      .update({
        status: 'failed',
        failure_reason: lastError?.message ?? 'unknown',
      })
      .eq('id', dyadId);

    this.emit({
      type: 'dyad:failed',
      runId: this.runId,
      dyadId,
      error: lastError?.message ?? 'unknown',
    });
  }

  // -----------------------------------------------------------------------
  // runDyad()
  // -----------------------------------------------------------------------

  async runDyad(dyadId: string): Promise<void> {
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
    await supabase
      .from('dyads')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', dyadId);

    this.emit({ type: 'dyad:started', runId: this.runId, dyadId });

    // Build agent configs from experiment definition + cell factors
    const { agentConfigs, supervisorConfigs } = this.buildAgentConfigs(factors);

    // Build orchestrator callbacks
    const domainAgents = this.createDomainAgents(agentConfigs);
    const supervisorAgents = this.createSupervisorAgents(supervisorConfigs);

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
          // In devMode, skip real supervisor calls — return a pass-through output
          return {
            afterTurn: transcript.length,
            supervisorName: supervisorDef.name,
            outputType: supervisorDef.type === 'classifier' || supervisorDef.type === 'appraiser'
              ? 'classification'
              : 'extraction',
            parsed: supervisorDef.type === 'classifier' || supervisorDef.type === 'appraiser'
              ? { classification: 'CONTINUE' }
              : {},
            rawResponse: '[devMode: skipped]',
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
        } else if (agent instanceof ExtractorAgent) {
          const { output } = await agent.extract({
            transcript,
            afterTurn: transcript.length,
          });
          return output;
        }

        throw new Error(`Unknown supervisor agent type for: ${config.name}`);
      },
      onTurn: (message) => {
        this.emit({
          type: 'dyad:turn',
          runId: this.runId,
          dyadId,
          message,
        });
      },
      signal: this.abortController?.signal,
    });

    // Run the conversation
    const result: OrchestratorResult = await orchestrator.run();

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

      const { error: transcriptError } = await supabase
        .from('transcript_messages')
        .insert(transcriptInserts);

      if (transcriptError) {
        throw new Error(`Failed to persist transcript for dyad ${dyadId}: ${transcriptError.message}`);
      }
    }

    // Persist supervisor outputs
    if (result.supervisorOutputs.length > 0) {
      const supervisorInserts = result.supervisorOutputs.map(output => ({
        dyad_id: dyadId,
        after_turn: output.afterTurn,
        supervisor_name: output.supervisorName,
        output_type: output.outputType,
        parsed: output.parsed,
        raw_response: output.rawResponse,
      }));

      const { error: supervisorError } = await supabase
        .from('supervisor_outputs')
        .insert(supervisorInserts);

      if (supervisorError) {
        throw new Error(`Failed to persist supervisor outputs for dyad ${dyadId}: ${supervisorError.message}`);
      }
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
      await supabase.from('outcome_records').insert({
        dyad_id: dyadId,
        run_id: this.runId!,
        data: mergedOutcome,
      });
    }

    // Mark dyad as completed
    await supabase
      .from('dyads')
      .update({
        status: 'completed',
        termination_reason: result.terminationReason,
        termination_turn: result.terminationTurn,
        completed_at: new Date().toISOString(),
      })
      .eq('id', dyadId);

    this.emit({ type: 'dyad:completed', runId: this.runId, dyadId });
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

      let provider: ProviderType = 'openai';
      let model = 'gpt-4o';
      let temperature = 0.7;

      if (assignment) {
        // factorMappings keys are "factorName=level" (e.g., "buyer_capability=strong").
        // Find the first key whose factor name + level matches this cell's factor values.
        for (const [key, mapping] of Object.entries(assignment.factorMappings)) {
          const eqIdx = key.indexOf('=');
          if (eqIdx === -1) {
            // Legacy: treat key as a plain factor name
            if (cellFactors[key] !== undefined) {
              provider = mapping.provider;
              model = mapping.model;
              temperature = mapping.temperature;
              break;
            }
          } else {
            const factorName = key.slice(0, eqIdx);
            const factorLevel = key.slice(eqIdx + 1);
            if (cellFactors[factorName] === factorLevel) {
              provider = mapping.provider;
              model = mapping.model;
              temperature = mapping.temperature;
              break;
            }
          }
        }
      }

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

    // Supervisor agents
    for (const supervisor of this.scenario.supervisors) {
      const override = this.experiment.supervisors?.[supervisor.name];
      const provider: ProviderType = override?.provider ?? 'openai';
      const model = override?.model ?? 'gpt-4o';
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

  private createSupervisorAgents(
    supervisorConfigs: Map<string, AgentConfig>,
  ): Map<string, ClassifierAgent | ExtractorAgent> {
    const agents = new Map<string, ClassifierAgent | ExtractorAgent>();

    for (const supervisorDef of this.scenario.supervisors) {
      const config = supervisorConfigs.get(supervisorDef.name);
      if (!config) continue;

      const apiKey = this.resolveApiKey(config.provider);

      if (supervisorDef.type === 'classifier' || supervisorDef.type === 'appraiser') {
        const allowedValues = this.extractAllowedValues(supervisorDef);
        agents.set(supervisorDef.name, new ClassifierAgent({
          ...config,
          apiKey,
          allowedValues,
        }));
      } else {
        const expectedKeys = this.extractExpectedKeys(supervisorDef);
        agents.set(supervisorDef.name, new ExtractorAgent({
          ...config,
          apiKey,
          expectedKeys,
        }));
      }
    }

    return agents;
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

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
    // Substitute experiment params
    for (const [key, value] of Object.entries(this.experiment.params)) {
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

  private extractAllowedValues(supervisor: SupervisorDefinition): string[] {
    const schema = supervisor.outputSchema;
    if (Array.isArray(schema['allowedValues'])) {
      return schema['allowedValues'] as string[];
    }
    if (Array.isArray(schema['values'])) {
      return schema['values'] as string[];
    }
    return ['CONTINUE'];
  }

  private extractExpectedKeys(supervisor: SupervisorDefinition): string[] {
    const schema = supervisor.outputSchema;
    if (typeof schema === 'object' && schema !== null) {
      return Object.keys(schema).filter(k => k !== 'type' && k !== 'allowedValues');
    }
    return [];
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
