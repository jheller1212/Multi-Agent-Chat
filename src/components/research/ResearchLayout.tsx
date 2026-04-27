import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { clearVault } from '../../lib/apiKeyVault';
import { cloneScenario, saveScenario } from '../../lib/scenario/loader';
import { exportRunCSV, downloadCSV } from '../../lib/outcomes/csv-export';
import { ResearchShell } from './ResearchShell';
import { Library } from './Library';
import { RunDashboard } from './RunDashboard';
import { TranscriptViewer } from './TranscriptViewer';
import { ScenarioBuilder } from './ScenarioBuilder';
import { ExperimentLauncher } from './ExperimentLauncher';
import { Icon } from './Icon';

type ResearchScreen = 'library' | 'scenario' | 'experiment' | 'launch' | 'runs' | 'results' | 'transcript' | 'settings' | 'chat' | 'history';

const BREADCRUMBS: Record<ResearchScreen, string[]> = {
  library: ['Research', 'Library'],
  scenario: ['Research', 'Scenarios', 'B2B Renegotiation — capability variant'],
  experiment: ['Research', 'Experiments'],
  launch: ['Research', 'Experiments', 'Configure & Launch'],
  runs: ['Research', 'Experiments', 'Buyer Capability × Provider', 'Run #14'],
  results: ['Research', 'Results'],
  transcript: ['Research', 'Run #14', 'Cell A4', 'd_0247'],
  settings: ['Account', 'Settings'],
  chat: ['Workspace', 'Quick Chat'],
  history: ['Workspace', 'History'],
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
  chat: 'chat',
  history: 'history',
};

interface ResearchLayoutProps {
  onBack: () => void;
}

function SettingsScreen({ onSignOut }: { onSignOut: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

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
      setCurrentPassword('');
    }
  };

  return (
    <div>
      <div className="r-page-head">
        <h1 className="r-page-title">Settings</h1>
        <p className="r-page-sub">Manage your account and preferences.</p>
      </div>
      <div className="r-page-body" style={{ maxWidth: 560 }}>
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
      description: '',
      isPublic: false,
      isTemplate: false,
      domainAgents: [],
      supervisors: [],
      turnPolicy: { type: 'alternating', roundDefinition: [] },
      terminationConditions: [{ type: 'turn_cap', maxTurns: 10 }],
      outcomeSchema: { columns: [] },
    });
    if (blank) {
      setSelectedScenarioId(blank.id);
      setScreen('scenario');
    }
  }, []);

  return (
    <ResearchShell
      activePage={PAGE_MAP[screen]}
      breadcrumb={BREADCRUMBS[screen]}
      onNavClick={handleNavClick}
      onSignOut={handleSignOut}
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
      {screen === 'chat' && <QuickChatScreen onBack={onBack} />}
      {screen === 'history' && <HistoryScreen />}
    </ResearchShell>
  );
}
