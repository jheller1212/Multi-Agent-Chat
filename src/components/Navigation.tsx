import { Logo } from './Logo';

interface NavigationProps {
  onAuthClick: () => void;
  onSignUpClick: () => void;
  isAuthenticated: boolean;
}

export function Navigation({ onAuthClick, onSignUpClick, isAuthenticated }: NavigationProps) {
  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--surface-panel)',
        borderBottom: '1px solid var(--line-1)',
        height: 'var(--topbar-h)',
        display: 'flex', alignItems: 'center',
        padding: '0 32px',
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <Logo />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {!isAuthenticated && (
          <button
            onClick={onAuthClick}
            className="r-btn r-btn-ghost r-btn-sm"
          >
            Sign in
          </button>
        )}
        <button
          onClick={isAuthenticated ? onAuthClick : onSignUpClick}
          className="r-btn r-btn-primary r-btn-sm"
        >
          {isAuthenticated ? 'Open App' : 'Get Started'}
        </button>
      </div>
    </nav>
  );
}
