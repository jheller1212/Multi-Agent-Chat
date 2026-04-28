import { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { supabase } from '../../lib/supabase';
import { ExperimentRunner } from '../../lib/experiment/runner';
import { loadVault, saveVault, type ProviderVault } from '../../lib/apiKeyVault';
import { loadScenario } from '../../lib/scenario/loader';
import type { ExperimentDefinition } from '../../types/experiment';
import type { ProviderType } from '../../types';

interface ExperimentLauncherProps {
  scenarioId?: string;
  scenarioName?: string;
  onLaunch?: (experimentId: string) => void;
  onBack?: () => void;
}

interface FactorConfig {
  name: string;
  levels: string[];
}

const DEFAULT_FACTORS: FactorConfig[] = [
  { name: 'buyer_capability', levels: ['strong', 'weak'] },
  { name: 'seller_capability', levels: ['strong', 'weak'] },
];

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI', dot: '#10A37F' },
  { value: 'anthropic', label: 'Anthropic', dot: '#D97757' },
  { value: 'google', label: 'Google', dot: '#4285F4' },
  { value: 'mistral', label: 'Mistral', dot: '#FA520F' },
  { value: 'meta', label: 'Meta', dot: '#0064E0' },
  { value: 'alibaba', label: 'Alibaba', dot: '#FF6A00' },
];

// Map ProviderVault keys to ProviderType identifiers used by the runner
function vaultToApiKeys(vault: ReturnType<typeof loadVault>): Record<string, string> {
  return {
    openai: vault.gpt4,
    anthropic: vault.claude,
    google: vault.gemini,
    mistral: vault.mistral,
    meta: vault.meta,
    alibaba: vault.alibaba,
  };
}

export function ExperimentLauncher({ scenarioId, scenarioName, onLaunch, onBack }: ExperimentLauncherProps) {
  const [name, setName] = useState(`${scenarioName ?? 'Experiment'} — run`);
  const [factors, setFactors] = useState<FactorConfig[]>(DEFAULT_FACTORS);
  const [nPerCell, setNPerCell] = useState(8);
  const [concurrency, setConcurrency] = useState(5);
  const [devMode, setDevMode] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const runnerRef = useRef<ExperimentRunner | null>(null);

  // Model selection
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');

  const MODEL_OPTIONS: Record<string, Array<{ id: string; label: string }>> = {
    openai: [{ id: 'gpt-4o', label: 'GPT-4o' }, { id: 'gpt-4o-mini', label: 'GPT-4o Mini' }, { id: 'gpt-4.1', label: 'GPT-4.1' }],
    anthropic: [{ id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' }, { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' }, { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' }],
    google: [{ id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }, { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' }],
    mistral: [{ id: 'mistral-large-latest', label: 'Mistral Large' }, { id: 'mistral-small-latest', label: 'Mistral Small' }],
    meta: [{ id: 'llama-3.1-8b-instruct', label: 'Llama 3.1 8B' }, { id: 'llama-3.1-70b-instruct', label: 'Llama 3.1 70B' }],
    alibaba: [{ id: 'qwen-2.5-7b-instruct', label: 'Qwen 2.5 7B' }, { id: 'qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B' }],
  };

  // API key management
  const [vault, setVault] = useState<ProviderVault>(() => loadVault());
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyProvider, setKeyProvider] = useState<keyof ProviderVault>('gpt4');

  const VAULT_KEY_MAP: Record<string, keyof ProviderVault> = {
    openai: 'gpt4', anthropic: 'claude', google: 'gemini', mistral: 'mistral', meta: 'meta', alibaba: 'alibaba',
  };

  const hasKeyForProvider = vault[VAULT_KEY_MAP[selectedProvider] ?? 'gpt4'].length > 0;
  const hasAnyKey = Object.values(vault).some(k => k.length > 0);
  const configuredProviders = PROVIDER_OPTIONS.filter(p => vault[VAULT_KEY_MAP[p.value] ?? 'gpt4'].length > 0);

  useEffect(() => { setVault(loadVault()); }, []);

  // When provider changes, pick first model and check key
  useEffect(() => {
    const models = MODEL_OPTIONS[selectedProvider];
    if (models && models.length > 0) {
      setSelectedModel(models[0].id);
    }
    setKeyProvider(VAULT_KEY_MAP[selectedProvider] ?? 'gpt4');
  }, [selectedProvider]);

  const handleSaveKey = () => {
    const updated = { ...vault, [keyProvider]: keyInput };
    setVault(updated);
    saveVault(updated);
    setShowKeyInput(false);
    setKeyInput('');
  };

  const cellCount = factors.reduce((acc, f) => acc * f.levels.length, 1);
  const totalDyads = cellCount * nPerCell;

  const addFactor = () => {
    setFactors([...factors, { name: `factor_${factors.length + 1}`, levels: ['level_a', 'level_b'] }]);
  };

  const removeFactor = (index: number) => {
    setFactors(factors.filter((_, i) => i !== index));
  };

  const updateFactorName = (index: number, name: string) => {
    const updated = [...factors];
    updated[index] = { ...updated[index], name };
    setFactors(updated);
  };

  const updateFactorLevels = (index: number, levels: string) => {
    const updated = [...factors];
    updated[index] = { ...updated[index], levels: levels.split(',').map(l => l.trim()).filter(Boolean) };
    setFactors(updated);
  };

  const handleLaunch = async () => {
    setLaunching(true);
    setLaunchError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLaunchError('Not signed in.'); setLaunching(false); return; }

      const resolvedScenarioId = scenarioId ?? '00000000-0000-0000-0000-000000000000';

      // Load the scenario
      const scenario = await loadScenario(resolvedScenarioId);
      if (!scenario) {
        setLaunchError('Scenario not found. Select a scenario before launching.');
        setLaunching(false);
        return;
      }

      // Load API keys from vault and check at least one exists
      const currentVault = loadVault();
      const apiKeys = vaultToApiKeys(currentVault);
      if (!Object.values(apiKeys).some(k => k.length > 0)) {
        setLaunchError('No API keys configured. Enter at least one provider key below to run experiments.');
        setShowKeyInput(true);
        setLaunching(false);
        return;
      }

      // Create the logical experiment record so we have an ID to bind the run to
      const { data: experiment, error: expError } = await supabase
        .from('research_experiments')
        .insert({
          user_id: user.id,
          scenario_id: resolvedScenarioId,
          name,
          description: `${cellCount} cells × ${nPerCell} dyads = ${totalDyads} total`,
          config: { factors, nPerCell, concurrency, devMode },
          status: 'running',
          progress: { total: totalDyads, completed: 0, failed: 0, excluded: 0 },
        })
        .select('id')
        .single();

      if (expError || !experiment) {
        setLaunchError(`Failed to create experiment: ${expError?.message ?? 'unknown'}`);
        setLaunching(false);
        return;
      }

      // Build agent assignments using the selected provider/model
      const chosenProvider = selectedProvider as ProviderType;
      const chosenModel = selectedModel;
      const agentAssignments = scenario.domainAgents.map(agent => ({
        agentName: agent.name,
        factorMappings: factors.reduce<Record<string, { provider: ProviderType; model: string; temperature: number }>>(
          (acc, factor) => {
            factor.levels.forEach(level => {
              acc[`${factor.name}=${level}`] = { provider: chosenProvider, model: chosenModel, temperature: 0.7 };
            });
            return acc;
          },
          {},
        ),
      }));

      const experimentDef: ExperimentDefinition = {
        id: experiment.id as string,
        scenarioId: resolvedScenarioId,
        name,
        description: `${cellCount} cells × ${nPerCell} dyads = ${totalDyads} total`,
        version: '1.0',
        factors: factors.map(f => ({ name: f.name, levels: f.levels })),
        targetNPerCell: nPerCell,
        bufferPercent: 0,
        agentAssignments,
        params: {},
        concurrency,
        devMode,
      };

      const runner = new ExperimentRunner(experimentDef, scenario, apiKeys);
      runnerRef.current = runner;

      // Register listener before calling start() to avoid race on 'experiment:started'
      const launchedExperimentId = await new Promise<string>((resolve, reject) => {
        const off = runner.on(event => {
          if (event.type === 'experiment:started') {
            off();
            resolve(event.experimentId);
          } else if (event.type === 'experiment:failed') {
            off();
            reject(new Error(event.error ?? 'Experiment failed to start'));
          }
        });

        // start() updates the experiment row, emits 'experiment:started', then runs dyads
        runner.start().catch(err => {
          reject(err instanceof Error ? err : new Error(String(err)));
        });
      });

      onLaunch?.(launchedExperimentId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setLaunchError(`Launch error: ${message}`);
      setLaunching(false);
    }
  };

  return (
    <div>
      <div className="r-page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {onBack && (
            <button className="r-btn r-btn-ghost r-btn-sm" onClick={onBack}>
              <Icon name="chevron" size={14} style={{ transform: 'rotate(180deg)' }} /> Back
            </button>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Experiments › Configure & Launch
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="r-page-title">Launch Experiment</h1>
            <p className="r-page-sub">
              Configure your factorial design and launch. {cellCount} cells × {nPerCell} dyads = {totalDyads} total.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <button
              className="r-btn r-btn-primary"
              onClick={handleLaunch}
              disabled={launching || factors.length === 0}
              style={{ opacity: launching ? 0.6 : 1 }}
            >
              {launching ? 'Launching...' : 'Launch Experiment'}
            </button>
            {launchError && (
              <span style={{ fontSize: 11, color: 'var(--accent-1)', maxWidth: 320, textAlign: 'right' }}>
                {launchError}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="r-page-body" style={{ maxWidth: 720 }}>
        {/* Experiment Name */}
        <div className="r-card" style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>
            Experiment Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 6,
              border: '1px solid var(--line-2)', background: 'var(--surface-panel)',
              color: 'var(--text-1)', fontSize: 13, fontFamily: 'var(--font-app)',
            }}
          />
        </div>

        {/* Factors */}
        <div className="r-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 15, fontWeight: 700, margin: 0 }}>
              Factors ({factors.length})
            </h3>
            <button className="r-btn r-btn-secondary r-btn-sm" onClick={addFactor}>
              <Icon name="plus" size={12} /> Add Factor
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {factors.map((factor, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 6, border: '1px solid var(--line-1)',
                background: 'var(--surface-sunken)',
                display: 'grid', gridTemplateColumns: '1fr 2fr 32px', gap: 10, alignItems: 'center',
              }}>
                <input
                  value={factor.name}
                  onChange={e => updateFactorName(i, e.target.value)}
                  placeholder="Factor name"
                  style={{
                    padding: '6px 10px', borderRadius: 4, border: '1px solid var(--line-2)',
                    background: 'var(--surface-panel)', color: 'var(--text-1)', fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <input
                  value={factor.levels.join(', ')}
                  onChange={e => updateFactorLevels(i, e.target.value)}
                  placeholder="Levels (comma-separated)"
                  style={{
                    padding: '6px 10px', borderRadius: 4, border: '1px solid var(--line-2)',
                    background: 'var(--surface-panel)', color: 'var(--text-1)', fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <button
                  onClick={() => removeFactor(i)}
                  style={{
                    width: 28, height: 28, borderRadius: 4, border: 0,
                    background: 'transparent', color: 'var(--text-4)', cursor: 'pointer',
                    display: 'grid', placeItems: 'center',
                  }}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-3)' }}>
            {cellCount} cell{cellCount !== 1 ? 's' : ''} from {factors.length} factor{factors.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Model Selection */}
        <div className="r-card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            Model
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 12px' }}>
            Which LLM provider and model should agents use? All domain agents in this experiment will use the same model.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>
                Provider
              </label>
              <select
                value={selectedProvider}
                onChange={e => setSelectedProvider(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6,
                  border: '1px solid var(--line-2)', background: 'var(--surface-panel)',
                  color: 'var(--text-1)', fontSize: 13, fontFamily: 'var(--font-ui)',
                }}
              >
                {PROVIDER_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label} {vault[VAULT_KEY_MAP[p.value] ?? 'gpt4'].length > 0 ? '✓' : '(no key)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>
                Model
              </label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6,
                  border: '1px solid var(--line-2)', background: 'var(--surface-panel)',
                  color: 'var(--text-1)', fontSize: 13, fontFamily: 'var(--font-mono)',
                }}
              >
                {(MODEL_OPTIONS[selectedProvider] ?? []).map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          {!hasKeyForProvider && (
            <p style={{ fontSize: 11.5, color: 'var(--accent-1)', marginTop: 8 }}>
              No API key for {PROVIDER_OPTIONS.find(p => p.value === selectedProvider)?.label}. Add one in the checklist below or go to Settings.
            </p>
          )}
        </div>

        {/* Settings */}
        <div className="r-card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            Run Settings
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>
                N per cell
              </label>
              <input
                type="number" min={1} max={200} value={nPerCell}
                onChange={e => setNPerCell(parseInt(e.target.value) || 1)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6,
                  border: '1px solid var(--line-2)', background: 'var(--surface-panel)',
                  color: 'var(--text-1)', fontSize: 13, fontFamily: 'var(--font-num)',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>
                Concurrency
              </label>
              <input
                type="number" min={1} max={20} value={concurrency}
                onChange={e => setConcurrency(parseInt(e.target.value) || 1)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6,
                  border: '1px solid var(--line-2)', background: 'var(--surface-panel)',
                  color: 'var(--text-1)', fontSize: 13, fontFamily: 'var(--font-num)',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>
                Dev Mode
              </label>
              <div
                onClick={() => setDevMode(!devMode)}
                style={{
                  width: 42, height: 24, borderRadius: 12, cursor: 'pointer',
                  background: devMode ? 'var(--accent-2)' : 'var(--line-2)',
                  position: 'relative', transition: 'background 140ms',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3,
                  left: devMode ? 21 : 3,
                  transition: 'left 140ms',
                  boxShadow: 'var(--shadow-1)',
                }} />
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 4 }}>
                {devMode ? 'Skip supervisors (cheap)' : 'Full run with supervisors'}
              </p>
            </div>
          </div>
        </div>

        {/* Pre-Launch Checklist */}
        {(() => {
          const hasFactors = factors.length > 0 && factors.every(f => f.levels.length >= 2);
          const hasName = name.trim().length > 0;
          const hasScenario = !!scenarioId;
          const nReasonable = nPerCell >= 1 && nPerCell <= 500;
          const concurrencyOk = concurrency >= 1 && concurrency <= 20;

          const checks: Array<{ label: string; ok: boolean; detail: string; tooltip: string; action?: () => void; actionLabel?: string }> = [
            { label: 'Experiment name', ok: hasName, detail: hasName ? name : 'Enter a name above', tooltip: 'Give your experiment a descriptive name so you can identify it later in the Results tab. E.g., "Capability asymmetry — pilot run".' },
            { label: 'Scenario selected', ok: hasScenario, detail: hasScenario ? `ID: ${scenarioId?.slice(0, 8)}...` : 'Go back and select a scenario first', tooltip: 'A scenario defines the agents, prompts, turn-taking policy, and outcome schema. Clone one from the Library or create a blank scenario first.' },
            { label: 'API key for selected provider', ok: hasKeyForProvider, detail: hasKeyForProvider ? `${PROVIDER_OPTIONS.find(p => p.value === selectedProvider)?.label} key configured` : `No key for ${PROVIDER_OPTIONS.find(p => p.value === selectedProvider)?.label ?? selectedProvider}${hasAnyKey ? ` (you have keys for: ${configuredProviders.map(p => p.label).join(', ')})` : ''}`, tooltip: 'You need an API key for the provider you selected above. The key is stored encrypted in your browser. Get one from the provider\'s developer console (e.g., platform.openai.com/api-keys for OpenAI, console.anthropic.com for Anthropic).', action: () => setShowKeyInput(true), actionLabel: 'Add key' },
            { label: 'Factors defined', ok: hasFactors, detail: hasFactors ? `${factors.length} factor(s), ${cellCount} cells` : 'Each factor needs at least 2 levels', tooltip: 'Factors are the independent variables in your experiment. Each factor has levels (e.g., "capability: strong, weak"). The platform cross-joins all factors to create cells. Each cell gets N dyads.' },
            { label: 'N per cell', ok: nReasonable, detail: nReasonable ? `${nPerCell} dyads × ${cellCount} cells = ${totalDyads} total` : 'Must be between 1 and 500', tooltip: 'How many agent-to-agent conversations to run per experimental cell. Higher N = more statistical power but more API cost. Start with 2–4 for testing, 50–150 for production.' },
            { label: 'Concurrency', ok: concurrencyOk, detail: concurrencyOk ? `${concurrency} parallel dyads` : 'Must be between 1 and 20', tooltip: 'How many dyads run simultaneously. Higher = faster but more API rate-limit risk. 5 is a safe default. Reduce to 1–2 if you hit rate limits.' },
            { label: 'Mode', ok: true, detail: devMode ? 'Dev mode — supervisors skipped (fast + cheap)' : 'Production — full supervisor pipeline', tooltip: 'Dev mode skips supervisor agents (judge, analyst, appraiser) to save API costs during testing. Use Production mode for real data collection — supervisors classify rounds, extract values, and score outcomes.' },
          ];

          const allOk = checks.every(c => c.ok);

          return (
            <div className="r-card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 15, fontWeight: 700, margin: 0 }}>
                  Pre-Launch Checklist
                </h3>
                <span className={allOk ? 'r-chip r-chip-green' : 'r-chip r-chip-orange'}>
                  {allOk ? 'All checks passed' : `${checks.filter(c => !c.ok).length} issue(s)`}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {checks.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 0',
                      borderBottom: i < checks.length - 1 ? '1px solid var(--line-1)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      display: 'grid', placeItems: 'center', marginTop: 1,
                      background: c.ok ? 'rgba(46,163,107,0.12)' : 'var(--accent-1-soft)',
                      color: c.ok ? 'var(--success)' : 'var(--accent-1)',
                    }}>
                      <Icon name={c.ok ? 'check' : 'x'} size={12} stroke={2.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{c.label}</span>
                        <span
                          title={c.tooltip}
                          style={{
                            width: 16, height: 16, borderRadius: '50%',
                            background: 'var(--surface-sunken)', border: '1px solid var(--line-1)',
                            display: 'inline-grid', placeItems: 'center',
                            fontSize: 10, fontWeight: 700, color: 'var(--text-4)',
                            cursor: 'help', flexShrink: 0,
                          }}
                        >
                          ?
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: c.ok ? 'var(--text-3)' : 'var(--accent-1)', marginTop: 2 }}>{c.detail}</div>
                    </div>
                    {!c.ok && c.action && (
                      <button className="r-btn r-btn-secondary r-btn-sm" onClick={c.action} style={{ marginTop: 1 }}>
                        {c.actionLabel ?? 'Fix'}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Inline API key input */}
              {showKeyInput && (
                <div style={{
                  marginTop: 12, padding: 12, borderRadius: 6,
                  background: 'var(--surface-sunken)', border: '1px solid var(--line-1)',
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: PROVIDER_OPTIONS.find(p => p.value === selectedProvider)?.dot ?? '#999' }} />
                    {PROVIDER_OPTIONS.find(p => p.value === selectedProvider)?.label ?? selectedProvider} API Key
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={keyInput}
                      onChange={e => setKeyInput(e.target.value)}
                      autoFocus
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 6,
                        border: '1px solid var(--line-2)', background: 'var(--surface-panel)',
                        color: 'var(--text-1)', fontSize: 12.5, fontFamily: 'var(--font-mono)',
                      }}
                    />
                    <button className="r-btn r-btn-primary r-btn-sm" onClick={handleSaveKey} disabled={!keyInput}>
                      Save
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '6px 0 0' }}>
                    Stored encrypted in your browser. Go to Settings for more providers.
                  </p>
                </div>
              )}

              {/* Summary stats */}
              <div style={{
                marginTop: 14, padding: '12px 0 0',
                borderTop: '1px dashed var(--line-1)',
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12,
              }}>
                <div>
                  <div style={{ color: 'var(--text-4)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Cells</div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 700 }}>{cellCount}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-4)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Dyads</div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 700 }}>{totalDyads}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-4)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Est. API calls</div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 700 }}>~{totalDyads * (devMode ? 10 : 15)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-4)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Mode</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    <span className={devMode ? 'r-chip r-chip-blue' : 'r-chip r-chip-orange'}>
                      {devMode ? 'Dev' : 'Production'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
