import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';
import { loadScenario, saveScenario, cloneScenario } from '../../lib/scenario/loader';
import type { Scenario } from '../../types/scenario';

/* ------------------------------------------------------------------ */
/*  Mock data — verbatim from SPEC.md §4                              */
/* ------------------------------------------------------------------ */

interface ProviderInfo {
  color: string;
  models: string[];
}

const PROVIDERS: Record<string, ProviderInfo> = {
  OpenAI:    { color: '#10A37F', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'o3-mini'] },
  Anthropic: { color: '#D97757', models: ['claude-sonnet-4.5', 'claude-opus-4', 'claude-haiku-4.5'] },
  Google:    { color: '#4285F4', models: ['gemini-2.5-pro', 'gemini-2.5-flash'] },
  Mistral:   { color: '#FA520F', models: ['mistral-large', 'mistral-medium'] },
  Meta:      { color: '#0064E0', models: ['llama-3.3-70b', 'llama-3.3-8b'] },
  Alibaba:   { color: '#FF6A00', models: ['qwen-2.5-72b', 'qwen-2.5-7b'] },
};

interface Agent {
  id: string;
  name: string;
  role: 'domain' | 'supervisor';
  desc: string;
  provider: string;
  model: string;
  temp: number;
  max: number;
  color: 'blue' | 'orange' | 'grey';
}

const DEFAULT_AGENTS: Agent[] = [
  { id: 'buyer', name: 'Buyer', role: 'domain', desc: 'Procurement manager negotiating a 12-month supply contract with a target unit price and walk-away threshold.', provider: 'Anthropic', model: 'claude-sonnet-4.5', temp: 0.7, max: 800, color: 'blue' },
  { id: 'seller', name: 'Seller', role: 'domain', desc: 'Sales rep selling on margin who must hit a quarterly volume goal. Holds private floor price.', provider: 'OpenAI', model: 'gpt-4o', temp: 0.7, max: 800, color: 'orange' },
  { id: 'judge', name: 'Judge', role: 'supervisor', desc: 'Classifies each round as Cooperative / Competitive / Stalled. Returns one label + 1-sentence rationale.', provider: 'OpenAI', model: 'gpt-4o-mini', temp: 0.0, max: 200, color: 'grey' },
  { id: 'analyst', name: 'Analyst', role: 'supervisor', desc: 'Extracts structured offers (price, volume, term-months) from each agent message into JSON.', provider: 'Anthropic', model: 'claude-haiku-4.5', temp: 0.0, max: 300, color: 'grey' },
];

interface Slot {
  name: string;
  desc: string;
  type: string;
}

const SLOTS: Slot[] = [
  { name: 'BUYER_TARGET_PRICE', desc: 'Target unit price the buyer aims for (€).', type: 'number' },
  { name: 'BUYER_WALKAWAY', desc: 'Highest price the buyer will accept (€).', type: 'number' },
  { name: 'SELLER_FLOOR_PRICE', desc: 'Lowest price the seller can accept (€).', type: 'number' },
  { name: 'VOLUME_TARGET', desc: 'Annual volume in units.', type: 'number' },
  { name: 'BUYER_CAPABILITY', desc: 'Negotiation skill profile (strong/weak).', type: 'enum' },
];

const DEFAULT_PROMPTS: Record<string, string> = {
  buyer: `You are the BUYER, procurement manager at Atrium Logistics.

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
When you wish to walk away, end with [WALKAWAY].`,

  seller: `You are the SELLER, a sales representative at IndustrialTech Corp.

CONTEXT
You are negotiating a 12-month supply contract for industrial sensors with the buyer. You must hit quarterly volume targets while protecting your margin.

YOUR PRIVATE INFORMATION
- Floor price (minimum acceptable): €{SELLER_FLOOR_PRICE}
- Volume target: {VOLUME_TARGET} units
- Quarterly quota pressure: high

YOUR PUBLIC GOALS
- Close a deal at or above your floor price.
- Meet your quarterly volume goal.

INSTRUCTIONS
- Speak naturally, as a sales representative would.
- Make concrete offers (price, volume, term).
- Do not reveal your floor price.

When you accept the buyer's offer, end with [ACCEPT].
When you walk away from the negotiation, end with [WALKAWAY].`,

  judge: `You are a neutral JUDGE evaluating a negotiation transcript.

After each round, classify the exchange using exactly one of these labels:
- Cooperative: Both parties show goodwill, make concessions, or move toward agreement.
- Competitive: Parties are adversarial, bluffing, or taking hard positions.
- Stalled: No meaningful movement; parties repeating positions.

Respond with JSON only: {"label": "Cooperative"|"Competitive"|"Stalled", "rationale": "<one sentence>"}`,

  analyst: `You are an ANALYST extracting structured data from negotiation messages.

Extract the most recent concrete offer from the message (if any) and return JSON:
{
  "price": <number|null>,
  "volume": <number|null>,
  "term_months": <number|null>,
  "outcome": "deal"|"walkaway"|"ongoing"|null
}

If no offer is present, return null values. Do not infer — only extract explicit mentions.`,
};

interface TurnPolicy {
  id: string;
  label: string;
  desc: string;
  recommended: boolean;
}

const TURN_POLICIES: TurnPolicy[] = [
  { id: 'strict', label: 'Strict alternation', desc: 'A → B → A → B. Most common. Predictable for analysis.', recommended: true },
  { id: 'moderated', label: 'Moderator-driven', desc: 'A supervisor agent picks who speaks each turn. Useful for jury / panel scenarios.', recommended: false },
  { id: 'event', label: 'Event-driven', desc: 'Either agent can speak when triggered (e.g. a deadline elapses). Advanced.', recommended: false },
];

const PREVIEW_SUBS: Record<string, string> = {
  BUYER_TARGET_PRICE: '80',
  BUYER_WALKAWAY: '92',
  VOLUME_TARGET: '50,000',
  BUYER_CAPABILITY: 'strong',
};

/* ------------------------------------------------------------------ */
/*  Tab types                                                         */
/* ------------------------------------------------------------------ */

type TabId = 'agents' | 'policy' | 'prompts' | 'outcomes';

interface TabDef {
  id: TabId;
  label: string;
  status: 'done' | 'warn' | null;
}

const TABS: TabDef[] = [
  { id: 'agents', label: 'Agents', status: 'done' },
  { id: 'policy', label: 'Turn policy', status: 'done' },
  { id: 'prompts', label: 'Prompts', status: 'warn' },
  { id: 'outcomes', label: 'Outcomes', status: null },
];

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                             */
/* ------------------------------------------------------------------ */

function TabBar({ tabs, current, onChange }: { tabs: TabDef[]; current: TabId; onChange: (id: TabId) => void }) {
  return (
    <div
      style={{
        display: 'flex', gap: 0, marginTop: 18,
        borderBottom: '1px solid var(--line-1)', marginLeft: -2,
      }}
    >
      {tabs.map((t, i) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'transparent', border: 0,
            padding: '12px 18px 14px',
            fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
            color: current === t.id ? 'var(--accent-2)' : 'var(--text-3)',
            cursor: 'pointer', position: 'relative',
            borderBottom: current === t.id ? '2px solid var(--accent-2)' : '2px solid transparent',
            marginBottom: -1,
            transition: 'color var(--dur-fast)',
          }}
        >
          <span
            style={{
              display: 'grid', placeItems: 'center',
              width: 18, height: 18, borderRadius: '50%',
              background: current === t.id ? 'var(--accent-2)' : 'var(--surface-sunken)',
              color: current === t.id ? 'white' : 'var(--text-3)',
              fontSize: 10.5, fontWeight: 700,
              fontFamily: 'var(--font-num)',
            }}
          >
            {i + 1}
          </span>
          <span>{t.label}</span>
          {t.status === 'done' && <Icon name="check" size={12} />}
          {t.status === 'warn' && (
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--accent-1)',
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

function AsideCard({ children, warn }: { children: ReactNode; warn?: boolean }) {
  return (
    <div
      style={{
        background: warn ? 'var(--accent-1-soft)' : 'var(--surface-sunken)',
        border: warn ? '1px solid transparent' : '1px solid var(--line-1)',
        borderRadius: 8, padding: '14px 16px',
        fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55,
      }}
    >
      {children}
    </div>
  );
}

function AsideHeader({ icon, children, warn }: { icon: string; children: ReactNode; warn?: boolean }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12,
        color: warn ? 'var(--accent-1)' : 'var(--text-1)',
        marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em',
      }}
    >
      <Icon name={icon} size={14} />
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Agent card                                                        */
/* ------------------------------------------------------------------ */

interface AgentCardProps {
  a: Agent;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCopy: (id: string) => void;
  onRemove: (id: string) => void;
  onAgentChange: (updated: Agent) => void;
}

function AgentCard({ a, isEditing, onEdit, onCopy, onRemove, onAgentChange }: AgentCardProps) {
  const avatarBg = a.color === 'blue' ? 'var(--accent-2-soft)'
    : a.color === 'orange' ? 'var(--accent-1-soft)'
    : 'var(--surface-sunken)';
  const avatarColor = a.color === 'blue' ? 'var(--accent-2)'
    : a.color === 'orange' ? 'var(--accent-1)'
    : 'var(--text-3)';

  const providerColor = PROVIDERS[a.provider]?.color ?? 'var(--text-3)';

  const promptInfo = a.id === 'buyer' ? '212 tokens · 5 slots'
    : a.id === 'seller' ? '198 tokens · 4 slots'
    : a.id === 'judge' ? '84 tokens · 0 slots'
    : '146 tokens · 1 slot';

  const inputStyle: React.CSSProperties = {
    padding: '5px 8px', borderRadius: 5,
    border: '1px solid var(--line-2)', background: 'var(--surface-sunken)',
    color: 'var(--text-1)', fontSize: 12.5, fontFamily: 'var(--font-mono)',
    width: '100%', boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        background: 'var(--surface-panel)',
        border: `1px solid ${isEditing ? 'var(--accent-2)' : 'var(--line-1)'}`,
        borderRadius: 8, padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      {/* Head */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: 8,
            display: 'grid', placeItems: 'center', flexShrink: 0,
            background: avatarBg, color: avatarColor,
          }}
        >
          <Icon name={a.role === 'supervisor' ? 'eye' : 'user'} size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
              {a.name}
            </div>
            <span className={a.role === 'supervisor' ? 'r-chip r-chip-grey' : 'r-chip r-chip-blue'}>
              {a.role === 'supervisor' ? 'Supervisor' : 'Domain agent'}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.55, maxWidth: 720 }}>
            {a.desc}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {([
            { icon: 'edit', title: isEditing ? 'Close' : 'Edit', action: () => onEdit(a.id) },
            { icon: 'copy', title: 'Duplicate', action: () => onCopy(a.id) },
            { icon: 'trash', title: 'Remove', action: () => onRemove(a.id) },
          ] as const).map(({ icon, title, action }) => (
            <button
              key={icon}
              title={title}
              onClick={action}
              style={{
                width: 32, height: 32, borderRadius: 6,
                background: icon === 'edit' && isEditing ? 'var(--accent-2-soft)' : 'transparent',
                border: 0,
                color: icon === 'trash' ? 'var(--accent-1)' : icon === 'edit' && isEditing ? 'var(--accent-2)' : 'var(--text-2)',
                cursor: 'pointer',
                display: 'grid', placeItems: 'center',
              }}
            >
              <Icon name={icon} size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Inline edit form */}
      {isEditing && (
        <div
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            borderTop: '1px solid var(--line-1)', paddingTop: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', fontWeight: 600 }}>Name</label>
            <input style={inputStyle} value={a.name} onChange={e => onAgentChange({ ...a, name: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', fontWeight: 600 }}>Provider</label>
            <select
              style={{ ...inputStyle, fontFamily: 'var(--font-app)' }}
              value={a.provider}
              onChange={e => {
                const models = PROVIDERS[e.target.value]?.models ?? [];
                onAgentChange({ ...a, provider: e.target.value, model: models[0] ?? a.model });
              }}
            >
              {Object.keys(PROVIDERS).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', fontWeight: 600 }}>Model</label>
            <select
              style={{ ...inputStyle, fontFamily: 'var(--font-app)' }}
              value={a.model}
              onChange={e => onAgentChange({ ...a, model: e.target.value })}
            >
              {(PROVIDERS[a.provider]?.models ?? [a.model]).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', fontWeight: 600 }}>Temperature</label>
            <input
              type="number" step={0.1} min={0} max={2}
              style={inputStyle} value={a.temp}
              onChange={e => onAgentChange({ ...a, temp: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', fontWeight: 600 }}>Max tokens</label>
            <input
              type="number" step={50} min={50}
              style={inputStyle} value={a.max}
              onChange={e => onAgentChange({ ...a, max: parseInt(e.target.value) || a.max })}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', fontWeight: 600 }}>Description</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 56, fontFamily: 'var(--font-app)', lineHeight: 1.5 }}
              value={a.desc}
              onChange={e => onAgentChange({ ...a, desc: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Spec strip */}
      {!isEditing && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.3fr 0.7fr 0.7fr 1.2fr',
            gap: 0,
            borderTop: '1px solid var(--line-1)',
            paddingTop: 12,
          }}
        >
          <SpecCell label="Provider" first>
            <span
              style={{
                width: 8, height: 8, borderRadius: '50%',
                display: 'inline-block', background: providerColor,
              }}
            />
            {a.provider}
          </SpecCell>
          <SpecCell label="Model" mono>{a.model}</SpecCell>
          <SpecCell label="Temperature" mono>{a.temp.toFixed(2)}</SpecCell>
          <SpecCell label="Max tokens" mono>{a.max}</SpecCell>
          <SpecCell label="System prompt" last>{promptInfo}</SpecCell>
        </div>
      )}
    </div>
  );
}

function SpecCell({ label, children, mono, first, last }: {
  label: string;
  children: ReactNode;
  mono?: boolean;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        padding: first ? '0 12px 0 0' : last ? '0 0 0 12px' : '0 12px',
        borderRight: last ? 'none' : '1px solid var(--line-1)',
      }}
    >
      <div
        style={{
          fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--text-4)', fontWeight: 600, marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: mono ? 11.5 : 12.5,
          fontFamily: mono ? 'var(--font-mono)' : undefined,
          color: 'var(--text-1)', fontWeight: 500,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Prompt editor + preview                                           */
/* ------------------------------------------------------------------ */

function PromptEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts: ReactNode[] = [];
  const re = /\{([A-Z_]+)\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = re.exec(value)) !== null) {
    if (match.index > last) {
      parts.push(<span key={i++}>{value.slice(last, match.index)}</span>);
    }
    parts.push(
      <span
        key={i++}
        style={{
          background: 'var(--accent-2-soft)', color: 'var(--accent-2)',
          fontFamily: 'var(--font-mono)', fontWeight: 600,
          borderRadius: 4, padding: '1px 4px',
        }}
      >
        {`{${match[1]}}`}
      </span>
    );
    last = match.index + match[0].length;
  }
  parts.push(<span key={i++}>{value.slice(last)}</span>);

  return (
    <div style={{ position: 'relative', height: 380 }}>
      {/* Syntax-highlighted overlay (pointer-events: none so textarea receives clicks) */}
      <pre
        aria-hidden
        style={{
          position: 'absolute', inset: 0,
          padding: 16, margin: 0, overflow: 'auto',
          fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.65,
          color: 'transparent', background: 'transparent',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          pointerEvents: 'none', zIndex: 1,
        }}
      >
        {parts}
      </pre>
      {/* Editable textarea underneath the overlay */}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
        style={{
          position: 'absolute', inset: 0,
          padding: 16, width: '100%', height: '100%',
          fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.65,
          color: 'var(--text-1)', background: 'var(--surface-panel)',
          border: 'none', outline: 'none', resize: 'none',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          caretColor: 'var(--text-1)',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function PromptPreview({ value, subs }: { value: string; subs: Record<string, string> }) {
  let v = value;
  Object.entries(subs).forEach(([k, val]) => {
    v = v.replaceAll(`{${k}}`, val);
  });
  return (
    <pre
      style={{
        padding: 16, height: 380, overflow: 'auto', margin: 0,
        fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.65,
        color: 'var(--text-2)', whiteSpace: 'pre-wrap',
        background: 'var(--surface-panel)',
      }}
    >
      {v}
    </pre>
  );
}

/* ------------------------------------------------------------------ */
/*  Policy visualizations                                             */
/* ------------------------------------------------------------------ */

function VizBubble({ children, color }: { children: ReactNode; color: 'blue' | 'orange' | 'grey' }) {
  const bg = color === 'blue' ? 'var(--accent-2)'
    : color === 'orange' ? 'var(--accent-1)'
    : 'var(--text-3)';
  return (
    <span
      style={{
        width: 22, height: 22, borderRadius: '50%',
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-h)', fontSize: 11, fontWeight: 700,
        color: 'white', background: bg,
      }}
    >
      {children}
    </span>
  );
}

function VizPill({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px', background: 'var(--surface-sunken)',
        borderRadius: 'var(--radius-pill)',
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stop condition types                                              */
/* ------------------------------------------------------------------ */

interface StopCondition {
  id: string;
  chip: string;
  chipColor: 'blue' | 'grey';
  text: string;
}

const DEFAULT_STOP_CONDITIONS: StopCondition[] = [
  { id: 'accept', chip: '[ACCEPT]', chipColor: 'blue', text: 'token in any agent message' },
  { id: 'walkaway', chip: '[WALKAWAY]', chipColor: 'blue', text: 'token in any agent message' },
  { id: 'cap', chip: 'round >= 12', chipColor: 'grey', text: 'Hard cap on rounds' },
];

/* ------------------------------------------------------------------ */
/*  CSV column types                                                  */
/* ------------------------------------------------------------------ */

interface CsvColumn {
  col: string;
  type: string;
  src: string;
  required: boolean;
  where: string;
}

const DEFAULT_CSV_COLUMNS: CsvColumn[] = [
  { col: 'dyad_id', type: 'string', src: 'auto', required: true, where: 'System' },
  { col: 'cell_id', type: 'string', src: 'auto', required: true, where: 'Experiment cell' },
  { col: 'outcome', type: 'enum', src: 'extracted', required: true, where: 'Analyst → final[outcome]' },
  { col: 'final_price', type: 'number', src: 'extracted', required: false, where: 'Analyst → final[price]' },
  { col: 'rounds_used', type: 'number', src: 'auto', required: true, where: 'Counter' },
  { col: 'judge_verdict', type: 'enum', src: 'extracted', required: false, where: 'Judge → terminal label' },
  { col: 'anomaly', type: 'boolean', src: 'derived', required: true, where: 'Heuristic' },
];

interface UtilOption {
  id: string;
  label: string;
  desc: string;
}

const UTILITY_OPTIONS: UtilOption[] = [
  { id: 'piesplit', label: 'Pie-split / surplus', desc: 'Buyer + seller surplus from a single price.' },
  { id: 'multi', label: 'Multi-issue weighted', desc: 'Sum of issue × weight per side.' },
  { id: 'binary', label: 'Binary verdict', desc: 'Win / loss / hung.' },
  { id: 'custom', label: 'Custom expression', desc: 'JS-style scoring expression.' },
];

/* ------------------------------------------------------------------ */
/*  Tab 1 — Agents                                                    */
/* ------------------------------------------------------------------ */

interface AgentsPaneProps {
  agents: Agent[];
  onChange: (agents: Agent[]) => void;
}

function AgentsPane({ agents, onChange }: AgentsPaneProps) {
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

  const addAgent = (role: 'domain' | 'supervisor') => {
    const id = `agent-${Date.now()}`;
    const newAgent: Agent = {
      id,
      name: role === 'supervisor' ? 'Supervisor' : 'Agent',
      role,
      desc: '',
      provider: 'OpenAI',
      model: 'gpt-4o',
      temp: role === 'supervisor' ? 0.0 : 0.7,
      max: role === 'supervisor' ? 200 : 800,
      color: role === 'supervisor' ? 'grey' : 'blue',
    };
    onChange([...agents, newAgent]);
  };

  const handleEdit = (id: string) => {
    setEditingAgentId(prev => (prev === id ? null : id));
  };

  const handleCopy = (id: string) => {
    const source = agents.find(a => a.id === id);
    if (!source) return;
    const copy: Agent = { ...source, id: `agent-${Date.now()}`, name: `${source.name} (copy)` };
    onChange([...agents, copy]);
  };

  const handleRemove = (id: string) => {
    onChange(agents.filter(a => a.id !== id));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'flex-start' }}>
      {/* Main */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.005em' }}>
              Agents
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '2px 0 0', maxWidth: 560 }}>
              Add the AI agents that participate in this scenario. Domain agents converse; supervisors observe and classify.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="r-btn r-btn-secondary r-btn-sm" onClick={() => addAgent('supervisor')}><Icon name="plus" size={13} /> Add supervisor</button>
            <button className="r-btn r-btn-primary r-btn-sm" onClick={() => addAgent('domain')}><Icon name="plus" size={13} /> Add domain agent</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {agents.map(a => (
            <AgentCard
              key={a.id}
              a={a}
              isEditing={editingAgentId === a.id}
              onEdit={handleEdit}
              onCopy={handleCopy}
              onRemove={handleRemove}
              onAgentChange={(updated) => onChange(agents.map(x => x.id === updated.id ? updated : x))}
            />
          ))}
        </div>
      </div>

      {/* Aside */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 16 }}>
        <AsideCard>
          <AsideHeader icon="help">Domain vs supervisor</AsideHeader>
          <p style={{ margin: '0 0 8px' }}>
            <strong>Domain agents</strong> hold a role in the conversation (Buyer, Seller, Therapist).
            They speak, hear, and persuade.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            <strong>Supervisors</strong> observe each round and emit structured judgments
            (a label, a JSON extraction). They never appear in the transcript text.
          </p>
          <p style={{ margin: 0 }}>
            Most scenarios run with 2 domain + 2 supervisor agents.
            <a href="#" style={{ color: 'var(--accent-2)', marginLeft: 4 }}>See the protocol guide &rarr;</a>
          </p>
        </AsideCard>

        <AsideCard>
          <AsideHeader icon="sparkle">Suggested defaults</AsideHeader>
          <DefaultRow label="Negotiation domain" value="temp 0.7" />
          <DefaultRow label="Judge supervisor" value="temp 0.0" />
          <DefaultRow label="JSON analyst" value="temp 0.0" last />
        </AsideCard>
      </div>
    </div>
  );
}

function DefaultRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '5px 0',
        borderBottom: last ? 'none' : '1px dashed var(--line-1)',
        fontSize: 12,
      }}
    >
      <span>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)', fontSize: 11.5 }}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 2 — Turn policy                                               */
/* ------------------------------------------------------------------ */

interface PolicyPaneProps {
  turnPolicyId: string;
  stopConditions: StopCondition[];
  onPolicyChange: (id: string) => void;
  onStopConditionsChange: (conditions: StopCondition[]) => void;
}

function PolicyPane({ turnPolicyId, stopConditions, onPolicyChange, onStopConditionsChange }: PolicyPaneProps) {
  const addCondition = () => {
    const id = `cond-${Date.now()}`;
    onStopConditionsChange([...stopConditions, { id, chip: '[STOP]', chipColor: 'grey', text: 'Custom stop condition' }]);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'flex-start' }}>
      {/* Main */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.005em' }}>
              Turn policy
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '2px 0 0', maxWidth: 560 }}>
              How agents take turns. Most scenarios use strict alternation.
            </p>
          </div>
        </div>

        {/* Policy cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TURN_POLICIES.map(p => {
            const isSel = turnPolicyId === p.id;
            return (
              <label
                key={p.id}
                onClick={() => onPolicyChange(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: isSel ? 'rgba(0,162,219,0.04)' : 'var(--surface-panel)',
                  border: `1px solid ${isSel ? 'var(--accent-2)' : 'var(--line-1)'}`,
                  borderRadius: 8, padding: '14px 18px', cursor: 'pointer',
                  boxShadow: isSel ? '0 0 0 1px var(--accent-2)' : 'none',
                  transition: 'border-color var(--dur-fast), background var(--dur-fast)',
                }}
              >
                {/* Radio */}
                <div
                  style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: `1.5px solid ${isSel ? 'var(--accent-2)' : 'var(--line-2)'}`,
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}
                >
                  {isSel && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-2)' }} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-h)', fontSize: 14, fontWeight: 700, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {p.label}
                    {p.recommended && <span className="r-chip r-chip-blue">Recommended</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{p.desc}</div>
                </div>

                {/* Visualization */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {p.id === 'strict' && (
                    <VizPill>
                      <VizBubble color="blue">A</VizBubble>
                      <Icon name="arrowRight" size={12} />
                      <VizBubble color="orange">B</VizBubble>
                      <Icon name="arrowRight" size={12} />
                      <VizBubble color="blue">A</VizBubble>
                      <Icon name="arrowRight" size={12} />
                      <VizBubble color="orange">B</VizBubble>
                    </VizPill>
                  )}
                  {p.id === 'moderated' && (
                    <VizPill>
                      <VizBubble color="grey">M</VizBubble>
                      <Icon name="arrowRight" size={12} />
                      <VizBubble color="blue">A</VizBubble>
                      <Icon name="arrowRight" size={12} />
                      <VizBubble color="grey">M</VizBubble>
                      <Icon name="arrowRight" size={12} />
                      <VizBubble color="orange">B</VizBubble>
                    </VizPill>
                  )}
                  {p.id === 'event' && (
                    <VizPill>
                      <VizBubble color="blue">A</VizBubble>
                      <span
                        style={{
                          width: 22, height: 22, borderRadius: '50%',
                          display: 'grid', placeItems: 'center',
                          background: 'var(--surface-panel)',
                          border: '1px dashed var(--line-2)',
                          color: 'var(--text-3)',
                        }}
                      >
                        <Icon name="clock" size={11} />
                      </span>
                      <VizBubble color="orange">B</VizBubble>
                    </VizPill>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {/* Round structure */}
        <div style={{ marginTop: 16 }}>
          <h4
            style={{
              fontFamily: 'var(--font-h)', fontSize: 13, fontWeight: 700,
              margin: '0 0 8px', color: 'var(--text-1)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}
          >
            Round structure
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>
            <div>
              <div
                style={{
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: 'var(--text-3)', fontWeight: 600, marginBottom: 6,
                }}
              >
                Total rounds
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  defaultValue={12}
                  style={{
                    width: 80, padding: '6px 10px', borderRadius: 6,
                    border: '1px solid var(--line-2)', background: 'var(--surface-panel)',
                    fontFamily: 'var(--font-num)', fontSize: 13, color: 'var(--text-1)',
                    fontFeatureSettings: '"tnum"',
                  }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  One round = full alternation cycle (A &rarr; B)
                </span>
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: 'var(--text-3)', fontWeight: 600, marginBottom: 6,
                }}
              >
                Stop conditions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stopConditions.map(c => (
                  <StopRow key={c.id} chip={c.chip} chipColor={c.chipColor} text={c.text} />
                ))}
                <button className="r-btn r-btn-ghost r-btn-sm" style={{ alignSelf: 'flex-start' }} onClick={addCondition}>
                  <Icon name="plus" size={12} /> Add condition
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aside */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 16 }}>
        <AsideCard>
          <AsideHeader icon="help">What is a "round"?</AsideHeader>
          <p style={{ margin: '0 0 8px' }}>
            A <strong>round</strong> is one full pass through your turn order &mdash; for strict alternation that's <em>A speaks then B speaks</em>.
          </p>
          <p style={{ margin: 0 }}>
            Supervisors run <em>after</em> each round, classifying the exchange as a unit.
          </p>
        </AsideCard>

        <AsideCard warn>
          <AsideHeader icon="bell" warn>Heads up</AsideHeader>
          <p style={{ margin: 0 }}>
            Long round caps (&gt; 20) push token spend up sharply.
            A 12-round buyer/seller dyad averages &asymp; 14k tokens.
          </p>
        </AsideCard>
      </div>
    </div>
  );
}

function StopRow({ chip, chipColor, text }: { chip: string; chipColor: 'blue' | 'grey'; text: string }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', background: 'var(--surface-sunken)',
        borderRadius: 6, fontSize: 12, color: 'var(--text-2)',
      }}
    >
      <span className={`r-chip r-chip-${chipColor}`}>{chip}</span>
      {text}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 3 — Prompts                                                   */
/* ------------------------------------------------------------------ */

interface PromptsPaneProps {
  agents: Agent[];
  prompts: Record<string, string>;
  onPromptsChange: (prompts: Record<string, string>) => void;
}

function PromptsPane({ agents, prompts, onPromptsChange }: PromptsPaneProps) {
  const [selectedAgentId, setSelectedAgentId] = useState(() => agents[0]?.id ?? 'buyer');
  const [slots, setSlots] = useState<Slot[]>(SLOTS);

  // If selected agent was removed, fall back to first agent
  const effectiveAgentId = agents.find(a => a.id === selectedAgentId) ? selectedAgentId : (agents[0]?.id ?? '');
  const currentPrompt = prompts[effectiveAgentId] ?? '';

  const handlePromptChange = (value: string) => {
    onPromptsChange({ ...prompts, [effectiveAgentId]: value });
  };

  const handleDuplicate = () => {
    const currentText = prompts[effectiveAgentId] ?? '';
    const copyKey = `${effectiveAgentId}_copy_${Date.now()}`;
    onPromptsChange({ ...prompts, [copyKey]: currentText });
  };

  const addSlot = () => {
    const name = `SLOT_${Date.now()}`;
    setSlots(prev => [...prev, { name, desc: 'Custom slot', type: 'string' }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.005em' }}>
            Prompts
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '2px 0 0', maxWidth: 560 }}>
            Compose system prompts.{' '}
            <span
              style={{
                background: 'var(--accent-2-soft)', color: 'var(--accent-2)',
                fontFamily: 'var(--font-mono)', fontWeight: 600,
                borderRadius: 4, padding: '1px 6px',
              }}
            >
              {'{SLOTS}'}
            </span>{' '}
            become experiment variables &mdash; set them per cell.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={effectiveAgentId}
            onChange={e => setSelectedAgentId(e.target.value)}
            style={{
              width: 220, padding: '6px 10px', borderRadius: 6,
              border: '1px solid var(--line-2)', background: 'var(--surface-panel)',
              fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-1)',
            }}
          >
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name} · system prompt</option>
            ))}
          </select>
          <button className="r-btn r-btn-secondary r-btn-sm" onClick={handleDuplicate}><Icon name="copy" size={13} /> Duplicate</button>
        </div>
      </div>

      {/* 2-col split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Template column */}
        <div
          style={{
            display: 'flex', flexDirection: 'column',
            border: '1px solid var(--line-1)', borderRadius: 8,
            background: 'var(--surface-panel)', overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderBottom: '1px solid var(--line-1)',
              background: 'var(--surface-sunken)',
            }}
          >
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', fontWeight: 600 }}>
              Prompt template
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="r-chip r-chip-grey" style={{ fontFamily: 'var(--font-num)' }}>{Math.round(currentPrompt.length / 4)} tokens</span>
              <span className="r-chip r-chip-blue">{(currentPrompt.match(/\{[A-Z_]+\}/g) ?? []).length} slots</span>
            </div>
          </div>
          <PromptEditor value={currentPrompt} onChange={handlePromptChange} />
        </div>

        {/* Preview column */}
        <div
          style={{
            display: 'flex', flexDirection: 'column',
            border: '1px solid var(--line-1)', borderRadius: 8,
            background: 'var(--surface-panel)', overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderBottom: '1px solid var(--line-1)',
              background: 'var(--surface-sunken)',
            }}
          >
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', fontWeight: 600 }}>
              Preview · cell A1
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="r-chip r-chip-grey">price=80</span>
              <span className="r-chip r-chip-grey">walkaway=92</span>
              <span className="r-chip r-chip-grey">strong</span>
            </div>
          </div>
          <PromptPreview value={currentPrompt} subs={PREVIEW_SUBS} />
        </div>
      </div>

      {/* Slots table */}
      <div
        style={{
          marginTop: 20, border: '1px solid var(--line-1)', borderRadius: 8,
          overflow: 'hidden', background: 'var(--surface-panel)',
        }}
      >
        {/* Slots header */}
        <div
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', borderBottom: '1px solid var(--line-1)',
            background: 'var(--surface-sunken)',
          }}
        >
          <h4
            style={{
              fontFamily: 'var(--font-h)', fontSize: 13, fontWeight: 700,
              margin: 0, color: 'var(--text-1)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}
          >
            Slots used in this prompt
          </h4>
          <button className="r-btn r-btn-ghost r-btn-sm" onClick={addSlot}><Icon name="plus" size={13} /> Add slot</button>
        </div>

        {/* Table header */}
        <div
          style={{
            display: 'grid', gridTemplateColumns: '220px 90px 1fr 200px',
            gap: 12, padding: '10px 14px', alignItems: 'center',
            fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'var(--text-4)', fontWeight: 600,
            background: 'var(--surface-sunken)',
            borderBottom: '1px solid var(--line-1)',
          }}
        >
          <div>Name</div>
          <div>Type</div>
          <div>Description</div>
          <div>Used in</div>
        </div>

        {/* Table rows */}
        {slots.map((s, idx) => (
          <div
            key={s.name}
            style={{
              display: 'grid', gridTemplateColumns: '220px 90px 1fr 200px',
              gap: 12, padding: '10px 14px', alignItems: 'center',
              fontSize: 12.5,
              borderBottom: idx < slots.length - 1 ? '1px solid var(--line-1)' : 'none',
            }}
          >
            <div>
              <span
                style={{
                  background: 'var(--accent-2-soft)', color: 'var(--accent-2)',
                  fontFamily: 'var(--font-mono)', fontWeight: 600,
                  borderRadius: 4, padding: '1px 6px', fontSize: 12,
                }}
              >
                {`{${s.name}}`}
              </span>
            </div>
            <div><span className="r-chip r-chip-grey">{s.type}</span></div>
            <div style={{ color: 'var(--text-2)' }}>{s.desc}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {s.name.startsWith('BUYER') && <span className="r-chip r-chip-blue">Buyer</span>}
              {s.name.startsWith('SELLER') && <span className="r-chip r-chip-orange">Seller</span>}
              {s.name === 'VOLUME_TARGET' && (
                <>
                  <span className="r-chip r-chip-blue">Buyer</span>
                  <span className="r-chip r-chip-orange">Seller</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 4 — Outcomes                                                  */
/* ------------------------------------------------------------------ */

interface OutcomesPaneProps {
  csvColumns: CsvColumn[];
  utilityFunction: string;
  onCsvColumnsChange: (cols: CsvColumn[]) => void;
  onUtilityFunctionChange: (id: string) => void;
}

function OutcomesPane({ csvColumns, utilityFunction, onCsvColumnsChange, onUtilityFunctionChange }: OutcomesPaneProps) {
  const srcChipColor = (src: string) =>
    src === 'auto' ? 'grey' : src === 'extracted' ? 'blue' : 'orange';

  const addColumn = () => {
    const col = `col_${Date.now()}`;
    onCsvColumnsChange([...csvColumns, { col, type: 'string', src: 'derived', required: false, where: 'Custom' }]);
  };

  const removeColumn = (col: string) => {
    onCsvColumnsChange(csvColumns.filter(c => c.col !== col));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'flex-start' }}>
      {/* Main */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.005em' }}>
              Outcomes &amp; CSV
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '2px 0 0', maxWidth: 560 }}>
              Define the columns of your output CSV. One row per dyad.
            </p>
          </div>
          <button className="r-btn r-btn-secondary r-btn-sm" onClick={addColumn}><Icon name="plus" size={13} /> Add column</button>
        </div>

        {/* CSV table */}
        <div
          style={{
            border: '1px solid var(--line-1)', borderRadius: 8,
            overflow: 'hidden', background: 'var(--surface-panel)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'grid', gridTemplateColumns: '32px 200px 90px 1fr 80px 40px',
              gap: 12, padding: '10px 14px', alignItems: 'center',
              background: 'var(--surface-sunken)',
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--text-4)', fontWeight: 600,
              borderBottom: '1px solid var(--line-1)',
            }}
          >
            <div>#</div>
            <div>Column</div>
            <div>Type</div>
            <div>Source</div>
            <div>Required</div>
            <div />
          </div>

          {/* Rows */}
          {csvColumns.map((row, idx) => (
            <div
              key={row.col}
              style={{
                display: 'grid', gridTemplateColumns: '32px 200px 90px 1fr 80px 40px',
                gap: 12, padding: '10px 14px', alignItems: 'center',
                fontSize: 12.5,
                borderBottom: idx < csvColumns.length - 1 ? '1px solid var(--line-1)' : 'none',
              }}
            >
              <div style={{ color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>{idx + 1}</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-1)', fontWeight: 600, fontSize: 12 }}>{row.col}</div>
              <div><span className="r-chip r-chip-grey">{row.type}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`r-chip r-chip-${srcChipColor(row.src)}`}>{row.src}</span>
                <span style={{ color: 'var(--text-3)', fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>{row.where}</span>
              </div>
              <div>
                {row.required
                  ? <Icon name="check" size={14} stroke={2} />
                  : <span style={{ color: 'var(--text-4)' }}>&mdash;</span>
                }
              </div>
              <div>
                <button
                  title="Delete column"
                  onClick={() => removeColumn(row.col)}
                  style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: 'transparent', border: 0, color: 'var(--accent-1)',
                    cursor: 'pointer', display: 'grid', placeItems: 'center',
                  }}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Utility function */}
        <h4
          style={{
            fontFamily: 'var(--font-h)', fontSize: 13, fontWeight: 700,
            margin: '24px 0 0', color: 'var(--text-1)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}
        >
          Utility function
        </h4>
        <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '0 0 12px', maxWidth: 560 }}>
          How DEXLab scores each dyad's outcome. Used in cell-mean tables and the Results dashboard.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {UTILITY_OPTIONS.map(u => {
            const isSel = utilityFunction === u.id;
            return (
              <label
                key={u.id}
                onClick={() => onUtilityFunctionChange(u.id)}
                style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  background: isSel ? 'rgba(0,162,219,0.04)' : 'var(--surface-panel)',
                  border: `1px solid ${isSel ? 'var(--accent-2)' : 'var(--line-1)'}`,
                  borderRadius: 8, padding: '12px 16px', cursor: 'pointer',
                  boxShadow: isSel ? '0 0 0 1px var(--accent-2)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: `1.5px solid ${isSel ? 'var(--accent-2)' : 'var(--line-2)'}`,
                    display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1,
                  }}
                >
                  {isSel && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-2)' }} />}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-h)', fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{u.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{u.desc}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Aside */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 16 }}>
        <AsideCard>
          <AsideHeader icon="download">CSV preview</AsideHeader>
          <pre
            style={{
              background: 'var(--surface-panel)', border: '1px solid var(--line-1)',
              borderRadius: 6, padding: 10,
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)',
              margin: '0 0 10px', lineHeight: 1.6, overflowX: 'auto',
            }}
          >
{`dyad_id,cell_id,outcome,final_price,rounds_used,judge_verdict,anomaly
d_0001,A1,deal,82.50,7,cooperative,false
d_0002,A1,deal,79.00,11,competitive,false
d_0003,A1,walkaway,,12,stalled,false
d_0004,A2,deal,85.00,5,cooperative,false
\u2026`}
          </pre>
          <button
            className="r-btn r-btn-secondary r-btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Icon name="download" size={13} /> Download schema (.json)
          </button>
        </AsideCard>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Build a Scenario-compatible config from the current mock data (used as defaults for new scenarios). */
function buildDefaultConfig(
  agents: Agent[],
  csvColumns: CsvColumn[],
  utilityFunction: string,
  prompts: Record<string, string>,
): Omit<Scenario, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { name: string; description: string } {
  return {
    name: 'B2B Renegotiation — capability variant',
    description: 'Buyer-seller negotiation with judge and analyst supervisors.',
    isPublic: false,
    isTemplate: false,
    domainAgents: agents.filter(a => a.role === 'domain').map(a => ({
      name: a.name,
      description: a.desc,
      defaultPromptTemplate: prompts[a.id] ?? '',
    })),
    supervisors: agents.filter(a => a.role === 'supervisor').map(a => ({
      name: a.name,
      type: 'classifier' as const,
      timing: 'per_round' as const,
      outputSchema: {},
      promptTemplate: prompts[a.id] ?? '',
    })),
    turnPolicy: {
      type: 'alternating',
      roundDefinition: agents.filter(a => a.role === 'domain').map(a => a.name),
    },
    terminationConditions: [
      { type: 'turn_cap', maxTurns: 12 },
    ],
    outcomeSchema: {
      columns: csvColumns.map(c => ({
        name: c.col,
        type: c.type as 'string' | 'integer' | 'float',
        nullable: !c.required,
      })),
      utilityFunction: utilityFunction === 'piesplit' ? 'weighted_sum'
        : utilityFunction === 'binary' ? 'single_binary'
        : utilityFunction === 'multi' ? 'multi_class'
        : 'custom',
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

interface ScenarioBuilderProps {
  scenarioId?: string;
  onUseInExperiment?: (scenarioId: string) => void;
}

export function ScenarioBuilder({ scenarioId, onUseInExperiment }: ScenarioBuilderProps) {
  const [tab, setTab] = useState<TabId>('agents');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [scenarioName, setScenarioName] = useState('B2B Renegotiation — capability variant');
  const [scenarioDesc, setScenarioDesc] = useState('Buyer-seller negotiation with judge and analyst supervisors.');
  const [currentId, setCurrentId] = useState<string | undefined>(scenarioId);
  const [loading, setLoading] = useState(!!scenarioId);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastSavedLabel, setLastSavedLabel] = useState<string>('');
  // Lifted sub-pane state
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [turnPolicyId, setTurnPolicyId] = useState('strict');
  const [stopConditions, setStopConditions] = useState<StopCondition[]>(DEFAULT_STOP_CONDITIONS);
  const [prompts, setPrompts] = useState<Record<string, string>>(DEFAULT_PROMPTS);
  const [csvColumns, setCsvColumns] = useState<CsvColumn[]>(DEFAULT_CSV_COLUMNS);
  const [utilityFunction, setUtilityFunction] = useState('piesplit');

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  // Update relative time label every 10s
  useEffect(() => {
    if (!lastSaved) return;
    setLastSavedLabel(formatTimeAgo(lastSaved));
    const interval = setInterval(() => {
      setLastSavedLabel(formatTimeAgo(lastSaved));
    }, 10_000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  // Load scenario from Supabase when scenarioId is provided
  useEffect(() => {
    if (!scenarioId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const loaded = await loadScenario(scenarioId);
      if (cancelled) return;
      if (loaded) {
        setScenario(loaded);
        setScenarioName(loaded.name);
        setScenarioDesc(loaded.description);
        setCurrentId(loaded.id);
        setLastSaved(new Date(loaded.updatedAt));

        // Hydrate lifted state from loaded scenario
        const loadedAgents: Agent[] = [
          ...loaded.domainAgents.map((a, idx): Agent => ({
            id: `domain-${idx}`,
            name: a.name,
            role: 'domain',
            desc: a.description,
            provider: 'OpenAI',
            model: 'gpt-4o',
            temp: 0.7,
            max: 800,
            color: idx === 0 ? 'blue' : 'orange',
          })),
          ...loaded.supervisors.map((s, idx): Agent => ({
            id: `supervisor-${idx}`,
            name: s.name,
            role: 'supervisor',
            desc: '',
            provider: 'OpenAI',
            model: 'gpt-4o-mini',
            temp: 0.0,
            max: 200,
            color: 'grey',
          })),
        ];
        setAgents(loadedAgents);

        const loadedPrompts: Record<string, string> = {};
        loaded.domainAgents.forEach((a, idx) => {
          loadedPrompts[`domain-${idx}`] = a.defaultPromptTemplate;
        });
        loaded.supervisors.forEach((s, idx) => {
          loadedPrompts[`supervisor-${idx}`] = s.promptTemplate;
        });
        setPrompts(loadedPrompts);

        if (loaded.outcomeSchema.columns.length > 0) {
          setCsvColumns(loaded.outcomeSchema.columns.map(c => ({
            col: c.name,
            type: c.type,
            src: 'auto',
            required: !c.nullable,
            where: 'Loaded',
          })));
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [scenarioId]);

  const doSave = useCallback(async () => {
    setSaving(true);
    const defaults = buildDefaultConfig(agents, csvColumns, utilityFunction, prompts);
    const config = scenario
      ? {
          name: scenarioName,
          description: scenarioDesc,
          isPublic: scenario.isPublic,
          isTemplate: scenario.isTemplate,
          domainAgents: defaults.domainAgents,
          supervisors: defaults.supervisors,
          turnPolicy: defaults.turnPolicy,
          terminationConditions: scenario.terminationConditions,
          outcomeSchema: defaults.outcomeSchema,
        }
      : { ...defaults, name: scenarioName, description: scenarioDesc };

    const saved = await saveScenario(config, currentId);
    setSaving(false);
    if (saved) {
      setScenario(saved);
      setCurrentId(saved.id);
      setLastSaved(new Date());
      dirty.current = false;
    }
  }, [scenario, scenarioName, scenarioDesc, currentId, agents, csvColumns, utilityFunction, prompts]);

  // Auto-save: debounce 3s after last change
  const scheduleAutoSave = useCallback(() => {
    dirty.current = true;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => { void doSave(); }, 3000);
  }, [doSave]);

  // Mark dirty on name/desc changes (triggers auto-save)
  const handleNameChange = useCallback((name: string) => {
    setScenarioName(name);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleDescChange = useCallback((desc: string) => {
    setScenarioDesc(desc);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  void handleDescChange; // used via doSave deps only

  const handleDuplicate = useCallback(async () => {
    if (!currentId) {
      const defaults = buildDefaultConfig(agents, csvColumns, utilityFunction, prompts);
      const saved = await saveScenario(
        { ...defaults, name: scenarioName, description: scenarioDesc },
      );
      if (!saved) return;
      const cloned = await cloneScenario(saved.id);
      if (cloned) {
        setScenario(cloned);
        setScenarioName(cloned.name);
        setScenarioDesc(cloned.description);
        setCurrentId(cloned.id);
        setLastSaved(new Date());
      }
      return;
    }
    // Save current first if dirty
    if (dirty.current) await doSave();
    const cloned = await cloneScenario(currentId);
    if (cloned) {
      setScenario(cloned);
      setScenarioName(cloned.name);
      setScenarioDesc(cloned.description);
      setCurrentId(cloned.id);
      setLastSaved(new Date());
    }
  }, [currentId, scenarioName, scenarioDesc, doSave, agents, csvColumns, utilityFunction, prompts]);

  const agentCount = agents.length;

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
        Loading scenario...
      </div>
    );
  }

  return (
    <div>
      {/* Page head */}
      <div
        style={{
          padding: '16px 24px 0',
          borderBottom: '1px solid var(--line-1)',
          background: 'var(--surface-panel)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Breadcrumb */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: 'var(--text-3)',
              }}
            >
              <a href="#" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Scenarios</a>
              <Icon name="chevron" size={12} />
              <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{scenarioName}</span>
              {scenario?.isTemplate && <span className="r-chip r-chip-grey">Template</span>}
            </div>

            {/* Title — editable */}
            <input
              value={scenarioName}
              onChange={e => handleNameChange(e.target.value)}
              style={{
                fontFamily: 'var(--font-h)', fontSize: 19, fontWeight: 700,
                letterSpacing: '-0.01em', margin: '6px 0 4px', color: 'var(--text-1)',
                background: 'transparent', border: 0, outline: 'none',
                width: '100%', padding: 0,
              }}
            />
            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
              {saving
                ? 'Saving...'
                : lastSaved
                  ? `Last saved ${lastSavedLabel}`
                  : 'Not saved yet'}
              {' '}&middot; {agentCount} agents &middot; {SLOTS.length} slots
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="r-btn r-btn-ghost" onClick={() => void doSave()}>
              <Icon name="check" size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="r-btn r-btn-secondary" onClick={() => void handleDuplicate()}>
              <Icon name="copy" size={14} /> Duplicate
            </button>
            <button
              className="r-btn r-btn-primary"
              disabled={!onUseInExperiment || !currentId}
              onClick={() => {
                if (onUseInExperiment && currentId) {
                  onUseInExperiment(currentId);
                }
              }}
            >
              <Icon name="flask" size={14} /> Use in experiment
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <TabBar tabs={TABS} current={tab} onChange={setTab} />
      </div>

      {/* Tab body */}
      <div style={{ padding: '16px 24px 32px' }}>
        {tab === 'agents' && (
          <AgentsPane
            agents={agents}
            onChange={setAgents}
          />
        )}
        {tab === 'policy' && (
          <PolicyPane
            turnPolicyId={turnPolicyId}
            stopConditions={stopConditions}
            onPolicyChange={setTurnPolicyId}
            onStopConditionsChange={setStopConditions}
          />
        )}
        {tab === 'prompts' && (
          <PromptsPane
            agents={agents}
            prompts={prompts}
            onPromptsChange={setPrompts}
          />
        )}
        {tab === 'outcomes' && (
          <OutcomesPane
            csvColumns={csvColumns}
            utilityFunction={utilityFunction}
            onCsvColumnsChange={setCsvColumns}
            onUtilityFunctionChange={setUtilityFunction}
          />
        )}
      </div>
    </div>
  );
}
