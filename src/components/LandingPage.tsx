import { Navigation } from './Navigation';
import { HeroSection } from './HeroSection';
import { Footer } from './Footer';
import { Icon } from './research/Icon';

interface LandingPageProps {
  onAuthClick: () => void;
  onSignUpClick: () => void;
  isAuthenticated: boolean;
  onPrivacyClick: () => void;
  onTermsClick: () => void;
}

const features = [
  {
    icon: 'book',
    title: 'Scenario Builder',
    desc: 'Define agent roles, system prompts, and conversation structure for any multi-agent interaction.',
  },
  {
    icon: 'sliders',
    title: 'Experiment Designer',
    desc: 'Set up factorial designs with conditions, treatments, and replication counts in minutes.',
  },
  {
    icon: 'chart',
    title: 'Live Monitoring',
    desc: 'Watch runs in real time with per-cell progress, anomaly detection, and event logs.',
  },
  {
    icon: 'download',
    title: 'Structured Export',
    desc: 'Export full conversation transcripts and metadata as structured JSON or CSV for analysis.',
  },
];

const scenarios = [
  {
    tag: 'Procurement',
    tagClass: 'r-chip-orange',
    title: 'B2B Negotiation',
    desc: 'Buyer and supplier agents negotiate price, volume, and delivery terms across conditions.',
    agents: ['Buyer Agent', 'Supplier Agent'],
  },
  {
    tag: 'Legal',
    tagClass: 'r-chip-blue',
    title: 'Legal Advocacy',
    desc: 'Opposing counsel agents debate a case with configurable argumentation strategies.',
    agents: ['Plaintiff Counsel', 'Defense Counsel'],
  },
  {
    tag: 'Mediation',
    tagClass: 'r-chip-grey',
    title: 'Conflict Mediation',
    desc: 'A neutral mediator agent facilitates structured dialogue between two disputing parties.',
    agents: ['Party A', 'Mediator', 'Party B'],
  },
];

export function LandingPage({ onAuthClick, onSignUpClick, isAuthenticated, onPrivacyClick, onTermsClick }: LandingPageProps) {
  return (
    <div style={{ background: 'var(--surface-canvas)', fontFamily: 'var(--font-app)', color: 'var(--text-1)' }}>
      <Navigation onAuthClick={onAuthClick} onSignUpClick={onSignUpClick} isAuthenticated={isAuthenticated} />
      <HeroSection onSignUpClick={onSignUpClick} />

      {/* Features section */}
      <section style={{ padding: '64px 32px', background: 'var(--surface-panel)', borderTop: '1px solid var(--line-1)', borderBottom: '1px solid var(--line-1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 28,
                letterSpacing: '-0.01em', color: 'var(--text-1)', margin: '0 0 10px',
              }}
            >
              Everything you need to run LLM research
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', margin: 0 }}>
              From scenario configuration to structured data export.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {features.map((f) => (
              <div key={f.title} className="r-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'var(--accent-2-soft)',
                    color: 'var(--accent-2)',
                    display: 'grid', placeItems: 'center',
                  }}
                >
                  <Icon name={f.icon} size={18} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 14,
                      color: 'var(--text-1)', marginBottom: 6,
                    }}
                  >
                    {f.title}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenario templates */}
      <section style={{ padding: '64px 32px', background: 'var(--surface-canvas)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 28,
                letterSpacing: '-0.01em', color: 'var(--text-1)', margin: '0 0 10px',
              }}
            >
              Built-in scenario templates
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', margin: 0 }}>
              Start with a validated template or build your own from scratch.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {scenarios.map((s) => (
              <div
                key={s.title}
                className="r-card"
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={`r-chip ${s.tagClass}`}>{s.tag}</span>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 15,
                      color: 'var(--text-1)', marginBottom: 8,
                    }}
                  >
                    {s.title}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>
                    {s.desc}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                  {s.agents.map((a) => (
                    <span key={a} className="r-chip r-chip-grey" style={{ fontSize: 11 }}>
                      <Icon name="bot" size={11} />
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section
        style={{
          padding: '64px 32px',
          background: 'var(--dex-deep-blue)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 28,
              letterSpacing: '-0.01em', color: '#FFFFFF', margin: '0 0 14px',
            }}
          >
            Ready to run your first experiment?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', margin: '0 0 28px', lineHeight: 1.6 }}>
            Free to use. Bring your own API keys. Deploy in minutes.
          </p>
          <button
            onClick={onSignUpClick}
            className="r-btn r-btn-primary"
            style={{ padding: '12px 28px', fontSize: 15 }}
          >
            <Icon name="arrowRight" size={16} />
            Create free account
          </button>
        </div>
      </section>

      <Footer onPrivacyClick={onPrivacyClick} onTermsClick={onTermsClick} />
    </div>
  );
}
