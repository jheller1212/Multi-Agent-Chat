/* global React, Icon */
// Scenario Builder — tabbed form: Agents | Turn Policy | Prompts | Outcomes
// This is the over-invest screen. Big, generous, onboarding-friendly.

const PROVIDERS = {
  OpenAI:    { color: '#10A37F', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'o3-mini'] },
  Anthropic: { color: '#D97757', models: ['claude-sonnet-4.5', 'claude-opus-4', 'claude-haiku-4.5'] },
  Google:    { color: '#4285F4', models: ['gemini-2.5-pro', 'gemini-2.5-flash'] },
  Mistral:   { color: '#FA520F', models: ['mistral-large', 'mistral-medium'] },
  Meta:      { color: '#0064E0', models: ['llama-3.3-70b', 'llama-3.3-8b'] },
  Alibaba:   { color: '#FF6A00', models: ['qwen-2.5-72b', 'qwen-2.5-7b'] },
};

const AGENTS = [
  { id: 'buyer', name: 'Buyer', role: 'domain', desc: 'Procurement manager negotiating a 12-month supply contract with a target unit price and walk-away threshold.', provider: 'Anthropic', model: 'claude-sonnet-4.5', temp: 0.7, max: 800, color: 'blue' },
  { id: 'seller', name: 'Seller', role: 'domain', desc: 'Sales rep selling on margin who must hit a quarterly volume goal. Holds private floor price.', provider: 'OpenAI', model: 'gpt-4o', temp: 0.7, max: 800, color: 'orange' },
  { id: 'judge', name: 'Judge', role: 'supervisor', desc: 'Classifies each round as Cooperative / Competitive / Stalled. Returns one label + 1-sentence rationale.', provider: 'OpenAI', model: 'gpt-4o-mini', temp: 0.0, max: 200, color: 'grey' },
  { id: 'analyst', name: 'Analyst', role: 'supervisor', desc: 'Extracts structured offers (price, volume, term-months) from each agent message into JSON.', provider: 'Anthropic', model: 'claude-haiku-4.5', temp: 0.0, max: 300, color: 'grey' },
];

const SLOTS = [
  { name: 'BUYER_TARGET_PRICE', desc: 'Target unit price the buyer aims for (€).', type: 'number' },
  { name: 'BUYER_WALKAWAY', desc: 'Highest price the buyer will accept (€).', type: 'number' },
  { name: 'SELLER_FLOOR_PRICE', desc: 'Lowest price the seller can accept (€).', type: 'number' },
  { name: 'VOLUME_TARGET', desc: 'Annual volume in units.', type: 'number' },
  { name: 'BUYER_CAPABILITY', desc: 'Negotiation skill profile (strong/weak).', type: 'enum' },
];

const BUYER_PROMPT = `You are the BUYER, procurement manager at Atrium Logistics.

CONTEXT
You are negotiating a 12-month supply contract for industrial sensors with the seller. You hold private information about your budget and walk-away.

YOUR PRIVATE INFORMATION
- Target unit price: €{BUYER_TARGET_PRICE}
- Walk-away (highest acceptable): €{BUYER_WALKAWAY}
- Annual volume needed: {VOLUME_TARGET} units
- Capability profile: {BUYER_CAPABILITY}

YOUR PUBLIC GOALS
- Sign a 12-month contract at or below your target price.
- You should NOT reveal your walk-away.

INSTRUCTIONS
- Speak naturally, as a procurement manager would.
- Make concrete offers (price, volume, term).
- If asked directly about your budget, deflect.

When you are ready to accept the seller's offer, end your message with [ACCEPT].
When you wish to walk away, end with [WALKAWAY].`;

const TURN_POLICIES = [
  { id: 'strict', label: 'Strict alternation', desc: 'A → B → A → B. Most common. Predictable for analysis.', recommended: true },
  { id: 'moderated', label: 'Moderator-driven', desc: 'A supervisor agent picks who speaks each turn. Useful for jury / panel scenarios.', recommended: false },
  { id: 'event', label: 'Event-driven', desc: 'Either agent can speak when triggered (e.g. a deadline elapses). Advanced.', recommended: false },
];

const TabBar = ({ tabs, current, onChange }) => (
  <div className="sb-tabbar">
    {tabs.map((t, i) => (
      <button key={t.id}
        className={`sb-tab ${current === t.id ? 'active' : ''}`}
        onClick={() => onChange(t.id)}>
        <span className="sb-tab-num">{i + 1}</span>
        <span className="sb-tab-label">{t.label}</span>
        {t.status === 'done' && <Icon name="check" size={12}/>}
        {t.status === 'warn' && <span className="sb-tab-warn"/>}
      </button>
    ))}
  </div>
);

const AgentCard = ({ a }) => (
  <div className="agent-card">
    <div className="ac-head">
      <div className={`ac-avatar ac-${a.color}`}>
        <Icon name={a.role === 'supervisor' ? 'eye' : 'user'} size={16}/>
      </div>
      <div className="grow">
        <div className="ac-row">
          <div className="ac-name">{a.name}</div>
          <span className={`chip ${a.role === 'supervisor' ? 'chip-grey' : 'chip-blue'}`}>
            {a.role === 'supervisor' ? 'Supervisor' : 'Domain agent'}
          </span>
        </div>
        <div className="ac-desc">{a.desc}</div>
      </div>
      <div className="ac-actions">
        <button className="icon-btn" title="Edit"><Icon name="edit" size={14}/></button>
        <button className="icon-btn" title="Duplicate"><Icon name="copy" size={14}/></button>
        <button className="icon-btn" title="Remove"><Icon name="trash" size={14}/></button>
      </div>
    </div>
    <div className="ac-spec">
      <div className="ac-spec-cell">
        <div className="ac-spec-label">Provider</div>
        <div className="ac-spec-val">
          <span className="prov-dot" style={{background: PROVIDERS[a.provider].color}}/>
          {a.provider}
        </div>
      </div>
      <div className="ac-spec-cell">
        <div className="ac-spec-label">Model</div>
        <div className="ac-spec-val mono">{a.model}</div>
      </div>
      <div className="ac-spec-cell">
        <div className="ac-spec-label">Temperature</div>
        <div className="ac-spec-val mono">{a.temp.toFixed(2)}</div>
      </div>
      <div className="ac-spec-cell">
        <div className="ac-spec-label">Max tokens</div>
        <div className="ac-spec-val mono">{a.max}</div>
      </div>
      <div className="ac-spec-cell ac-spec-prompt">
        <div className="ac-spec-label">System prompt</div>
        <div className="ac-spec-val">
          {a.id === 'buyer' ? '212 tokens · 5 slots' : a.id === 'seller' ? '198 tokens · 4 slots' : a.id === 'judge' ? '84 tokens · 0 slots' : '146 tokens · 1 slot'}
        </div>
      </div>
    </div>
  </div>
);

const PromptEditor = ({ value }) => {
  // Render with {SLOT} highlighting
  const parts = [];
  const re = /\{([A-Z_]+)\}/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(value)) !== null) {
    if (m.index > last) parts.push(<span key={i++}>{value.slice(last, m.index)}</span>);
    parts.push(<span key={i++} className="slot">{`{${m[1]}}`}</span>);
    last = m.index + m[0].length;
  }
  parts.push(<span key={i++}>{value.slice(last)}</span>);
  return <div className="prompt-editor"><pre className="pe-code">{parts}</pre></div>;
};

const PromptPreview = ({ value, sub }) => {
  let v = value;
  Object.entries(sub).forEach(([k, val]) => {
    v = v.replaceAll(`{${k}}`, val);
  });
  return <pre className="pe-preview">{v}</pre>;
};

// ---- Tab panes ---------------------------------------------------

const AgentsPane = () => (
  <div className="pane">
    <div className="pane-section">
      <div className="pane-section-head">
        <div>
          <h3 className="pane-h">Agents</h3>
          <p className="pane-sub">Add the AI agents that participate in this scenario. Domain agents converse; supervisors observe and classify.</p>
        </div>
        <div className="row">
          <button className="btn btn-secondary btn-sm"><Icon name="plus" size={13}/> Add supervisor</button>
          <button className="btn btn-primary btn-sm"><Icon name="plus" size={13}/> Add domain agent</button>
        </div>
      </div>
      <div className="agents-list">
        {AGENTS.map(a => <AgentCard key={a.id} a={a}/>)}
      </div>
    </div>

    <div className="pane-aside">
      <div className="aside-card">
        <div className="aside-h"><Icon name="help" size={14}/> Domain vs supervisor</div>
        <p>
          <strong>Domain agents</strong> hold a role in the conversation (Buyer, Seller, Therapist).
          They speak, hear, and persuade.
        </p>
        <p>
          <strong>Supervisors</strong> observe each round and emit structured judgments
          (a label, a JSON extraction). They never appear in the transcript text.
        </p>
        <p style={{ margin: 0 }}>
          Most scenarios run with 2 domain + 2 supervisor agents.
          <a href="#" className="link"> See the protocol guide →</a>
        </p>
      </div>

      <div className="aside-card">
        <div className="aside-h"><Icon name="sparkle" size={14}/> Suggested defaults</div>
        <div className="default-row"><span>Negotiation domain</span><span className="mono">temp 0.7</span></div>
        <div className="default-row"><span>Judge supervisor</span><span className="mono">temp 0.0</span></div>
        <div className="default-row"><span>JSON analyst</span><span className="mono">temp 0.0</span></div>
      </div>
    </div>
  </div>
);

const PolicyPane = () => (
  <div className="pane">
    <div className="pane-section">
      <div className="pane-section-head">
        <div>
          <h3 className="pane-h">Turn policy</h3>
          <p className="pane-sub">How agents take turns. Most scenarios use strict alternation.</p>
        </div>
      </div>

      <div className="policy-grid">
        {TURN_POLICIES.map((p, i) => (
          <label key={p.id} className={`policy-card ${i === 0 ? 'selected' : ''}`}>
            <div className="policy-radio">{i === 0 && <span/>}</div>
            <div className="grow">
              <div className="policy-name">
                {p.label}
                {p.recommended && <span className="chip chip-blue" style={{ marginLeft: 8 }}>Recommended</span>}
              </div>
              <div className="policy-desc">{p.desc}</div>
            </div>
            <div className="policy-viz">
              {p.id === 'strict' && (
                <div className="viz-strict">
                  <span className="viz-bubble vb-blue">A</span>
                  <Icon name="arrowRight" size={12}/>
                  <span className="viz-bubble vb-orange">B</span>
                  <Icon name="arrowRight" size={12}/>
                  <span className="viz-bubble vb-blue">A</span>
                  <Icon name="arrowRight" size={12}/>
                  <span className="viz-bubble vb-orange">B</span>
                </div>
              )}
              {p.id === 'moderated' && (
                <div className="viz-strict">
                  <span className="viz-bubble vb-grey">M</span>
                  <Icon name="arrowRight" size={12}/>
                  <span className="viz-bubble vb-blue">A</span>
                  <Icon name="arrowRight" size={12}/>
                  <span className="viz-bubble vb-grey">M</span>
                  <Icon name="arrowRight" size={12}/>
                  <span className="viz-bubble vb-orange">B</span>
                </div>
              )}
              {p.id === 'event' && (
                <div className="viz-strict viz-event">
                  <span className="viz-bubble vb-blue">A</span>
                  <span className="viz-clock"><Icon name="clock" size={11}/></span>
                  <span className="viz-bubble vb-orange">B</span>
                </div>
              )}
            </div>
          </label>
        ))}
      </div>

      <div className="round-defs">
        <h4 className="pane-h2">Round structure</h4>
        <div className="rd-grid">
          <div>
            <div className="label">Total rounds</div>
            <div className="row">
              <input className="input num" defaultValue="12" style={{ width: 80 }}/>
              <span className="help" style={{ margin: 0 }}>One round = full alternation cycle (A → B)</span>
            </div>
          </div>
          <div>
            <div className="label">Stop conditions</div>
            <div className="stop-list">
              <div className="stop-row"><span className="chip chip-blue">[ACCEPT]</span> token in any agent message</div>
              <div className="stop-row"><span className="chip chip-blue">[WALKAWAY]</span> token in any agent message</div>
              <div className="stop-row"><span className="chip chip-grey">round &gt;= 12</span> Hard cap on rounds</div>
              <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}><Icon name="plus" size={12}/> Add condition</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="pane-aside">
      <div className="aside-card">
        <div className="aside-h"><Icon name="help" size={14}/> What is a "round"?</div>
        <p>A <strong>round</strong> is one full pass through your turn order — for strict alternation that's <em>A speaks then B speaks</em>.</p>
        <p style={{ margin: 0 }}>Supervisors run <em>after</em> each round, classifying the exchange as a unit.</p>
      </div>
      <div className="aside-card aside-warn">
        <div className="aside-h"><Icon name="bell" size={14}/> Heads up</div>
        <p style={{ margin: 0 }}>
          Long round caps (&gt; 20) push token spend up sharply.
          A 12-round buyer/seller dyad averages ≈ 14k tokens.
        </p>
      </div>
    </div>
  </div>
);

const PromptsPane = () => (
  <div className="pane">
    <div className="pane-section pane-section-prompts">
      <div className="pane-section-head">
        <div>
          <h3 className="pane-h">Prompts</h3>
          <p className="pane-sub">Compose system prompts. <span className="slot inline-slot">{'{SLOTS}'}</span> become experiment variables — set them per cell.</p>
        </div>
        <div className="row">
          <select className="select" style={{ width: 220 }} defaultValue="buyer">
            <option value="buyer">Buyer · system prompt</option>
            <option value="seller">Seller · system prompt</option>
            <option value="judge">Judge · system prompt</option>
            <option value="analyst">Analyst · system prompt</option>
          </select>
          <button className="btn btn-secondary btn-sm"><Icon name="copy" size={13}/> Duplicate</button>
        </div>
      </div>

      <div className="prompts-split">
        <div className="prompts-col">
          <div className="prompts-col-head">
            <span className="label" style={{ margin: 0 }}>Prompt template</span>
            <div className="row">
              <span className="chip chip-grey num">212 tokens</span>
              <span className="chip chip-blue">5 slots</span>
            </div>
          </div>
          <PromptEditor value={BUYER_PROMPT}/>
        </div>
        <div className="prompts-col">
          <div className="prompts-col-head">
            <span className="label" style={{ margin: 0 }}>Preview · cell A1</span>
            <div className="row">
              <span className="chip chip-grey">price=80</span>
              <span className="chip chip-grey">walkaway=92</span>
              <span className="chip chip-grey">strong</span>
            </div>
          </div>
          <PromptPreview value={BUYER_PROMPT} sub={{
            BUYER_TARGET_PRICE: '80',
            BUYER_WALKAWAY: '92',
            VOLUME_TARGET: '50,000',
            BUYER_CAPABILITY: 'strong',
          }}/>
        </div>
      </div>

      <div className="slots-table">
        <div className="slots-head">
          <h4 className="pane-h2">Slots used in this prompt</h4>
          <button className="btn btn-ghost btn-sm"><Icon name="plus" size={13}/> Add slot</button>
        </div>
        <div className="slots-body">
          <div className="slots-row slots-row-head">
            <div>Name</div><div>Type</div><div>Description</div><div>Used in</div>
          </div>
          {SLOTS.map(s => (
            <div key={s.name} className="slots-row">
              <div><span className="slot inline-slot mono">{`{${s.name}}`}</span></div>
              <div><span className="chip chip-grey">{s.type}</span></div>
              <div className="slots-desc">{s.desc}</div>
              <div className="slots-used">
                {s.name.startsWith('BUYER') && <span className="chip chip-blue">Buyer</span>}
                {s.name.startsWith('SELLER') && <span className="chip chip-orange">Seller</span>}
                {s.name === 'VOLUME_TARGET' && <><span className="chip chip-blue">Buyer</span><span className="chip chip-orange">Seller</span></>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const OutcomesPane = () => (
  <div className="pane">
    <div className="pane-section">
      <div className="pane-section-head">
        <div>
          <h3 className="pane-h">Outcomes &amp; CSV</h3>
          <p className="pane-sub">Define the columns of your output CSV. One row per dyad.</p>
        </div>
        <button className="btn btn-secondary btn-sm"><Icon name="plus" size={13}/> Add column</button>
      </div>

      <div className="csv-table">
        <div className="csv-row csv-head">
          <div>#</div>
          <div>Column</div>
          <div>Type</div>
          <div>Source</div>
          <div>Required</div>
          <div></div>
        </div>
        {[
          ['dyad_id', 'string', 'auto', true, 'System'],
          ['cell_id', 'string', 'auto', true, 'Experiment cell'],
          ['outcome', 'enum', 'extracted', true, 'Analyst → final[outcome]'],
          ['final_price', 'number', 'extracted', false, 'Analyst → final[price]'],
          ['rounds_used', 'number', 'auto', true, 'Counter'],
          ['judge_verdict', 'enum', 'extracted', false, 'Judge → terminal label'],
          ['anomaly', 'boolean', 'derived', true, 'Heuristic'],
        ].map(([col, type, src, req, where], i) => (
          <div key={col} className="csv-row">
            <div className="csv-num">{i + 1}</div>
            <div className="mono csv-col">{col}</div>
            <div><span className="chip chip-grey">{type}</span></div>
            <div className="csv-source">
              <span className={`chip ${src === 'auto' ? 'chip-grey' : src === 'extracted' ? 'chip-blue' : 'chip-orange'}`}>{src}</span>
              <span className="csv-source-where">{where}</span>
            </div>
            <div>{req ? <Icon name="check" size={14} stroke={2}/> : <span style={{ color: 'var(--text-4)' }}>—</span>}</div>
            <div><button className="icon-btn"><Icon name="moreH" size={14}/></button></div>
          </div>
        ))}
      </div>

      <h4 className="pane-h2" style={{ marginTop: 24 }}>Utility function</h4>
      <p className="pane-sub" style={{ marginBottom: 12 }}>
        How DEXLab scores each dyad's outcome. Used in cell-mean tables and the Results dashboard.
      </p>
      <div className="util-grid">
        {[
          { id: 'piesplit', label: 'Pie-split / surplus', desc: 'Buyer + seller surplus from a single price.', sel: true },
          { id: 'multi', label: 'Multi-issue weighted', desc: 'Sum of issue × weight per side.' },
          { id: 'binary', label: 'Binary verdict', desc: 'Win / loss / hung.' },
          { id: 'custom', label: 'Custom expression', desc: 'JS-style scoring expression.' },
        ].map(u => (
          <label key={u.id} className={`util-card ${u.sel ? 'selected' : ''}`}>
            <div className="policy-radio">{u.sel && <span/>}</div>
            <div>
              <div className="util-name">{u.label}</div>
              <div className="util-desc">{u.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>

    <div className="pane-aside">
      <div className="aside-card">
        <div className="aside-h"><Icon name="download" size={14}/> CSV preview</div>
        <pre className="csv-preview">dyad_id,cell_id,outcome,final_price,rounds_used,judge_verdict,anomaly
d_0001,A1,deal,82.50,7,cooperative,false
d_0002,A1,deal,79.00,11,competitive,false
d_0003,A1,walkaway,,12,stalled,false
d_0004,A2,deal,85.00,5,cooperative,false
…</pre>
        <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
          <Icon name="download" size={13}/> Download schema (.json)
        </button>
      </div>
    </div>
  </div>
);

// ---- Main wrapper ------------------------------------------------

const ScenarioBuilder = () => {
  const [tab, setTab] = React.useState('agents');
  const tabs = [
    { id: 'agents', label: 'Agents', status: 'done' },
    { id: 'policy', label: 'Turn policy', status: 'done' },
    { id: 'prompts', label: 'Prompts', status: 'warn' },
    { id: 'outcomes', label: 'Outcomes', status: null },
  ];
  return (
    <div className="sb-page">
      <div className="page-head sb-head">
        <div className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="sb-crumb">
              <a href="#">Scenarios</a>
              <Icon name="chevron" size={12}/>
              <span>B2B Renegotiation — capability variant</span>
              <span className="chip chip-grey">Forked from Procurement Negotiation</span>
            </div>
            <h1 className="page-title" style={{ marginTop: 6 }}>B2B Renegotiation — capability variant</h1>
            <p className="page-sub">Last saved 2 minutes ago · 4 agents · 5 slots · 12 rounds</p>
          </div>
          <div className="row">
            <button className="btn btn-ghost"><Icon name="eye" size={14}/> Preview run</button>
            <button className="btn btn-secondary"><Icon name="copy" size={14}/> Duplicate</button>
            <button className="btn btn-primary"><Icon name="flask" size={14}/> Use in experiment</button>
          </div>
        </div>
        <TabBar tabs={tabs} current={tab} onChange={setTab}/>
      </div>

      <div className="sb-body">
        {tab === 'agents' && <AgentsPane/>}
        {tab === 'policy' && <PolicyPane/>}
        {tab === 'prompts' && <PromptsPane/>}
        {tab === 'outcomes' && <OutcomesPane/>}
      </div>
    </div>
  );
};

Object.assign(window, { ScenarioBuilder, PROVIDERS });
