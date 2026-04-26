/* global React, Icon */
// Library — scenario template browser. Cards: Procurement Negotiation, Legal Advocacy, Mediation
// Top: search + filters. Featured/Yours sections.

const SCENARIOS = [
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
    icon: 'layers',
    accent: 'grey',
    runs: 3,
    citations: 0,
  },
];

const YOUR_SCENARIOS = [
  { id: 'y1', title: 'B2B Renegotiation — capability variant', updated: '2 days ago', based: 'Procurement Negotiation', runs: 4, draft: false },
  { id: 'y2', title: 'Mediation w/ asymmetric info', updated: 'last week', based: 'Mediation', runs: 1, draft: false },
  { id: 'y3', title: 'Sales-rep persuasion (draft)', updated: 'just now', based: 'Persuasion Cascade', runs: 0, draft: true },
];

const FILTERS = ['All domains', 'Negotiation', 'Law', 'Psychology', 'Marketing'];

const ScenarioCard = ({ s }) => (
  <div className="scenario-card">
    <div className="sc-head">
      <div className={`sc-icon sc-${s.accent}`}><Icon name={s.icon} size={20}/></div>
      <div className="sc-meta">
        <span className="chip chip-grey">{s.domain}</span>
        {s.featured && <span className="chip chip-orange"><Icon name="star" size={10}/> Featured</span>}
      </div>
    </div>
    <h3 className="sc-title">{s.title}</h3>
    <p className="sc-blurb">{s.blurb}</p>
    <div className="sc-stats">
      <span><Icon name="bot" size={12}/> {s.agents} agents</span>
      <span><Icon name="refresh" size={12}/> {s.rounds} rounds</span>
      <span><Icon name="play" size={12}/> {s.runs} runs</span>
      {s.citations > 0 && <span><Icon name="book" size={12}/> {s.citations} cites</span>}
    </div>
    <div className="sc-tags">
      {s.tags.map(t => <span key={t} className="sc-tag">{t}</span>)}
    </div>
    <div className="sc-foot">
      <button className="btn btn-ghost btn-sm"><Icon name="eye" size={13}/> Preview</button>
      <button className="btn btn-secondary btn-sm"><Icon name="copy" size={13}/> Clone</button>
    </div>
  </div>
);

const YourCard = ({ y }) => (
  <div className="your-card">
    <div className="yc-line">
      <div className="yc-title">{y.title}</div>
      {y.draft && <span className="chip chip-orange">Draft</span>}
    </div>
    <div className="yc-meta">
      <span>Based on <strong>{y.based}</strong></span>
      <span className="dot">·</span>
      <span>Updated {y.updated}</span>
      <span className="dot">·</span>
      <span>{y.runs} run{y.runs === 1 ? '' : 's'}</span>
    </div>
    <div className="yc-foot">
      <button className="btn btn-ghost btn-sm"><Icon name="edit" size={12}/> Edit</button>
      <button className="btn btn-ghost btn-sm"><Icon name="play" size={12}/> Run</button>
    </div>
  </div>
);

const Library = () => {
  const [filter, setFilter] = React.useState('All domains');
  const visible = filter === 'All domains' ? SCENARIOS : SCENARIOS.filter(s => s.domain === filter);
  const featured = visible.filter(s => s.featured);
  const more = visible.filter(s => !s.featured);

  return (
    <div className="library-page">
      <div className="page-head">
        <div className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Scenario Library</h1>
            <p className="page-sub">Templates for multi-agent experiments. Clone any to start your own scenario.</p>
          </div>
          <div className="row">
            <button className="btn btn-secondary"><Icon name="book" size={14}/> Browse paper-replications</button>
            <button className="btn btn-primary"><Icon name="plus" size={14}/> Blank scenario</button>
          </div>
        </div>
        <div className="lib-controls">
          <div className="lib-search">
            <Icon name="search" size={14}/>
            <input className="input" placeholder="Search 18 templates by name, domain, or tag…"/>
            <span className="kbd">⌘K</span>
          </div>
          <div className="lib-filters">
            {FILTERS.map(f => (
              <button key={f}
                className={`chip ${filter === f ? 'chip-blue' : 'chip-grey'}`}
                onClick={() => setFilter(f)}
                style={{ cursor: 'pointer' }}>
                {f}
              </button>
            ))}
            <span className="lib-sep"/>
            <button className="btn btn-ghost btn-sm"><Icon name="filter" size={13}/> More filters</button>
            <button className="btn btn-ghost btn-sm"><Icon name="sortAsc" size={13}/> Most used</button>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="lib-section-head">
          <h2 className="lib-h2">Your scenarios</h2>
          <a href="#" style={{ fontSize: 12 }}>View all →</a>
        </div>
        <div className="your-grid">
          {YOUR_SCENARIOS.map(y => <YourCard key={y.id} y={y}/>)}
        </div>

        <div className="lib-section-head" style={{ marginTop: 28 }}>
          <h2 className="lib-h2">Featured templates</h2>
          <span className="lib-h2-sub">Curated by DEXLab — replications of published studies</span>
        </div>
        <div className="lib-grid">
          {featured.map(s => <ScenarioCard key={s.id} s={s}/>)}
        </div>

        <div className="lib-section-head" style={{ marginTop: 28 }}>
          <h2 className="lib-h2">More templates</h2>
        </div>
        <div className="lib-grid">
          {more.map(s => <ScenarioCard key={s.id} s={s}/>)}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Library, SCENARIOS });
