import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, X } from 'lucide-react';

import { loadScenarios } from '../../../lib/scenario/loader';
import { extractSlotNames } from '../../../lib/prompts/template-engine';
import { saveDraft, loadLatestDraft } from '../../../lib/experiment/draft';
import type { ExperimentDraftConfig } from '../../../lib/experiment/draft';
import { Button } from '../../ui/Button';
import { Card, CardTitle, CardDescription } from '../../ui/Card';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { Select } from '../../ui/Select';
import { Slider } from '../../ui/Slider';
import { Stepper } from '../../ui/Stepper';
import { Switch } from '../../ui/Switch';
import { toast } from '../../ui/Toast';
import { DesignMatrixPreview } from './DesignMatrixPreview';
import { DEFAULT_CHOICE, MODEL_CATALOG, PROVIDERS, PROVIDER_COLORS, PROVIDER_LABELS } from './catalog';
import type { ModelChoice } from './catalog';
import type { ProviderType } from '../../../types';
import type { AgentAssignment, FactorDefinition } from '../../../types/experiment';
import type { Scenario } from '../../../types/scenario';

interface LocalFactor extends FactorDefinition {
  id: string;
  /** At most one factor varies the model; others inherit the global choice. */
  variesModel: boolean;
}

export interface ConfigureResult {
  draftId: string;
  scenario: Scenario;
  config: ExperimentDraftConfig;
  name: string;
}

interface ConfigureStepProps {
  initialScenarioId?: string;
  onContinue: (result: ConfigureResult) => void;
}

const AUTOSAVE_MS = 2500;
let factorSeq = 0;
const factorId = () => `factor-${++factorSeq}`;

/** Wizard step 1: scenario, factors, models, parameters, run settings. */
export function ConfigureStep({ initialScenarioId, onContinue }: ConfigureStepProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioId, setScenarioId] = useState<string | undefined>(initialScenarioId);
  const [name, setName] = useState('Untitled experiment');
  const [factors, setFactors] = useState<LocalFactor[]>([
    { id: factorId(), name: 'model_pairing', levels: ['same', 'mixed'], variesModel: false },
  ]);
  const [globalChoice, setGlobalChoice] = useState<ModelChoice>(DEFAULT_CHOICE);
  /** agentName -> `${factor}=${level}` -> choice, for the varying factor. */
  const [matrix, setMatrix] = useState<Record<string, Record<string, ModelChoice>>>({});
  const [params, setParams] = useState<Record<string, string>>({});
  const [nPerCell, setNPerCell] = useState(10);
  const [bufferPercent, setBufferPercent] = useState(10);
  const [concurrency, setConcurrency] = useState(4);
  const [devMode, setDevMode] = useState(true);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [saveNote, setSaveNote] = useState('Draft not saved yet');

  const scenario = scenarios.find(s => s.id === scenarioId) ?? null;
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await loadScenarios();
      if (!cancelled) setScenarios(list);
    })();
    return () => { cancelled = true; };
  }, []);

  // Placeholders across scenario prompts; prefilled from scenario.defaultParams
  // (the runner merges defaultParams under experiment params).
  const placeholders = useMemo(() => {
    if (!scenario) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    const templates = [
      ...scenario.domainAgents.map(a => a.defaultPromptTemplate),
      ...scenario.supervisors.map(s => s.promptTemplate),
    ];
    for (const template of templates) {
      for (const slot of extractSlotNames(template)) {
        if (!seen.has(slot)) { seen.add(slot); out.push(slot); }
      }
    }
    return out;
  }, [scenario]);

  // When the scenario changes: prefill params + restore latest draft.
  useEffect(() => {
    if (!scenario) return;
    let cancelled = false;
    setParams(prev => {
      const next: Record<string, string> = {};
      for (const slot of placeholders) {
        next[slot] = prev[slot] ?? String(scenario.defaultParams?.[slot] ?? '');
      }
      return next;
    });
    (async () => {
      const { data: draft, error } = await loadLatestDraft(scenario.id);
      if (cancelled) return;
      if (error) { toast.error('Could not check for drafts', { detail: error }); return; }
      if (!draft) return;
      setDraftId(draft.id);
      setName(draft.name);
      const c = draft.config;
      if (Array.isArray(c.factors) && c.factors.length > 0) {
        setFactors(c.factors.map(f => ({ ...f, id: factorId(), variesModel: false })));
      }
      if (c.params) {
        setParams(prev => ({ ...prev, ...Object.fromEntries(Object.entries(c.params).map(([k, v]) => [k, String(v)])) }));
      }
      if (typeof c.nPerCell === 'number') setNPerCell(c.nPerCell);
      if (typeof c.bufferPercent === 'number') setBufferPercent(c.bufferPercent);
      if (typeof c.concurrency === 'number') setConcurrency(c.concurrency);
      if (typeof c.devMode === 'boolean') setDevMode(c.devMode);
      setSaveNote('Draft restored');
    })();
    return () => { cancelled = true; };
    // placeholders derives from scenario; scenario.id is the real dependency.
  }, [scenario?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const varyingFactor = factors.find(f => f.variesModel) ?? null;

  const buildAssignments = useCallback((): AgentAssignment[] => {
    if (!scenario) return [];
    return scenario.domainAgents.map(agent => {
      const factorMappings: AgentAssignment['factorMappings'] = {};
      for (const factor of factors) {
        for (const level of factor.levels) {
          const key = `${factor.name}=${level}`;
          factorMappings[key] =
            factor.variesModel
              ? { ...(matrix[agent.name]?.[key] ?? globalChoice) }
              : { ...globalChoice };
        }
      }
      return { agentName: agent.name, factorMappings };
    });
  }, [scenario, factors, matrix, globalChoice]);

  const buildConfig = useCallback((): ExperimentDraftConfig => ({
    factors: factors.map(({ name: fname, levels }) => ({ name: fname, levels })),
    nPerCell,
    bufferPercent,
    concurrency,
    devMode,
    agentAssignments: buildAssignments(),
    params: Object.fromEntries(
      Object.entries(params).filter(([, v]) => v.trim() !== '')
        .map(([k, v]) => [k, Number.isFinite(Number(v)) && v.trim() !== '' ? Number(v) : v]),
    ),
  }), [factors, nPerCell, bufferPercent, concurrency, devMode, params, buildAssignments]);

  // Autosave draft (debounced, awaited, error-surfaced once per failure).
  const stateKey = JSON.stringify({ name, factors, globalChoice, matrix, params, nPerCell, bufferPercent, concurrency, devMode });
  useEffect(() => {
    if (!scenario) return;
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      const { data, error } = await saveDraft(scenario.id, name, buildConfig(), draftId);
      if (error) {
        setSaveNote('Draft save failed');
        if (lastErrorRef.current !== error) {
          lastErrorRef.current = error;
          toast.error('Draft save failed', { detail: error });
        }
        return;
      }
      lastErrorRef.current = null;
      if (data) setDraftId(data);
      setSaveNote(`Draft saved ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`);
    }, AUTOSAVE_MS);
    return () => clearTimeout(autosaveTimer.current);
    // stateKey captures everything that should trigger a save.
  }, [stateKey, scenario?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const unbound = placeholders.filter(slot => (params[slot] ?? '').trim() === '');
  const factorsValid = factors.every(f => f.name.trim() !== '' && f.levels.length > 0);
  const canContinue = !!scenario && factorsValid && unbound.length === 0;

  const handleContinue = async () => {
    if (!scenario) return;
    const config = buildConfig();
    const { data, error } = await saveDraft(scenario.id, name, config, draftId);
    if (error || !data) {
      toast.error('Could not save the draft', { detail: error ?? 'Unknown error.' });
      return;
    }
    setDraftId(data);
    onContinue({ draftId: data, scenario, config, name });
  };

  const callsPerDyad = useMemo(() => {
    if (!scenario) return 0;
    const cap = scenario.terminationConditions.find(c => c.type === 'turn_cap');
    const turnCap = cap && cap.type === 'turn_cap' ? cap.maxTurns : 12;
    const perRound = scenario.supervisors.filter(s => s.timing === 'per_round').length;
    const post = scenario.supervisors.filter(s => s.timing === 'post_termination').length;
    return turnCap * (scenario.domainAgents.length + perRound) + post;
  }, [scenario]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-6">
      <div className="flex flex-col gap-4">
        {/* Scenario + name */}
        <Card>
          <CardTitle>Scenario</CardTitle>
          <CardDescription>Pick the scenario this experiment runs. Type in the list to search.</CardDescription>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Select
              aria-label="Scenario"
              placeholder={scenarios.length === 0 ? 'No scenarios yet' : 'Select scenario…'}
              value={scenarioId}
              onValueChange={setScenarioId}
              groups={[
                { label: 'Your scenarios', options: scenarios.filter(s => !s.isTemplate).map(s => ({ value: s.id, label: s.name })) },
                { label: 'Templates', options: scenarios.filter(s => s.isTemplate).map(s => ({ value: s.id, label: s.name })) },
              ].filter(g => g.options.length > 0)}
            />
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              aria-label="Experiment name"
              placeholder="Experiment name"
              className="h-8 rounded-sm border border-separator-opaque bg-bg-base px-2.5 text-callout
                text-label-1 outline-none placeholder:text-label-3
                focus-visible:ring-[3px] focus-visible:ring-accent-soft-2"
            />
          </div>
        </Card>

        {/* Factors */}
        <Card data-tour="factors-card">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Factors</CardTitle>
              <CardDescription>Each factor multiplies the design. Drag to reorder; type a level and press Enter.</CardDescription>
            </div>
            <Button
              size="sm"
              icon={<Plus size={13} />}
              onClick={() => setFactors([...factors, { id: factorId(), name: '', levels: [], variesModel: false }])}
            >
              Add factor
            </Button>
          </div>
          <FactorList
            factors={factors}
            onChange={setFactors}
            onToggleVaries={(id, on) =>
              setFactors(factors.map(f => ({ ...f, variesModel: f.id === id ? on : false })))
            }
          />
        </Card>

        {/* Model assignment */}
        <Card>
          <CardTitle>Models</CardTitle>
          <CardDescription>
            {varyingFactor
              ? `“${varyingFactor.name}” varies the model — assign per agent and level below. Other cells use the default.`
              : 'All agents use the default model unless a factor varies the model.'}
          </CardDescription>
          <div className="mt-3">
            <ModelChoiceRow label="Default" choice={globalChoice} onChange={setGlobalChoice} />
          </div>
          {varyingFactor && scenario && (
            <div className="mt-4 flex flex-col gap-3 border-t border-separator pt-4">
              {scenario.domainAgents.map(agent => (
                <div key={agent.name}>
                  <h5 className="text-caption text-label-1">{agent.name}</h5>
                  <div className="mt-1.5 flex flex-col gap-1.5">
                    {varyingFactor.levels.map(level => {
                      const key = `${varyingFactor.name}=${level}`;
                      return (
                        <ModelChoiceRow
                          key={key}
                          label={level}
                          choice={matrix[agent.name]?.[key] ?? globalChoice}
                          onChange={choice =>
                            setMatrix(prev => ({
                              ...prev,
                              [agent.name]: { ...prev[agent.name], [key]: choice },
                            }))
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Parameters */}
        <Card>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>
            Values for the scenario's {'{PLACEHOLDER}'} slots. All must be bound before continuing.
          </CardDescription>
          {!scenario ? (
            <p className="mt-3 text-callout text-label-3">Select a scenario to see its parameters.</p>
          ) : placeholders.length === 0 ? (
            <p className="mt-3 text-callout text-label-3">This scenario has no parameters.</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {placeholders.map(slot => {
                const bound = (params[slot] ?? '').trim() !== '';
                return (
                  <label key={slot} className="flex flex-col gap-1">
                    <span className={`font-mono text-caption-2 font-medium ${bound ? 'text-label-2' : 'text-warning'}`}>
                      {'{'}{slot}{'}'}{!bound && ' — required'}
                    </span>
                    <input
                      value={params[slot] ?? ''}
                      onChange={e => setParams({ ...params, [slot]: e.target.value })}
                      className={`h-8 rounded-sm border bg-bg-base px-2.5 font-mono text-mono-body text-label-1
                        outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft-2
                        ${bound ? 'border-separator-opaque' : 'border-warning'}`}
                    />
                  </label>
                );
              })}
            </div>
          )}
        </Card>

        {/* Run settings */}
        <Card>
          <CardTitle>Run settings</CardTitle>
          <div className="mt-3 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <SettingRow label="Dyads per cell (N)">
                <Stepper aria-label="Dyads per cell" value={nPerCell} onValueChange={setNPerCell} min={1} max={500} />
              </SettingRow>
              <SettingRow label="Buffer %">
                <Stepper aria-label="Buffer percent" value={bufferPercent} onValueChange={setBufferPercent} min={0} max={100} step={5} />
              </SettingRow>
            </div>
            <SettingRow label={`Concurrency — ${concurrency} parallel ${concurrency === 1 ? 'dyad' : 'dyads'}`}>
              <Slider aria-label="Concurrency" value={concurrency} onValueChange={setConcurrency} min={1} max={20} />
            </SettingRow>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-callout font-medium text-label-1">Mode</span>
                <p className="text-caption font-normal text-label-3">Dev mode caps turns and logs verbosely.</p>
              </div>
              <SegmentedControl<'dev' | 'production'>
                aria-label="Mode"
                value={devMode ? 'dev' : 'production'}
                onValueChange={v => setDevMode(v === 'dev')}
                options={[{ value: 'dev', label: 'Dev' }, { value: 'production', label: 'Production' }]}
              />
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="flex items-center justify-between pb-8">
          <span className="text-caption font-normal text-label-3">{saveNote}</span>
          <div className="flex items-center gap-3">
            {unbound.length > 0 && (
              <span className="text-caption text-warning">
                {unbound.length} unbound {unbound.length === 1 ? 'parameter' : 'parameters'}
              </span>
            )}
            <Button variant="primary" disabled={!canContinue} onClick={() => void handleContinue()}>
              Continue to Freeze
            </Button>
          </div>
        </div>
      </div>

      <DesignMatrixPreview
        factors={factors}
        nPerCell={nPerCell}
        bufferPercent={bufferPercent}
        callsPerDyad={callsPerDyad}
      />
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-callout font-medium text-label-1">{label}</span>
      {children}
    </div>
  );
}

/* ---------------- model choice row ---------------- */

function ModelChoiceRow({ label, choice, onChange }: { label: string; choice: ModelChoice; onChange: (c: ModelChoice) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 truncate text-caption font-normal text-label-2" title={label}>{label}</span>
      <div className="w-36">
        <Select
          aria-label={`${label} provider`}
          size="sm"
          value={choice.provider}
          onValueChange={p => {
            const provider = p as ProviderType;
            onChange({ ...choice, provider, model: MODEL_CATALOG[provider][0].id });
          }}
          groups={[{
            options: PROVIDERS.map(p => ({
              value: p,
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: PROVIDER_COLORS[p] }} />
                  {PROVIDER_LABELS[p]}
                </span>
              ),
            })),
          }]}
        />
      </div>
      <div className="w-44">
        <Select
          aria-label={`${label} model`}
          size="sm"
          value={choice.model}
          onValueChange={model => onChange({ ...choice, model })}
          groups={[{ options: MODEL_CATALOG[choice.provider].map(m => ({ value: m.id, label: m.label })) }]}
        />
      </div>
      <span className="text-caption-2 text-label-3">temp</span>
      <Stepper
        aria-label={`${label} temperature ×10`}
        value={Math.round(choice.temperature * 10)}
        onValueChange={v => onChange({ ...choice, temperature: v / 10 })}
        min={0}
        max={20}
      />
    </div>
  );
}

/* ---------------- factors: sortable cards + level chips ---------------- */

function FactorList({
  factors,
  onChange,
  onToggleVaries,
}: {
  factors: LocalFactor[];
  onChange: (f: LocalFactor[]) => void;
  onToggleVaries: (id: string, on: boolean) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = factors.findIndex(f => f.id === active.id);
    const to = factors.findIndex(f => f.id === over.id);
    if (from !== -1 && to !== -1) onChange(arrayMove(factors, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={factors.map(f => f.id)} strategy={verticalListSortingStrategy}>
        <div className="mt-3 flex flex-col gap-2">
          {factors.map(factor => (
            <FactorRow
              key={factor.id}
              factor={factor}
              canRemove={factors.length > 1}
              onUpdate={patch => onChange(factors.map(f => (f.id === factor.id ? { ...f, ...patch } : f)))}
              onRemove={() => onChange(factors.filter(f => f.id !== factor.id))}
              onToggleVaries={on => onToggleVaries(factor.id, on)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function FactorRow({
  factor,
  canRemove,
  onUpdate,
  onRemove,
  onToggleVaries,
}: {
  factor: LocalFactor;
  canRemove: boolean;
  onUpdate: (patch: Partial<LocalFactor>) => void;
  onRemove: () => void;
  onToggleVaries: (on: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: factor.id });
  const [draft, setDraft] = useState('');

  const addLevel = () => {
    const level = draft.trim();
    if (!level || factor.levels.includes(level)) { setDraft(''); return; }
    onUpdate({ levels: [...factor.levels, level] });
    setDraft('');
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-md border border-separator bg-bg-elevated p-3 ${isDragging ? 'z-10 opacity-90 shadow-3' : ''}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Reorder factor ${factor.name || 'unnamed'}`}
          className="cursor-grab touch-none text-label-4 focus-visible:text-accent focus-visible:outline-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        <input
          value={factor.name}
          onChange={e => onUpdate({ name: e.target.value })}
          placeholder="factor_name"
          aria-label="Factor name"
          className="h-7 w-44 rounded-sm border border-separator-opaque bg-bg-base px-2 font-mono
            text-mono-body text-label-1 outline-none placeholder:text-label-3
            focus-visible:ring-[3px] focus-visible:ring-accent-soft-2"
        />
        <div className="flex-1" />
        <Switch
          checked={factor.variesModel}
          onCheckedChange={onToggleVaries}
          label="Varies the model"
        />
        {canRemove && (
          <button
            type="button"
            aria-label={`Remove factor ${factor.name || 'unnamed'}`}
            onClick={onRemove}
            className="text-label-4 hover:text-destructive focus-visible:text-destructive focus-visible:outline-none"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <LevelChips
        factorId={factor.id}
        levels={factor.levels}
        onChange={levels => onUpdate({ levels })}
        draft={draft}
        onDraftChange={setDraft}
        onCommit={addLevel}
      />
    </div>
  );
}

function LevelChips({
  factorId: fid,
  levels,
  onChange,
  draft,
  onDraftChange,
  onCommit,
}: {
  factorId: string;
  levels: string[];
  onChange: (levels: string[]) => void;
  draft: string;
  onDraftChange: (v: string) => void;
  onCommit: () => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = levels.indexOf(String(active.id).replace(`${fid}:`, ''));
    const to = levels.indexOf(String(over.id).replace(`${fid}:`, ''));
    if (from !== -1 && to !== -1) onChange(arrayMove(levels, from, to));
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={levels.map(l => `${fid}:${l}`)} strategy={horizontalListSortingStrategy}>
          {levels.map(level => (
            <LevelChip key={level} id={`${fid}:${level}`} label={level} onRemove={() => onChange(levels.filter(l => l !== level))} />
          ))}
        </SortableContext>
      </DndContext>
      <input
        value={draft}
        onChange={e => onDraftChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onCommit(); }
          if (e.key === 'Backspace' && draft === '' && levels.length > 0) onChange(levels.slice(0, -1));
        }}
        onBlur={onCommit}
        placeholder={levels.length === 0 ? 'Type a level, press Enter' : 'Add level…'}
        aria-label="Add level"
        className="h-6 min-w-36 flex-1 bg-transparent px-1 text-caption font-normal text-label-1 outline-none placeholder:text-label-3"
      />
    </div>
  );
}

function LevelChip({ id, label, onRemove }: { id: string; label: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <span
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`inline-flex items-center gap-1 rounded-full bg-fill-2 py-0.5 pl-2 pr-1
        text-caption-2 font-medium text-label-1 ${isDragging ? 'z-10 shadow-2' : ''}`}
    >
      <button
        type="button"
        aria-label={`Reorder level ${label}`}
        className="cursor-grab touch-none focus-visible:text-accent focus-visible:outline-none"
        {...attributes}
        {...listeners}
      >
        {label}
      </button>
      <button
        type="button"
        aria-label={`Remove level ${label}`}
        onClick={onRemove}
        className="rounded-full p-0.5 text-label-3 hover:text-destructive focus-visible:text-destructive focus-visible:outline-none"
      >
        <X size={11} />
      </button>
    </span>
  );
}
