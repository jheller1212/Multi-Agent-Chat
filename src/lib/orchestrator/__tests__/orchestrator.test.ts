import { describe, it, expect, vi } from 'vitest';
import { ConversationOrchestrator } from '../orchestrator';
import type { Scenario } from '../../../types/scenario';
import type { AgentConfig, TranscriptMessage, SupervisorOutput } from '../../../types/agents';

function makeTranscriptMessage(agentName: string, turn: number, content: string): TranscriptMessage {
  return {
    turn,
    agentName,
    content,
    provider: 'openai',
    model: 'gpt-4o',
    timeTakenMs: 100,
    wordCount: content.split(/\s+/).length,
    createdAt: new Date().toISOString(),
  };
}

function makeScenario(overrides?: Partial<Scenario>): Scenario {
  return {
    id: 'test-scenario',
    userId: 'user-1',
    name: 'Test Scenario',
    description: '',
    isPublic: false,
    isTemplate: false,
    domainAgents: [
      { name: 'buyer', description: 'Buyer', defaultPromptTemplate: '' },
      { name: 'seller', description: 'Seller', defaultPromptTemplate: '' },
    ],
    supervisors: [
      {
        name: 'judge',
        type: 'classifier',
        timing: 'per_round',
        outputSchema: {},
        promptTemplate: '',
      },
    ],
    turnPolicy: {
      type: 'alternating',
      roundDefinition: ['buyer', 'seller'],
    },
    terminationConditions: [
      { type: 'turn_cap', maxTurns: 6 },
    ],
    outcomeSchema: { columns: [] },
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function makeAgentConfig(name: string): AgentConfig {
  return {
    name,
    role: 'domain',
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: `You are ${name}.`,
  };
}

describe('ConversationOrchestrator', () => {
  it('runs a conversation to turn cap termination', async () => {
    let turnCounter = 0;
    const generateMessage = vi.fn(async (config: AgentConfig) => {
      turnCounter++;
      return makeTranscriptMessage(config.name, turnCounter, `Message from ${config.name}`);
    });

    const runSupervisor = vi.fn(async (): Promise<SupervisorOutput> => ({
      afterTurn: turnCounter,
      supervisorName: 'judge',
      outputType: 'classification',
      parsed: { classification: 'CONTINUE' },
      rawResponse: '{"classification":"CONTINUE"}',
    }));

    const agentConfigs = new Map([
      ['buyer', makeAgentConfig('buyer')],
      ['seller', makeAgentConfig('seller')],
    ]);
    const supervisorConfigs = new Map([
      ['judge', { ...makeAgentConfig('judge'), role: 'supervisor' as const }],
    ]);

    const orchestrator = new ConversationOrchestrator({
      scenario: makeScenario(),
      agentConfigs,
      supervisorConfigs,
      generateMessage,
      runSupervisor,
    });

    const result = await orchestrator.run();

    expect(result.totalTurns).toBe(6);
    expect(result.terminationReason).toContain('turn_cap');
    expect(result.transcript).toHaveLength(6);
    // 3 rounds of buyer+seller = 3 supervisor calls
    expect(runSupervisor).toHaveBeenCalledTimes(3);
  });

  it('terminates on supervisor classification', async () => {
    let turnCounter = 0;
    const generateMessage = vi.fn(async (config: AgentConfig) => {
      turnCounter++;
      return makeTranscriptMessage(config.name, turnCounter, `Turn ${turnCounter}`);
    });

    let roundCount = 0;
    const runSupervisor = vi.fn(async (): Promise<SupervisorOutput> => {
      roundCount++;
      return {
        afterTurn: turnCounter,
        supervisorName: 'judge',
        outputType: 'classification',
        parsed: { classification: roundCount >= 2 ? 'ACCEPTANCE' : 'CONTINUE' },
        rawResponse: '',
      };
    });

    const scenario = makeScenario({
      terminationConditions: [
        {
          type: 'supervisor_classification',
          supervisorName: 'judge',
          terminalValues: ['ACCEPTANCE', 'REJECTION'],
        },
        { type: 'turn_cap', maxTurns: 30 },
      ],
    });

    const agentConfigs = new Map([
      ['buyer', makeAgentConfig('buyer')],
      ['seller', makeAgentConfig('seller')],
    ]);
    const supervisorConfigs = new Map([
      ['judge', { ...makeAgentConfig('judge'), role: 'supervisor' as const }],
    ]);

    const orchestrator = new ConversationOrchestrator({
      scenario,
      agentConfigs,
      supervisorConfigs,
      generateMessage,
      runSupervisor,
    });

    const result = await orchestrator.run();

    expect(result.totalTurns).toBe(4); // 2 rounds
    expect(result.terminationReason).toContain('ACCEPTANCE');
  });

  it('calls onTurn and onRound callbacks', async () => {
    let turnCounter = 0;
    const generateMessage = vi.fn(async (config: AgentConfig) => {
      turnCounter++;
      return makeTranscriptMessage(config.name, turnCounter, 'msg');
    });

    const runSupervisor = vi.fn(async (): Promise<SupervisorOutput> => ({
      afterTurn: turnCounter,
      supervisorName: 'judge',
      outputType: 'classification',
      parsed: { classification: 'CONTINUE' },
      rawResponse: '',
    }));

    const onTurn = vi.fn();
    const onRound = vi.fn();

    const scenario = makeScenario({ terminationConditions: [{ type: 'turn_cap', maxTurns: 4 }] });
    const agentConfigs = new Map([
      ['buyer', makeAgentConfig('buyer')],
      ['seller', makeAgentConfig('seller')],
    ]);
    const supervisorConfigs = new Map([
      ['judge', { ...makeAgentConfig('judge'), role: 'supervisor' as const }],
    ]);

    const orchestrator = new ConversationOrchestrator({
      scenario,
      agentConfigs,
      supervisorConfigs,
      generateMessage,
      runSupervisor,
      onTurn,
      onRound,
    });

    await orchestrator.run();

    expect(onTurn).toHaveBeenCalledTimes(4);
    expect(onRound).toHaveBeenCalledTimes(2);
  });

  it('runs post-termination supervisors', async () => {
    let turnCounter = 0;
    const generateMessage = vi.fn(async (config: AgentConfig) => {
      turnCounter++;
      return makeTranscriptMessage(config.name, turnCounter, 'msg');
    });

    const runSupervisor = vi.fn(async (_sup: unknown, config: AgentConfig): Promise<SupervisorOutput> => ({
      afterTurn: turnCounter,
      supervisorName: config.name,
      outputType: config.name === 'judge' ? 'classification' : 'appraisal',
      parsed: config.name === 'judge' ? { classification: 'CONTINUE' } : { svi_1: 5 },
      rawResponse: '',
    }));

    const scenario = makeScenario({
      supervisors: [
        { name: 'judge', type: 'classifier', timing: 'per_round', outputSchema: {}, promptTemplate: '' },
        { name: 'appraiser', type: 'appraiser', timing: 'post_termination', outputSchema: {}, promptTemplate: '' },
      ],
      terminationConditions: [{ type: 'turn_cap', maxTurns: 2 }],
    });

    const agentConfigs = new Map([
      ['buyer', makeAgentConfig('buyer')],
      ['seller', makeAgentConfig('seller')],
    ]);
    const supervisorConfigs = new Map([
      ['judge', { ...makeAgentConfig('judge'), role: 'supervisor' as const }],
      ['appraiser', { ...makeAgentConfig('appraiser'), role: 'supervisor' as const }],
    ]);

    const orchestrator = new ConversationOrchestrator({
      scenario,
      agentConfigs,
      supervisorConfigs,
      generateMessage,
      runSupervisor,
    });

    const result = await orchestrator.run();

    // 1 per-round (after round 1) + 1 post-termination
    expect(runSupervisor).toHaveBeenCalledTimes(2);
    expect(result.supervisorOutputs.some(o => o.outputType === 'appraisal')).toBe(true);
  });

  it('respects abort signal', async () => {
    const ac = new AbortController();
    ac.abort();

    const generateMessage = vi.fn();
    const runSupervisor = vi.fn();

    const agentConfigs = new Map([
      ['buyer', makeAgentConfig('buyer')],
      ['seller', makeAgentConfig('seller')],
    ]);
    const supervisorConfigs = new Map([
      ['judge', { ...makeAgentConfig('judge'), role: 'supervisor' as const }],
    ]);

    const orchestrator = new ConversationOrchestrator({
      scenario: makeScenario(),
      agentConfigs,
      supervisorConfigs,
      generateMessage,
      runSupervisor,
      signal: ac.signal,
    });

    const result = await orchestrator.run();

    expect(result.terminationReason).toBe('aborted');
    expect(result.totalTurns).toBe(0);
    expect(generateMessage).not.toHaveBeenCalled();
  });
});
