import { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from './Icon';
import { supabase } from '../../lib/supabase';
import { loadScenarios, seedScenarioTemplates, cloneScenario } from '../../lib/scenario/loader';
import type { Scenario } from '../../types/scenario';

/* ------------------------------------------------------------------ */
/*  Mock / fallback data                                               */
/* ------------------------------------------------------------------ */

interface MockScenario {
  id: string;
  title: string;
  blurb: string;
  domain: string;
  agents: number;
  rounds: number;
  tags: string[];
  featured: boolean;
  icon: string;
  accent: 'blue' | 'orange' | 'grey';
  runs: number;
  citations: number;
}

const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: 'proc-neg',
    title: 'Procurement Negotiation',
    blurb: 'Buyer and seller negotiate price, volume and delivery terms. Walk-away thresholds, BATNA modelling, multi-issue bargaining.',
    domain: 'Negotiation',
    agents: 2,
    rounds: 12,
    tags: ['multi-issue', 'BATNA', 'utility'],
    featured: true,
    icon: 'handshake',
    accent: 'blue',
    runs: 38,
    citations: 4,
  },
  {
    id: 'legal-adv',
    title: 'Legal Advocacy',
    blurb: 'Plaintiff and defendant advocates argue before a judge. Closed-record advocacy, three-claim structure, ruling and rationale.',
    domain: 'Law',
    agents: 3,
    rounds: 6,
    tags: ['advocacy', 'judge-decision', 'rationale'],
    featured: true,
    icon: 'scale',
    accent: 'orange',
    runs: 21,
    citations: 2,
  },
  {
    id: 'mediation',
    title: 'Mediation',
    blurb: 'Neutral mediator shepherds two disputing parties toward settlement. Caucus + joint-session protocol, integrative bargaining.',
    domain: 'Negotiation',
    agents: 3,
    rounds: 14,
    tags: ['integrative', 'mediator', 'settlement'],
    featured: true,
    icon: 'spark',
    accent: 'blue',
    runs: 12,
    citations: 1,
  },
  {
    id: 'cbt',
    title: 'CBT Therapy Session',
    blurb: 'Therapist guides a patient through cognitive behavioural reframing. Open-ended affective protocol with adherence rubric.',
    domain: 'Psychology',
    agents: 2,
    rounds: 10,
    tags: ['protocol-adherence', 'open-ended'],
    featured: false,
    icon: 'sparkle',
    accent: 'grey',
    runs: 6,
    citations: 0,
  },
  {
    id: 'persuade',
    title: 'Persuasion Cascade',
    blurb: 'Source agent attempts to shift target\'s stated belief on a public-issue prompt. Pre/post Likert, argument coding.',
    domain: 'Marketing',
    agents: 2,
    rounds: 8,
    tags: ['attitude-change', 'pre-post'],
    featured: false,
    icon: 'target',
    accent: 'grey',
    runs: 9,
    citations: 1,
  },
  {
    id: 'jury',
    title: 'Jury Deliberation',
    blurb: 'N=6 jurors deliberate on a vignette case. Holdouts, leadership patterns, verdict pathway.',
    domain: 'Law',
    agents: 6,
    rounds: 20,
    tags: ['group', 'verdict', 'leadership'],
    featured: false,
    icon: 'layers',
    accent: 'grey',
    runs: 3,
    citations: 0,
  },
];

interface MockYourScenario {
  id: string;
  title: string;
  updated: string;
  based: string;
  runs: number;
  draft: boolean;
}

const MOCK_YOUR_SCENARIOS: MockYourScenario[] = [
  { id: 'y1', title: 'B2B Renegotiation — capability variant', updated: '2 days ago', based: 'Procurement Negotiation', runs: 4, draft: false },
  { id: 'y2', title: 'Mediation w/ asymmetric info', updated: 'last week', based: 'Mediation', runs: 1, draft: false },
  { id: 'y3', title: 'Sales-rep persuasion (draft)', updated: 'just now', based: 'Persuasion Cascade', runs: 0, draft: true },
];

const DOMAIN_MAP: Record<string, string> = {
  'Procurement Negotiation': 'Negotiation',
  'Legal Advocacy': 'Law',
  'Mediation': 'Negotiation',
};

const ICON_MAP: Record<string, string> = {
  'Procurement Negotiation': 'handshake',
  'Legal Advocacy': 'scale',
  'Mediation': 'spark',
};

const ACCENT_MAP: Record<string, 'blue' | 'orange' | 'grey'> = {
  'Procurement Negotiation': 'blue',
  'Legal Advocacy': 'orange',
  'Mediation': 'blue',
};

const FILTERS = ['All domains', 'Negotiation', 'Law', 'Psychology', 'Marketing'] as const;

/* ------------------------------------------------------------------ */
/*  Helpers to map Scenario -> display card format                      */
/* ------------------------------------------------------------------ */

function scenarioToCard(s: Scenario): MockScenario {
  return {
    id: s.id,
    title: s.name,
    blurb: s.description,
    domain: DOMAIN_MAP[s.name] ?? 'Research',
    agents: s.domainAgents?.length ?? 2,
    rounds: s.terminationConditions?.find(
      (tc): tc is { type: 'turn_cap'; maxTurns: number } => tc.type === 'turn_cap'
    )?.maxTurns ?? 10,
    tags: s.supervisors?.map(sup => sup.type) ?? [],
    featured: s.isTemplate,
    icon: ICON_MAP[s.name] ?? 'sparkle',
    accent: ACCENT_MAP[s.name] ?? 'grey',
    runs: 0,
    citations: 0,
  };
}

function scenarioToYourCard(s: Scenario): MockYourScenario {
  const updated = s.updatedAt ? new Date(s.updatedAt) : new Date();
  const diffMs = Date.now() - updated.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let updatedLabel = 'just now';
  if (diffDays > 7) updatedLabel = `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  else if (diffDays > 0) updatedLabel = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return {
    id: s.id,
    title: s.name,
    updated: updatedLabel,
    based: '',
    runs: 0,
    draft: false,
  };
}

/* ------------------------------------------------------------------ */
/*  Accent helpers                                                     */
/* ------------------------------------------------------------------ */

const accentBg: Record<string, string> = {
  blue: 'var(--accent-2-soft)',
  orange: 'var(--accent-1-soft)',
  grey: 'var(--surface-sunken)',
};
const accentColor: Record<string, string> = {
  blue: 'var(--accent-2)',
  orange: 'var(--accent-1)',
  grey: 'var(--text-3)',
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ScenarioCard({
  s,
  onClone,
  onPreview,
}: {
  s: MockScenario;
  onClone: (id: string) => void;
  onPreview?: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPreview?.(s.id)}
      style={{
        background: 'var(--surface-panel)',
        border: `1px solid ${hovered ? 'var(--line-2)' : 'var(--line-1)'}`,
        borderRadius: 8,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
        boxShadow: hovered ? 'var(--shadow-2)' : 'none',
        cursor: onPreview ? 'pointer' : 'default',
      }}
    >
      {/* Head: icon + meta chips */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: accentBg[s.accent],
            color: accentColor[s.accent],
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}
        >
          <Icon name={s.icon} size={20} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="r-chip r-chip-grey">{s.domain}</span>
          {s.featured && (
            <span className="r-chip r-chip-orange">
              <Icon name="star" size={10} /> Featured
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: 'var(--font-h)', fontSize: 15, fontWeight: 700,
          letterSpacing: '-0.01em', margin: 0, color: 'var(--text-1)',
        }}
      >
        {s.title}
      </h3>

      {/* Blurb */}
      <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-2)', margin: 0 }}>
        {s.blurb}
      </p>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: 'var(--text-3)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="bot" size={12} /> {s.agents} agents
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="refresh" size={12} /> {s.rounds} rounds
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="play" size={12} /> {s.runs} runs
        </span>
        {s.citations > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="book" size={12} /> {s.citations} cites
          </span>
        )}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {s.tags.map((t) => (
          <span
            key={t}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10.5,
              padding: '2px 6px', background: 'var(--surface-sunken)',
              color: 'var(--text-3)', borderRadius: 3,
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex', gap: 6, marginTop: 4,
          borderTop: '1px solid var(--line-1)', paddingTop: 10,
          justifyContent: 'flex-end',
        }}
      >
        <button
          className="r-btn r-btn-ghost r-btn-sm"
          onClick={(e) => { e.stopPropagation(); onPreview?.(s.id); }}
        >
          <Icon name="eye" size={13} /> Preview
        </button>
        <button
          className="r-btn r-btn-secondary r-btn-sm"
          onClick={(e) => { e.stopPropagation(); onClone(s.id); }}
        >
          <Icon name="copy" size={13} /> Clone
        </button>
      </div>
    </div>
  );
}

function YourCard({
  y,
  onEdit,
  onRun,
}: {
  y: MockYourScenario;
  onEdit?: (id: string) => void;
  onRun?: () => void;
}) {
  return (
    <div
      onClick={() => onEdit?.(y.id)}
      style={{
        background: 'var(--surface-panel)',
        border: '1px solid var(--line-1)',
        borderRadius: 8,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        cursor: onEdit ? 'pointer' : 'default',
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>
          {y.title}
        </div>
        {y.draft && <span className="r-chip r-chip-orange">Draft</span>}
      </div>

      {/* Meta */}
      <div
        style={{
          fontSize: 11.5, color: 'var(--text-3)',
          display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
        }}
      >
        {y.based && (
          <>
            <span>Based on <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>{y.based}</strong></span>
            <span style={{ color: 'var(--text-4)' }}>·</span>
          </>
        )}
        <span>Updated {y.updated}</span>
        <span style={{ color: 'var(--text-4)' }}>·</span>
        <span>{y.runs} run{y.runs === 1 ? '' : 's'}</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, marginTop: 2, marginLeft: -8 }}>
        <button
          className="r-btn r-btn-ghost r-btn-sm"
          onClick={(e) => { e.stopPropagation(); onEdit?.(y.id); }}
        >
          <Icon name="edit" size={12} /> Edit
        </button>
        <button
          className="r-btn r-btn-ghost r-btn-sm"
          onClick={(e) => { e.stopPropagation(); onRun?.(); }}
        >
          <Icon name="play" size={12} /> Run
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Library component                                             */
/* ------------------------------------------------------------------ */

interface LibraryProps {
  onEditScenario?: (id: string) => void;
  onCloneScenario?: (id: string) => void;
  onNewScenario?: () => void;
  onViewRuns?: () => void;
}

export function Library({ onEditScenario, onCloneScenario, onNewScenario, onViewRuns }: LibraryProps) {
  const [filter, setFilter] = useState<string>('All domains');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [templateCards, setTemplateCards] = useState<MockScenario[]>(MOCK_SCENARIOS);
  const [yourCards, setYourCards] = useState<MockYourScenario[]>(MOCK_YOUR_SCENARIOS);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const seededRef = useRef(false);
  const featuredRef = useRef<HTMLDivElement | null>(null);

  const fetchScenarios = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthenticated(false);
        setTemplateCards(MOCK_SCENARIOS);
        setYourCards(MOCK_YOUR_SCENARIOS);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Seed templates on first mount
      if (!seededRef.current) {
        seededRef.current = true;
        await seedScenarioTemplates();
      }

      const scenarios = await loadScenarios();
      const templates = scenarios.filter(s => s.isTemplate);
      const userScenarios = scenarios.filter(s => !s.isTemplate);

      setTemplateCards(templates.length > 0 ? templates.map(scenarioToCard) : MOCK_SCENARIOS);
      // Authenticated users see their real scenarios (empty array = empty state)
      setYourCards(userScenarios.map(scenarioToYourCard));
    } catch (err) {
      console.warn('[Library] Failed to load scenarios:', err);
      setTemplateCards(MOCK_SCENARIOS);
      // Don't show mock user scenarios on error for authenticated users
      if (!isAuthenticated) setYourCards(MOCK_YOUR_SCENARIOS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const handleClone = useCallback(async (scenarioId: string) => {
    if (!isAuthenticated) return;
    if (onCloneScenario) {
      // Parent handles cloning + navigation
      onCloneScenario(scenarioId);
    } else {
      const cloned = await cloneScenario(scenarioId);
      if (cloned) {
        await fetchScenarios();
      }
    }
  }, [isAuthenticated, onCloneScenario, fetchScenarios]);

  const lowerQuery = searchQuery.toLowerCase().trim();
  const domainFiltered = filter === 'All domains' ? templateCards : templateCards.filter((s) => s.domain === filter);
  const visible = lowerQuery
    ? domainFiltered.filter((s) =>
        s.title.toLowerCase().includes(lowerQuery) ||
        s.blurb.toLowerCase().includes(lowerQuery) ||
        s.domain.toLowerCase().includes(lowerQuery) ||
        s.tags.some((t) => t.toLowerCase().includes(lowerQuery))
      )
    : domainFiltered;
  const featured = visible.filter((s) => s.featured);
  const more = visible.filter((s) => !s.featured);

  return (
    <div>
      {/* Page head */}
      <div className="r-page-head">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="r-page-title">Scenario Library</h1>
            <p className="r-page-sub">
              Templates for multi-agent experiments. Clone any to start your own scenario.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="r-btn r-btn-secondary"
              onClick={() => featuredRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Icon name="book" size={14} /> Browse paper-replications
            </button>
            <button className="r-btn r-btn-primary" onClick={onNewScenario}>
              <Icon name="plus" size={14} /> Blank scenario
            </button>
          </div>
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 12, marginTop: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search input pill */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid var(--line-2)',
              background: 'var(--surface-panel)',
              borderRadius: 6,
              padding: '0 10px',
              flex: 1, minWidth: 280, maxWidth: 480,
              color: 'var(--text-3)',
            }}
          >
            <Icon name="search" size={14} />
            <input
              type="text"
              placeholder="Search templates by name, domain, or tag\u2026"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 0, padding: '9px 0', background: 'transparent',
                fontSize: 13, flex: 1, outline: 'none',
                fontFamily: 'var(--font-app)', color: 'var(--text-1)',
              }}
            />
            <span
              style={{
                marginLeft: 'auto', fontSize: 11,
                fontFamily: 'var(--font-mono)',
                background: 'var(--surface-sunken)',
                padding: '2px 6px', borderRadius: 4,
                color: 'var(--text-4)',
              }}
            >
              {'\u2318'}K
            </span>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`r-chip ${filter === f ? 'r-chip-blue' : 'r-chip-grey'}`}
                onClick={() => setFilter(f)}
                style={{ cursor: 'pointer', border: 0 }}
              >
                {f}
              </button>
            ))}

          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="r-page-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)', fontSize: 13 }}>
            Loading scenarios...
          </div>
        ) : (
          <>
            {/* Your scenarios */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-h)', fontSize: 14, fontWeight: 700,
                  color: 'var(--text-1)', margin: 0, letterSpacing: '0.01em',
                }}
              >
                Your scenarios
              </h2>
            </div>
            {yourCards.length === 0 && isAuthenticated ? (
              <div
                style={{
                  padding: '20px 0 8px',
                  fontSize: 13, color: 'var(--text-3)',
                }}
              >
                No scenarios yet. Clone a template below to get started.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 10, marginBottom: 8,
                }}
              >
                {yourCards.map((y) => (
                  <YourCard key={y.id} y={y} onEdit={onEditScenario} onRun={onViewRuns} />
                ))}
              </div>
            )}

            {/* Featured templates */}
            {featured.length > 0 && (
              <>
                <div ref={featuredRef} style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12, marginTop: 28 }}>
                  <h2
                    style={{
                      fontFamily: 'var(--font-h)', fontSize: 14, fontWeight: 700,
                      color: 'var(--text-1)', margin: 0, letterSpacing: '0.01em',
                    }}
                  >
                    Featured templates
                  </h2>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    Curated by DEXLab — replications of published studies
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 14,
                  }}
                >
                  {featured.map((s) => (
                    <ScenarioCard key={s.id} s={s} onClone={handleClone} />
                  ))}
                </div>
              </>
            )}

            {/* More templates */}
            {more.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12, marginTop: 28 }}>
                  <h2
                    style={{
                      fontFamily: 'var(--font-h)', fontSize: 14, fontWeight: 700,
                      color: 'var(--text-1)', margin: 0, letterSpacing: '0.01em',
                    }}
                  >
                    More templates
                  </h2>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 14,
                  }}
                >
                  {more.map((s) => (
                    <ScenarioCard key={s.id} s={s} onClone={handleClone} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
