/**
 * Studio view-model: a flat, drag-friendly agent list mapped to/from the
 * persisted Scenario shape. Pure functions — unit tested.
 */
import { extractSlotNames } from '../../../lib/prompts/template-engine';
import {
  parseClassifierSchema,
  parseExtractorSchema,
  serializeClassifierSchema,
  serializeExtractorSchema,
} from '../../../lib/scenario/simple-schema';
import type { ClassifierSchema, ExtractorSchema } from '../../../lib/scenario/simple-schema';
import type {
  Scenario,
  SupervisorDefinition,
  TerminationCondition,
  TurnPolicy,
} from '../../../types/scenario';

export const MAX_AGENTS = 6;
export const MIN_NEGOTIATORS = 2;

export type SupervisorType = SupervisorDefinition['type'];
export type SupervisorTiming = SupervisorDefinition['timing'];

export interface StudioAgent {
  /** Stable local id for dnd + prompt keying. */
  id: string;
  name: string;
  description: string;
  lane: 'negotiator' | 'supervisor';
  prompt: string;
  /** Supervisor-only settings; present but ignored for negotiators. */
  supervisorType: SupervisorType;
  timing: SupervisorTiming;
  classifierSchema: ClassifierSchema;
  extractorSchema: ExtractorSchema;
}

export interface StudioSettings {
  turnPolicyType: TurnPolicy['type'];
  /** Supervisor agent id acting as mediator (mediator_led only). */
  mediatorId: string | null;
  turnCap: number;
  defaultParams: Record<string, string | number>;
}

export interface StudioState {
  agents: StudioAgent[];
  settings: StudioSettings;
}

let nextId = 0;
export function newAgentId(): string {
  nextId += 1;
  return `studio-${Date.now().toString(36)}-${nextId}`;
}

/** All unique {PLACEHOLDER} slots across every agent prompt, in first-seen order. */
export function collectPlaceholders(agents: Pick<StudioAgent, 'prompt'>[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const agent of agents) {
    for (const slot of extractSlotNames(agent.prompt)) {
      if (!seen.has(slot)) {
        seen.add(slot);
        out.push(slot);
      }
    }
  }
  return out;
}

/** A placeholder is bound when a scenario-level default exists for it. */
export function isBound(slot: string, defaultParams: Record<string, string | number>): boolean {
  const value = defaultParams[slot];
  return value !== undefined && String(value).trim() !== '';
}

const DEFAULT_TURN_CAP = 12;

/**
 * Legacy JSON-Schema-ish classifier schemas don't carry which labels are
 * terminal — that lives only in `terminationConditions`. Without this,
 * loading a legacy scenario into the Studio silently wipes terminalValues,
 * and saving drops the supervisor_classification termination condition
 * entirely (deal-detection stops working). New simple-shape schemas already
 * carry terminalValues via parseClassifierSchema, so this only backfills
 * the gap for the legacy shape.
 */
function withLegacyTerminalValues(
  schema: ClassifierSchema,
  supervisorName: string,
  terminationConditions: TerminationCondition[],
): ClassifierSchema {
  if (schema.terminalValues.length > 0) return schema;
  const condition = terminationConditions.find(
    (c): c is Extract<TerminationCondition, { type: 'supervisor_classification' }> =>
      c.type === 'supervisor_classification' && c.supervisorName === supervisorName,
  );
  if (!condition) return schema;
  return {
    ...schema,
    terminalValues: condition.terminalValues.filter(v => schema.allowedValues.includes(v)),
  };
}

export function scenarioToStudio(scenario: Scenario): StudioState {
  const agents: StudioAgent[] = [
    ...scenario.domainAgents.map((a): StudioAgent => ({
      id: newAgentId(),
      name: a.name,
      description: a.description,
      lane: 'negotiator',
      prompt: a.defaultPromptTemplate,
      supervisorType: 'classifier',
      timing: 'per_round',
      classifierSchema: { allowedValues: [], terminalValues: [] },
      extractorSchema: { keys: [] },
    })),
    ...scenario.supervisors.map((s): StudioAgent => ({
      id: newAgentId(),
      name: s.name,
      description: '',
      lane: 'supervisor',
      prompt: s.promptTemplate,
      supervisorType: s.type,
      timing: s.timing,
      classifierSchema: withLegacyTerminalValues(
        parseClassifierSchema(s.outputSchema),
        s.name,
        scenario.terminationConditions,
      ),
      extractorSchema: parseExtractorSchema(s.outputSchema),
    })),
  ];

  // Order negotiators by the persisted speaking order where possible.
  const order = scenario.turnPolicy?.roundDefinition ?? [];
  agents.sort((a, b) => {
    if (a.lane !== 'negotiator' || b.lane !== 'negotiator') return 0;
    const ia = order.indexOf(a.name);
    const ib = order.indexOf(b.name);
    if (ia === -1 || ib === -1) return 0;
    return ia - ib;
  });

  const turnCapCondition = scenario.terminationConditions.find(
    (c): c is Extract<TerminationCondition, { type: 'turn_cap' }> => c.type === 'turn_cap',
  );

  const mediatorName =
    scenario.turnPolicy?.type === 'mediator_led'
      ? (scenario.turnPolicy.config?.mediator as string | undefined)
      : undefined;
  const mediator = mediatorName
    ? agents.find(a => a.lane === 'supervisor' && a.name === mediatorName)
    : undefined;

  return {
    agents,
    settings: {
      turnPolicyType: scenario.turnPolicy?.type ?? 'alternating',
      mediatorId: mediator?.id ?? null,
      turnCap: turnCapCondition?.maxTurns ?? DEFAULT_TURN_CAP,
      defaultParams: scenario.defaultParams ?? {},
    },
  };
}

/**
 * Map studio state back to the persisted Scenario config. Speaking order =
 * negotiator lane order; classifier terminal values become a
 * supervisor_classification termination condition.
 */
export function studioToScenario(
  state: StudioState,
  base: Pick<Scenario, 'name' | 'description' | 'isPublic' | 'isTemplate' | 'outcomeSchema'>,
): Omit<Scenario, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  const negotiators = state.agents.filter(a => a.lane === 'negotiator');
  const supervisors = state.agents.filter(a => a.lane === 'supervisor');

  const terminationConditions: TerminationCondition[] = [
    { type: 'turn_cap', maxTurns: state.settings.turnCap },
  ];
  for (const s of supervisors) {
    if (s.supervisorType === 'classifier' && s.classifierSchema.terminalValues.length > 0) {
      terminationConditions.push({
        type: 'supervisor_classification',
        supervisorName: s.name,
        terminalValues: s.classifierSchema.terminalValues,
      });
    }
  }

  // Lane-filtered: a mediatorId can go stale if the agent was dragged out of
  // the supervisor lane after being picked as mediator (see ScenarioStudio's
  // lane-change handler, which clears it proactively — this is belt-and-
  // suspenders so a domain agent can never end up as turnPolicy.config.mediator).
  const mediator = state.agents.find(a => a.id === state.settings.mediatorId && a.lane === 'supervisor');

  return {
    ...base,
    domainAgents: negotiators.map(a => ({
      name: a.name,
      description: a.description,
      defaultPromptTemplate: a.prompt,
    })),
    supervisors: supervisors.map((s): SupervisorDefinition => ({
      name: s.name,
      type: s.supervisorType,
      timing: s.timing,
      outputSchema:
        s.supervisorType === 'classifier'
          ? serializeClassifierSchema(s.classifierSchema)
          : serializeExtractorSchema(s.extractorSchema),
      promptTemplate: s.prompt,
    })),
    turnPolicy: {
      type: state.settings.turnPolicyType,
      roundDefinition: negotiators.map(a => a.name),
      ...(state.settings.turnPolicyType === 'mediator_led' && mediator
        ? { config: { mediator: mediator.name } }
        : {}),
    },
    terminationConditions,
    defaultParams: state.settings.defaultParams,
  };
}
