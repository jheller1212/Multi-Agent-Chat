import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { clearVault } from '../../lib/apiKeyVault';
import { ResearchShell } from './ResearchShell';
import { Library } from './Library';
import { RunDashboard } from './RunDashboard';
import { TranscriptViewer } from './TranscriptViewer';
import { ScenarioBuilder } from './ScenarioBuilder';
import { Icon } from './Icon';

type ResearchScreen = 'library' | 'scenario' | 'experiment' | 'runs' | 'results' | 'transcript' | 'settings' | 'chat' | 'history';

const BREADCRUMBS: Record<ResearchScreen, string[]> = {
  library: ['Research', 'Library'],
  scenario: ['Research', 'Scenarios', 'B2B Renegotiation — capability variant'],
  experiment: ['Research', 'Experiments'],
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
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
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

function PlaceholderScreen({ title, sub, icon }: { title: string; sub: string; icon: string }) {
  return (
    <div>
      <div className="r-page-head">
        <h1 className="r-page-title">{title}</h1>
        <p className="r-page-sub">{sub}</p>
      </div>
      <div className="r-page-body" style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <Icon name={icon} size={48} stroke={1} />
          <p style={{ marginTop: 16, fontSize: 14 }}>Coming soon — this section is under development.</p>
        </div>
      </div>
    </div>
  );
}

export function ResearchLayout({ onBack }: ResearchLayoutProps) {
  const [screen, setScreen] = useState<ResearchScreen>('library');

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

  return (
    <ResearchShell
      activePage={PAGE_MAP[screen]}
      breadcrumb={BREADCRUMBS[screen]}
      onNavClick={handleNavClick}
      onSignOut={handleSignOut}
    >
      {screen === 'library' && <Library />}
      {screen === 'scenario' && <ScenarioBuilder />}
      {screen === 'experiment' && <PlaceholderScreen title="Experiments" sub="Design and configure factorial experiments." icon="flask" />}
      {screen === 'runs' && <RunDashboard />}
      {screen === 'results' && <PlaceholderScreen title="Results" sub="Browse completed experiment results and download CSVs." icon="chart" />}
      {screen === 'transcript' && <TranscriptViewer />}
      {screen === 'settings' && <SettingsScreen onSignOut={handleSignOut} />}
      {screen === 'chat' && <PlaceholderScreen title="Quick Chat" sub="Two-agent conversations (legacy mode)." icon="chat" />}
      {screen === 'history' && <PlaceholderScreen title="History" sub="Browse past conversations." icon="clock" />}
    </ResearchShell>
  );
}
