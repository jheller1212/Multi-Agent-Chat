import { useState, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ResearchShellProps {
  activePage: string;
  breadcrumb: string[];
  children: ReactNode;
  onNavClick?: (page: string) => void;
  onSignOut?: () => void;
}

function BrandMark() {
  return (
    <div
      className="flex-shrink-0"
      style={{
        width: 28, height: 28, borderRadius: 7,
        background: 'linear-gradient(135deg, var(--accent-2) 0 50%, var(--accent-1) 50% 100%)',
        display: 'grid', placeItems: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute', inset: 4, borderRadius: 4,
          background: 'var(--surface-rail)',
        }}
      />
      <span
        style={{
          position: 'relative', zIndex: 1,
          fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 14,
          letterSpacing: '0.02em',
          background: 'linear-gradient(135deg, var(--accent-2) 0 50%, var(--accent-1) 50% 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        }}
      >
        M
      </span>
    </div>
  );
}

function Topbar({ breadcrumb, onSignOut }: { breadcrumb: string[]; onSignOut?: () => void }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div
      style={{
        gridColumn: '1 / -1', gridRow: 1,
        display: 'flex', alignItems: 'center',
        background: 'var(--surface-rail)',
        borderBottom: '1px solid var(--line-1)',
        padding: '0 20px 0 0',
        zIndex: 5, height: 'var(--topbar-h)',
      }}
    >
      {/* Brand */}
      <div
        style={{
          width: 'var(--rail-w)',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px',
          borderRight: '1px solid var(--line-1)',
          height: '100%',
        }}
      >
        <BrandMark />
        <div>
          <span
            style={{
              fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 15,
              letterSpacing: '-0.01em', color: 'var(--text-1)',
            }}
          >
            Multi‑Agent‑Chat
          </span>
          <span
            style={{
              fontStyle: 'normal', color: 'var(--text-3)',
              fontWeight: 400, fontSize: 11, marginLeft: 6,
              letterSpacing: '0.04em', textTransform: 'uppercase' as const,
            }}
          >
            RESEARCH
          </span>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-3)' }}>
          {breadcrumb.map((b, i) => (
            <span key={i}>
              {i > 0 && <span style={{ color: 'var(--text-4)', margin: '0 4px' }}>/</span>}
              <span style={i === breadcrumb.length - 1 ? { color: 'var(--text-1)', fontWeight: 500 } : undefined}>
                {b}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="r-btn r-btn-ghost r-btn-sm" style={{ gap: 6 }}>
          <Icon name="help" size={14} /> Docs
        </button>
        <button
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: 32, height: 32, borderRadius: 6,
            background: 'transparent', border: 0, color: 'var(--text-2)',
          }}
        >
          <Icon name="bell" />
        </button>
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: 32, height: 32, borderRadius: 6,
            background: 'transparent', border: 0, color: 'var(--text-2)',
          }}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 10px 4px 4px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--line-1)',
            fontSize: 12, color: 'var(--text-2)',
          }}
        >
          <div
            style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-2), var(--accent-1))',
              color: 'white', fontSize: 11, fontWeight: 700,
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-h)',
            }}
          >
            JH
          </div>
          jonasheller89
        </div>
        {onSignOut && (
          <button
            onClick={onSignOut}
            title="Sign out"
            className="flex items-center justify-center cursor-pointer"
            style={{
              width: 32, height: 32, borderRadius: 6,
              background: 'transparent', border: 0, color: 'var(--text-3)',
            }}
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function NavItem({ id, label, icon, badge, active, onClick }: {
  id: string; label: string; icon: string; badge?: string; active: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 6,
        cursor: 'pointer',
        fontFamily: 'var(--font-ui)',
        fontWeight: active ? 600 : 500,
        fontSize: 13,
        background: active ? 'var(--surface-active)' : 'transparent',
        color: active ? 'var(--accent-2)' : 'var(--text-2)',
        transition: 'background 140ms, color 140ms',
      }}
    >
      <Icon name={icon} size={16} className={active ? '' : ''} />
      <span>{label}</span>
      {badge && (
        <span
          style={{
            marginLeft: 'auto', fontSize: 10,
            background: active ? 'var(--accent-1-soft)' : 'var(--surface-hover)',
            color: active ? 'var(--accent-1)' : 'var(--text-3)',
            padding: '1px 6px', borderRadius: 'var(--radius-pill)',
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function Sidebar({ activePage, onNavClick }: { activePage: string; onNavClick?: (page: string) => void }) {
  return (
    <div
      style={{
        gridColumn: 1, gridRow: 2,
        background: 'var(--surface-rail)',
        borderRight: '1px solid var(--line-1)',
        padding: '14px 12px',
        display: 'flex', flexDirection: 'column', gap: 4,
        fontSize: 13, overflow: 'hidden',
      }}
    >
      <div style={{
        fontSize: 10.5, textTransform: 'uppercase' as const, letterSpacing: '0.08em',
        color: 'var(--text-4)', fontWeight: 600, padding: '14px 12px 6px',
        fontFamily: 'var(--font-ui)',
      }}>
        Workspace
      </div>
      <NavItem id="chat" label="Quick Chat" icon="chat" active={activePage === 'chat'} onClick={() => onNavClick?.('chat')} />
      <NavItem id="history" label="History" icon="clock" active={activePage === 'history'} onClick={() => onNavClick?.('history')} />

      <div style={{
        fontSize: 10.5, textTransform: 'uppercase' as const, letterSpacing: '0.08em',
        color: 'var(--text-4)', fontWeight: 600, padding: '14px 12px 6px',
        fontFamily: 'var(--font-ui)',
      }}>
        Research
      </div>
      <NavItem id="library" label="Library" icon="library" active={activePage === 'library'} onClick={() => onNavClick?.('library')} />
      <NavItem id="scenario" label="Scenarios" icon="book" badge="12" active={activePage === 'scenario'} onClick={() => onNavClick?.('scenario')} />
      <NavItem id="experiment" label="Experiments" icon="flask" badge="4" active={activePage === 'experiment'} onClick={() => onNavClick?.('experiment')} />
      <NavItem id="runs" label="Runs" icon="play" badge="2" active={activePage === 'runs'} onClick={() => onNavClick?.('runs')} />
      <NavItem id="results" label="Results" icon="chart" active={activePage === 'results'} onClick={() => onNavClick?.('results')} />

      <div style={{
        fontSize: 10.5, textTransform: 'uppercase' as const, letterSpacing: '0.08em',
        color: 'var(--text-4)', fontWeight: 600, padding: '14px 12px 6px',
        fontFamily: 'var(--font-ui)',
      }}>
        Account
      </div>
      <NavItem id="settings" label="Settings" icon="settings" active={activePage === 'settings'} />

      {/* Footer */}
      <div style={{
        marginTop: 'auto', padding: 12,
        borderTop: '1px solid var(--line-1)',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 6 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--accent-1-soft)', color: 'var(--accent-1)',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-h)', fontSize: 12, fontWeight: 700,
            flexShrink: 0,
          }}>
            DX
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>DEXLab · SBE</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>Maastricht U.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResearchShell({ activePage, breadcrumb, children, onNavClick, onSignOut }: ResearchShellProps) {
  return (
    <div
      data-density="compact"
      style={{
        width: '100%', height: '100vh',
        display: 'grid',
        gridTemplateColumns: 'var(--rail-w) 1fr',
        gridTemplateRows: 'var(--topbar-h) 1fr',
        background: 'var(--surface-canvas)',
        color: 'var(--text-1)',
        fontFamily: 'var(--font-app)',
        fontSize: 'var(--d-fs-body)',
      }}
    >
      <Topbar breadcrumb={breadcrumb} onSignOut={onSignOut} />
      <Sidebar activePage={activePage} onNavClick={onNavClick} />
      <div style={{ gridColumn: 2, gridRow: 2, overflow: 'auto', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}
