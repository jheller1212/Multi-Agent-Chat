import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { clearVault, loadVault, saveVault, type ProviderVault } from '../../lib/apiKeyVault';
import { cloneScenario, saveScenario } from '../../lib/scenario/loader';
import { exportRunCSV, downloadCSV } from '../../lib/outcomes/csv-export';
import { ResearchShell } from './ResearchShell';
import { Library } from './Library';
import { RunDashboard } from './RunDashboard';
import { TranscriptViewer } from './TranscriptViewer';
import { ScenarioBuilder } from './ScenarioBuilder';
import { ExperimentLauncher } from './ExperimentLauncher';
import { OnboardingTour } from './OnboardingTour';
import { Icon } from './Icon';

type ResearchScreen = 'library' | 'scenario' | 'experiment' | 'launch' | 'runs' | 'results' | 'transcript' | 'settings';

const BREADCRUMBS: Record<ResearchScreen, string[]> = {
  library: ['Research', 'Library'],
  scenario: ['Research', 'Scenarios', 'B2B Renegotiation — capability variant'],
  experiment: ['Research', 'Experiments'],
  launch: ['Research', 'Experiments', 'Configure & Launch'],
  runs: ['Research', 'Experiments', 'Buyer Capability × Provider', 'Run #14'],
  results: ['Research', 'Results'],
  transcript: ['Research', 'Run #14', 'Cell A4', 'd_0247'],
  settings: ['Account', 'Settings'],
};

const PAGE_MAP: Record<ResearchScreen, string> = {
  library: 'library',
  scenario: 'scenario',
  experiment: 'experiment',
  launch: 'experiment',
  runs: 'runs',
  results: 'results',
  transcript: 'runs',
  settings: 'settings',
};

interface ResearchLayoutProps {
  onBack: () => void;
}

const PROVIDER_FIELDS: Array<{
  key: keyof ProviderVault;
  label: string;
  color: string;
  placeholder: string;
}> = [
  { key: 'gpt4',    label: 'OpenAI',   color: '#10A37F', placeholder: 'sk-...' },
  { key: 'claude',  label: 'Anthropic', color: '#D97757', placeholder: 'sk-ant-...' },
  { key: 'gemini',  label: 'Google (Gemini)', color: '#4285F4', placeholder: 'AIza...' },
  { key: 'mistral', label: 'Mistral',  color: '#FA520F', placeholder: 'xxxxxxxx...' },
  { key: 'meta',    label: 'Meta',     color: '#0064E0', placeholder: 'llama-api-...' },
  { key: 'alibaba', label: 'Alibaba',  color: '#FF6A00', placeholder: 'sk-...' },
];

function ApiKeyRow({
  fieldKey, label, color, placeholder, value, onChange,
}: {
  fieldKey: keyof ProviderVault;
  label: string;
  color: string;
  placeholder: string;
  value: string;
  onChange: (key: keyof ProviderVault, val: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onChange(fieldKey, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: color, display: 'inline-block', flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-h)' }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type={show ? 'text' : 'password'}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(fieldKey, e.target.value)}
            style={{
              width: '100%', padding: '7px 36px 7px 10px', borderRadius: 6,
              border: '1px solid var(--line-2)', background: 'var(--surface-panel)',
              color: 'var(--text-1)', fontSize: 12.5, fontFamily: 'var(--font-mono)',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={() => setShow(s => !s)}
            title={show ? 'Hide' : 'Show'}
            style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 0, cursor: 'pointer',
              color: show ? 'var(--accent-2)' : 'var(--text-3)', padding: 2, lineHeight: 1,
            }}
          >
            <Icon name="eye" size={14} />
          </button>
        </div>
        <button
          className="r-btn r-btn-secondary r-btn-sm"
          onClick={handleSave}
          style={saved ? { borderColor: '#22c55e', color: '#22c55e' } : undefined}
        >
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function SettingsScreen({ onSignOut }: { onSignOut: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [vault, setVault] = useState<ProviderVault>(() => loadVault());

  useEffect(() => {
    setVault(loadVault());
  }, []);

  const handleKeyChange = (key: keyof ProviderVault, val: string) => {
    const updated = { ...vault, [key]: val };
    setVault(updated);
    saveVault(updated);
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Password updated successfully.');
      setNewPassword('');
    }
  };

  return (
    <div>
      <div className="r-page-head">
        <h1 className="r-page-title">Settings</h1>
        <p className="r-page-sub">Manage your account and preferences.</p>
      </div>
      <div className="r-page-body" style={{ maxWidth: 560 }}>

        {/* API Keys */}
        <div className="r-card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            Provider API Keys
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}>
            Keys are stored encrypted in your browser and synced to Supabase. They are never sent to our servers.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PROVIDER_FIELDS.map(f => (
              <ApiKeyRow
                key={f.key}
                fieldKey={f.key}
                label={f.label}
                color={f.color}
                placeholder={f.placeholder}
                value={vault[f.key]}
                onChange={handleKeyChange}
              />
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div className="r-card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            Change Password
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 6,
                border: '1px solid var(--line-2)', background: 'var(--surface-panel)',
                color: 'var(--text-1)', fontSize: 13, fontFamily: 'var(--font-app)',
              }}
            />
            <button className="r-btn r-btn-primary" onClick={handlePasswordChange}>
              Update Password
            </button>
            {message && (
              <p style={{ fontSize: 12, color: message.startsWith('Error') ? 'var(--accent-1)' : 'var(--success)' }}>
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="r-card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            Danger Zone
          </h3>
          <button
            className="r-btn r-btn-secondary"
            onClick={onSignOut}
            style={{ borderColor: 'var(--accent-1)', color: 'var(--accent-1)' }}
          >
            <Icon name="x" size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

interface RunRow {
  id: string;
  status: string | null;
  config_snapshot: Record<string, unknown> | null;
  progress: { total?: number; completed?: number } | null;
  started_at: string | null;
  completed_at: string | null;
}

function ResultsScreen() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('experiment_runs')
        .select('id, status, config_snapshot, progress, started_at, completed_at')
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(50);
      setRuns((data ?? []) as RunRow[]);
      setLoading(false);
    })();
  }, []);

  const handleDownload = async (runId: string, name: string | null) => {
    setDownloading(runId);
    const csv = await exportRunCSV(runId);
    if (csv) downloadCSV(csv, `${name ?? runId}.csv`);
    setDownloading(null);
  };

  return (
    <div>
      <div className="r-page-head">
        <h1 className="r-page-title">Results</h1>
        <p className="r-page-sub">Completed experiment runs — download CSV outputs.</p>
      </div>
      <div className="r-page-body">
        {loading ? (
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading…</p>
        ) : runs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', paddingTop: 60 }}>
            <Icon name="chart" size={48} stroke={1} />
            <p style={{ marginTop: 16, fontSize: 14 }}>No completed runs yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720 }}>
            {runs.map(run => (
              <div
                key={run.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', border: '1px solid var(--line-1)',
                  borderRadius: 8, background: 'var(--surface-panel)',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-h)', fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
                    Run {run.id.slice(0, 8)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                    {run.progress?.completed ?? 0} / {run.progress?.total ?? '?'} dyads &middot;{' '}
                    {run.started_at ? new Date(run.started_at).toLocaleDateString() : '—'}
                  </div>
                </div>
                <button
                  className="r-btn r-btn-secondary r-btn-sm"
                  onClick={() => void handleDownload(run.id, `run-${run.id.slice(0, 8)}`)}
                  disabled={downloading === run.id}
                >
                  <Icon name="download" size={13} />
                  {downloading === run.id ? 'Downloading…' : 'Download CSV'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickChatScreen({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <div className="r-page-head">
        <h1 className="r-page-title">Quick Chat</h1>
        <p className="r-page-sub">Two-agent conversations in legacy mode.</p>
      </div>
      <div className="r-page-body" style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <Icon name="chat" size={48} stroke={1} />
          <p style={{ marginTop: 16, fontSize: 14 }}>Use Quick Chat to run informal two-agent conversations.</p>
          <button className="r-btn r-btn-primary" style={{ marginTop: 16 }} onClick={onBack}>
            Back to classic view
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConversationRow {
  id: string;
  created_at: string | null;
  title: string | null;
  model1_type: string | null;
  model2_type: string | null;
}

function HistoryScreen() {
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('conversations')
        .select('id, created_at, title, model1_type, model2_type')
        .order('created_at', { ascending: false })
        .limit(50);
      setRows((data ?? []) as ConversationRow[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="r-page-head">
        <h1 className="r-page-title">History</h1>
        <p className="r-page-sub">Recent conversations and experiments.</p>
      </div>
      <div className="r-page-body">
        {loading ? (
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading…</p>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', paddingTop: 60 }}>
            <Icon name="clock" size={48} stroke={1} />
            <p style={{ marginTop: 16, fontSize: 14 }}>No history yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 720 }}>
            {rows.map(row => (
              <div
                key={row.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', border: '1px solid var(--line-1)',
                  borderRadius: 8, background: 'var(--surface-panel)',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-h)', fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                    {row.title ?? 'Untitled conversation'}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                    {row.model1_type ?? ''} × {row.model2_type ?? ''} &middot;{' '}
                    {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ResearchLayout({ onBack }: ResearchLayoutProps) {
  const [screen, setScreen] = useState<ResearchScreen>('library');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedDyadId, setSelectedDyadId] = useState<string | null>(null);
  const [showTour, setShowTour] = useState<boolean>(
    () => !localStorage.getItem('mac_tour_completed'),
  );

  const handleSignOut = async () => {
    clearVault();
    await supabase.auth.signOut();
    onBack();
  };

  const handleNavClick = (page: string) => {
    if (page in PAGE_MAP) {
      setScreen(page as ResearchScreen);
    }
  };

  const handleEditScenario = useCallback((id: string) => {
    setSelectedScenarioId(id);
    setScreen('scenario');
  }, []);

  const handleCloneAndEdit = useCallback(async (id: string) => {
    const cloned = await cloneScenario(id);
    if (cloned) {
      setSelectedScenarioId(cloned.id);
      setScreen('scenario');
    }
  }, []);

  const handleNewScenario = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const blank = await saveScenario({
      name: 'Untitled Scenario',
      description: 'A new multi-agent research scenario.',
      isPublic: false,
      isTemplate: false,
      domainAgents: [
        { name: 'Agent A', description: 'First participant in the conversation.', defaultPromptTemplate: 'You are Agent A. Engage in a natural conversation with Agent B.\n\nGUIDELINES\n- Speak naturally, one message per turn.\n- Keep messages concise (no more than 150 words).' },
        { name: 'Agent B', description: 'Second participant in the conversation.', defaultPromptTemplate: 'You are Agent B. Engage in a natural conversation with Agent A.\n\nGUIDELINES\n- Speak naturally, one message per turn.\n- Keep messages concise (no more than 150 words).' },
      ],
      supervisors: [],
      turnPolicy: { type: 'alternating', roundDefinition: ['Agent A', 'Agent B'] },
      terminationConditions: [{ type: 'turn_cap', maxTurns: 12 }],
      outcomeSchema: {
        columns: [
          { name: 'dyad_id', type: 'string' },
          { name: 'outcome', type: 'string', nullable: true },
          { name: 'rounds_used', type: 'integer' },
        ],
      },
    });
    if (blank) {
      setSelectedScenarioId(blank.id);
      setScreen('scenario');
    }
  }, []);

  const handleTourNavigate = useCallback((tourScreen: 'library' | 'scenario' | 'experiment' | 'runs' | 'settings') => {
    setScreen(tourScreen);
  }, []);

  return (
    <ResearchShell
      activePage={PAGE_MAP[screen]}
      breadcrumb={BREADCRUMBS[screen]}
      onNavClick={handleNavClick}
      onSignOut={handleSignOut}
      onTakeTour={() => setShowTour(true)}
    >
      {screen === 'library' && (
        <Library
          onEditScenario={handleEditScenario}
          onCloneScenario={handleCloneAndEdit}
          onNewScenario={handleNewScenario}
          onViewRuns={() => setScreen('runs')}
        />
      )}
      {screen === 'scenario' && (
        <ScenarioBuilder
          scenarioId={selectedScenarioId ?? undefined}
          onUseInExperiment={(id) => { setSelectedScenarioId(id); setScreen('experiment'); }}
        />
      )}
      {screen === 'experiment' && (
        <ExperimentLauncher
          scenarioId={selectedScenarioId ?? undefined}
          scenarioName="Experiment"
          onLaunch={(runId) => { setSelectedRunId(runId); setScreen('runs'); }}
          onBack={() => setScreen('library')}
        />
      )}
      {screen === 'launch' && (
        <ExperimentLauncher
          scenarioId={selectedScenarioId ?? undefined}
          scenarioName="Experiment"
          onLaunch={(runId) => { setSelectedRunId(runId); setScreen('runs'); }}
          onBack={() => setScreen('scenario')}
        />
      )}
      {screen === 'runs' && (
        <RunDashboard
          runId={selectedRunId ?? undefined}
          onInspectDyad={(dyadId: string) => { setSelectedDyadId(dyadId); setScreen('transcript'); }}
        />
      )}
      {screen === 'results' && <ResultsScreen />}
      {screen === 'transcript' && (
        <TranscriptViewer
          dyadId={selectedDyadId ?? undefined}
          onBack={() => setScreen('runs')}
        />
      )}
      {screen === 'settings' && <SettingsScreen onSignOut={handleSignOut} />}
      {showTour && (
        <OnboardingTour
          onNavigate={handleTourNavigate}
          onClose={() => setShowTour(false)}
        />
      )}
    </ResearchShell>
  );
}
