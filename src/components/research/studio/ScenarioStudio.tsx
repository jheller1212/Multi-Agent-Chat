import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import { loadScenario, saveScenario } from '../../../lib/scenario/loader';
import { extractSlotNames } from '../../../lib/prompts/template-engine';
import { validateSlotCoverage } from '../../../lib/prompts/validate';
import { Button } from '../../ui/Button';
import { toast } from '../../ui/Toast';
import { AgentRoster } from './AgentRoster';
import { PromptPane } from './PromptPane';
import { SettingsPane } from './SettingsPane';
import { scenarioToStudio, studioToScenario } from './model';
import type { StudioAgent, StudioSettings } from './model';
import type { OutcomeSchema, Scenario } from '../../../types/scenario';

export interface ScenarioStudioProps {
  scenarioId?: string;
  onUseInExperiment?: (scenarioId: string) => void;
}

const AUTOSAVE_MS = 3000;

const EMPTY_OUTCOMES: OutcomeSchema = { columns: [] };

function defaultAgents(): StudioAgent[] {
  // Fresh scenarios start from a minimal two-negotiator skeleton.
  return scenarioToStudio({
    id: '', userId: '', createdAt: '', updatedAt: '',
    name: '', description: '', isPublic: false, isTemplate: false,
    domainAgents: [
      { name: 'Buyer', description: '', defaultPromptTemplate: '' },
      { name: 'Seller', description: '', defaultPromptTemplate: '' },
    ],
    supervisors: [],
    turnPolicy: { type: 'alternating', roundDefinition: ['Buyer', 'Seller'] },
    terminationConditions: [{ type: 'turn_cap', maxTurns: 12 }],
    outcomeSchema: EMPTY_OUTCOMES,
  }).agents;
}

/**
 * Scenario Studio — three panes: agent roster (drag lanes), prompt editor
 * with parameter chips, and scenario settings. Autosaves 3s after the last
 * change; Validate wires to lib/prompts/validate.
 */
export function ScenarioStudio({ scenarioId, onUseInExperiment }: ScenarioStudioProps) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [currentId, setCurrentId] = useState<string | undefined>(scenarioId);
  const [name, setName] = useState('Untitled scenario');
  const [description, setDescription] = useState('');
  const [agents, setAgents] = useState<StudioAgent[]>(defaultAgents);
  const [settings, setSettings] = useState<StudioSettings>({
    turnPolicyType: 'alternating', mediatorId: null, turnCap: 12, defaultParams: {},
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!scenarioId);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty' | 'error' | 'new'>('new');

  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const stateRef = useRef({ agents, settings, name, description, scenario, currentId });
  stateRef.current = { agents, settings, name, description, scenario, currentId };

  useEffect(() => {
    if (!scenarioId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const loaded = await loadScenario(scenarioId);
      if (cancelled) return;
      if (loaded) {
        const studio = scenarioToStudio(loaded);
        setScenario(loaded);
        setCurrentId(loaded.id);
        setName(loaded.name);
        setDescription(loaded.description);
        setAgents(studio.agents);
        setSettings(studio.settings);
        setSelectedId(studio.agents[0]?.id ?? null);
        setSaveState('saved');
      } else {
        toast.error('Scenario not found', { detail: 'It may have been deleted or is not visible to you.' });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [scenarioId]);

  const doSave = useCallback(async (): Promise<string | null> => {
    const s = stateRef.current;
    setSaveState('saving');
    const config = studioToScenario(
      { agents: s.agents, settings: s.settings },
      {
        name: s.name,
        description: s.description,
        isPublic: s.scenario?.isPublic ?? false,
        isTemplate: s.scenario?.isTemplate ?? false,
        outcomeSchema: s.scenario?.outcomeSchema ?? EMPTY_OUTCOMES,
      },
    );
    const saved = await saveScenario(config, s.currentId);
    if (!saved) {
      setSaveState('error');
      toast.error('Autosave failed', { detail: 'Your latest edits are not stored. Check your connection.' });
      return null;
    }
    setScenario(saved);
    setCurrentId(saved.id);
    setSaveState('saved');
    return saved.id;
  }, []);

  const touch = useCallback(() => {
    setSaveState(prev => (prev === 'saving' ? prev : 'dirty'));
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => { void doSave(); }, AUTOSAVE_MS);
  }, [doSave]);

  useEffect(() => () => clearTimeout(autosaveTimer.current), []);

  const update = {
    agents: (next: StudioAgent[]) => {
      setAgents(next);
      // A mediator dragged out of the supervisor lane must stop being the
      // mediator — otherwise a stale mediatorId survives into the saved
      // scenario as a domain agent's name (see model.ts's lane filter).
      setSettings(prev => {
        if (!prev.mediatorId) return prev;
        const stillSupervisor = next.some(a => a.id === prev.mediatorId && a.lane === 'supervisor');
        return stillSupervisor ? prev : { ...prev, mediatorId: null };
      });
      touch();
    },
    settings: (next: StudioSettings) => { setSettings(next); touch(); },
    name: (next: string) => { setName(next); touch(); },
    agentPatch: (id: string, patch: Partial<StudioAgent>) => {
      setAgents(prev => prev.map(a => (a.id === id ? { ...a, ...patch } : a)));
      touch();
    },
    bindParam: (slot: string, value: string) => {
      setSettings(prev => ({ ...prev, defaultParams: { ...prev.defaultParams, [slot]: value } }));
      touch();
    },
  };

  const handleValidate = () => {
    const errors: string[] = [];
    for (const agent of agents) {
      if (agent.prompt.trim() === '') errors.push(`${agent.name}: empty prompt template`);
      const result = validateSlotCoverage(agent.prompt, settings.defaultParams, []);
      if (!result.valid) errors.push(...result.errors.map(e => `${agent.name}: ${e}`));
    }
    for (const s of agents.filter(a => a.lane === 'supervisor')) {
      if (s.supervisorType === 'classifier' && s.classifierSchema.allowedValues.length === 0) {
        errors.push(`${s.name}: classifier has no allowed labels`);
      }
      if (s.supervisorType !== 'classifier' && s.extractorSchema.keys.length === 0) {
        errors.push(`${s.name}: no output keys defined`);
      }
    }
    if (errors.length === 0) {
      toast.success('Scenario is valid', { detail: 'All prompts, parameters, and schemas check out.' });
    } else {
      toast.warning(`${errors.length} validation ${errors.length === 1 ? 'issue' : 'issues'}`, {
        detail: errors.slice(0, 3).join(' · ') + (errors.length > 3 ? ` · +${errors.length - 3} more` : ''),
      });
    }
  };

  const handleUseInExperiment = async () => {
    const id = saveState === 'saved' && currentId ? currentId : await doSave();
    if (id && onUseInExperiment) onUseInExperiment(id);
  };

  const selected = agents.find(a => a.id === selectedId) ?? null;
  const unboundCount = agents
    .flatMap(a => extractSlotNames(a.prompt))
    .filter((slot, i, arr) => arr.indexOf(slot) === i)
    .filter(slot => String(settings.defaultParams[slot] ?? '').trim() === '').length;

  if (loading) {
    return <div className="p-12 text-center text-callout text-label-3">Loading scenario…</div>;
  }

  return (
    <div className="flex h-full flex-col bg-bg-grouped">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b border-separator bg-bg-base px-6 py-3">
        <input
          value={name}
          onChange={e => update.name(e.target.value)}
          aria-label="Scenario name"
          className="min-w-0 flex-1 bg-transparent text-title-3 text-label-1 outline-none"
        />
        <SaveIndicator state={saveState} />
      </header>

      {/* Panes */}
      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)_280px] gap-px overflow-hidden bg-separator">
        <aside className="overflow-y-auto bg-bg-grouped p-3">
          <AgentRoster agents={agents} selectedId={selectedId} onSelect={setSelectedId} onChange={update.agents} />
        </aside>
        <main className="overflow-y-auto bg-bg-base p-5">
          <PromptPane
            agent={selected}
            defaultParams={settings.defaultParams}
            onUpdate={patch => selected && update.agentPatch(selected.id, patch)}
            onBindParam={update.bindParam}
          />
        </main>
        <aside className="overflow-y-auto bg-bg-grouped p-4">
          <SettingsPane
            settings={settings}
            agents={agents}
            outcomeSchema={scenario?.outcomeSchema ?? EMPTY_OUTCOMES}
            onChange={update.settings}
          />
        </aside>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-separator bg-bg-base px-6 py-3">
        <span className="text-caption font-normal text-label-3">
          {unboundCount > 0
            ? `${unboundCount} unbound ${unboundCount === 1 ? 'parameter' : 'parameters'} — bind here or at Configure`
            : 'All parameters bound'}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleValidate}>Validate</Button>
          <Button
            variant="primary"
            icon={<ArrowRight size={14} />}
            disabled={!onUseInExperiment}
            onClick={() => void handleUseInExperiment()}
          >
            Use in Experiment
          </Button>
        </div>
      </footer>
    </div>
  );
}

function SaveIndicator({ state }: { state: 'saved' | 'saving' | 'dirty' | 'error' | 'new' }) {
  if (state === 'error') return <span className="text-caption text-destructive">Autosave failed</span>;
  if (state === 'saving') return <span className="text-caption text-label-3">Saving…</span>;
  if (state === 'dirty') return <span className="text-caption text-label-3">Unsaved changes</span>;
  if (state === 'new') return <span className="text-caption text-label-4">Not saved yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-caption text-label-3">
      <CheckCircle2 size={13} className="text-success" /> Saved
    </span>
  );
}
