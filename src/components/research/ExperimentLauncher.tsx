import { useState } from 'react';
import { Icon } from './Icon';
import { supabase } from '../../lib/supabase';

interface ExperimentLauncherProps {
  scenarioId?: string;
  scenarioName?: string;
  onLaunch?: (runId: string) => void;
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

export function ExperimentLauncher({ scenarioId, scenarioName, onLaunch, onBack }: ExperimentLauncherProps) {
  const [name, setName] = useState(`${scenarioName ?? 'Experiment'} — run`);
  const [factors, setFactors] = useState<FactorConfig[]>(DEFAULT_FACTORS);
  const [nPerCell, setNPerCell] = useState(8);
  const [concurrency, setConcurrency] = useState(5);
  const [devMode, setDevMode] = useState(true);
  const [launching, setLaunching] = useState(false);

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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLaunching(false); return; }

      // Create experiment
      const { data: experiment, error: expError } = await supabase
        .from('research_experiments')
        .insert({
          user_id: user.id,
          scenario_id: scenarioId ?? '00000000-0000-0000-0000-000000000000',
          name,
          description: `${cellCount} cells × ${nPerCell} dyads = ${totalDyads} total`,
          config: { factors, nPerCell, concurrency, devMode },
          status: 'running',
          progress: { total: totalDyads, completed: 0, failed: 0, excluded: 0 },
        })
        .select()
        .single();

      if (expError || !experiment) {
        console.error('Failed to create experiment:', expError);
        setLaunching(false);
        return;
      }

      // Create run
      const { data: run, error: runError } = await supabase
        .from('experiment_runs')
        .insert({
          experiment_id: experiment.id,
          status: 'running',
          config_snapshot: { factors, nPerCell, concurrency, devMode },
          prompt_hashes: {},
          progress: { total: totalDyads, completed: 0, failed: 0, excluded: 0 },
        })
        .select()
        .single();

      if (runError || !run) {
        console.error('Failed to create run:', runError);
        setLaunching(false);
        return;
      }

      onLaunch?.(run.id);
    } catch (err) {
      console.error('Launch error:', err);
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
          <button
            className="r-btn r-btn-primary"
            onClick={handleLaunch}
            disabled={launching || factors.length === 0}
            style={{ opacity: launching ? 0.6 : 1 }}
          >
            {launching ? 'Launching...' : '🚀 Launch Experiment'}
          </button>
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

        {/* Summary */}
        <div className="r-card" style={{
          background: 'var(--surface-sunken)', borderStyle: 'dashed',
        }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
            Launch Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12 }}>
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
                <span className={devMode ? 'r-chip-blue r-chip' : 'r-chip-orange r-chip'}>
                  {devMode ? 'Dev' : 'Production'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
