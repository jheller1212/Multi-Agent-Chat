import { Icon } from './research/Icon';

interface HeroSectionProps {
  onSignUpClick: () => void;
}

export function HeroSection({ onSignUpClick }: HeroSectionProps) {
  return (
    <section
      style={{
        paddingTop: 'calc(var(--topbar-h) + 80px)',
        paddingBottom: 80,
        paddingLeft: 32,
        paddingRight: 32,
        background: 'var(--surface-canvas)',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="r-chip r-chip-blue" style={{ marginBottom: 20, display: 'inline-flex' }}>
          <span className="pulse-dot" style={{ width: 6, height: 6 }} />
          DEXLab · Maastricht University
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 44,
            lineHeight: 1.1, letterSpacing: '-0.02em',
            color: 'var(--text-1)', margin: '0 0 20px',
          }}
        >
          Run multi-agent{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, var(--accent-2), var(--accent-1))',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}
          >
            LLM experiments.
          </span>
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-app)', fontSize: 17, lineHeight: 1.6,
            color: 'var(--text-2)', margin: '0 0 36px', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto',
          }}
        >
          Configure scenarios, design factorial experiments, and collect structured
          research data — all from the browser. Built for procurement, legal advocacy,
          mediation, and any multi-agent interaction study.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={onSignUpClick}
            className="r-btn r-btn-primary"
            style={{ padding: '12px 28px', fontSize: 15 }}
          >
            <Icon name="play" size={16} />
            Create free account
          </button>
          <a
            href="https://github.com/jheller1212/Multi-Agent-Chat#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="r-btn r-btn-secondary"
            style={{ padding: '12px 28px', fontSize: 15, textDecoration: 'none' }}
          >
            <Icon name="book" size={16} />
            View docs
          </a>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-4)', fontFamily: 'var(--font-ui)' }}>
          Free to use · Bring your own API keys · 6 LLM providers supported
        </p>
      </div>
    </section>
  );
}
