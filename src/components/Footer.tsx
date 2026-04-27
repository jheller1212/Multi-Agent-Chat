import { Logo } from './Logo';

interface FooterProps {
  onPrivacyClick: () => void;
  onTermsClick: () => void;
}

export function Footer({ onPrivacyClick, onTermsClick }: FooterProps) {
  return (
    <footer
      style={{
        background: 'var(--dex-deep-blue)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '48px 32px 32px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, marginBottom: 40 }}>
          {/* Brand */}
          <div style={{ flex: '1 1 280px' }}>
            <div style={{ marginBottom: 16 }}>
              <Logo />
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 280 }}>
              A research platform for multi-agent LLM experiments. Configure scenarios,
              run factorial designs, and export structured data.
            </p>
            <div
              style={{
                marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 6,
                background: 'rgba(255,255,255,0.06)',
                fontSize: 12, color: 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-ui)',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 4,
                background: 'var(--accent-1-soft)', color: 'var(--accent-1)',
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--font-h)', fontSize: 10, fontWeight: 700,
              }}>
                DX
              </div>
              DEXLab · School of Business and Economics · Maastricht University
            </div>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>
              Legal
            </div>
            <button
              onClick={onPrivacyClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-app)', padding: 0 }}
            >
              Privacy Policy
            </button>
            <button
              onClick={onTermsClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-app)', padding: 0 }}
            >
              Terms of Use
            </button>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 20,
            display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
            gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-ui)',
          }}
        >
          <span>&copy; {new Date().getFullYear()} Multi-Agent-Chat · All rights reserved</span>
          <span>Conversations stored via Supabase · Not affiliated with OpenAI, Anthropic, Google, or Mistral</span>
        </div>
      </div>
    </footer>
  );
}
