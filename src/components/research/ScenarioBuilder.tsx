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

const AGENTS: Agent[] = [
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
  { name: 'BUYER_TARGET_PRICE', desc: 'Target unit price the buyer aims for (\u20AC).', type: 'number' },
  { name: 'BUYER_WALKAWAY', desc: 'Highest price the buyer will accept (\u20AC).', type: 'number' },
  { name: 'SELLER_FLOOR_PRICE', desc: 'Lowest price the seller can accept (\u20AC).', type: 'number' },
  { name: 'VOLUME_TARGET', desc: 'Annual volume in units.', type: 'number' },
  { name: 'BUYER_CAPABILITY', desc: 'Negotiation skill profile (strong/weak).', type: 'enum' },
];

const BUYER_PROMPT = `You are the BUYER, procurement manager at Atrium Logistics.

CONTEXT
You are negotiating a 12-month supply contract for industrial sensors with the seller. You hold private information about your budget and walk-away.

YOUR PRIVATE INFORMATION
- Target unit price: \u20AC{BUYER_TARGET_PRICE}
- Walk-away (highest acceptable): \u20AC{BUYER_WALKAWAY}
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

interface TurnPolicy {
  id: string;
  label: string;
  desc: string;
  recommended: boolean;
}

const TURN_POLICIES: TurnPolicy[] = [
  { id: 'strict', label: 'Strict alternation', desc: 'A \u2192 B \u2192 A \u2192 B. Most common. Predictable for analysis.', recommended: true },
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

function AgentCard({ a }: { a: Agent }) {
  const avatarBg = a.color === 'blue' ? 'var(--accent-2-soft)'
    : a.color === 'orange' ? 'var(--accent-1-soft)'
    : 'var(--surface-sunken)';
  const avatarColor = a.color === 'blue' ? 'var(--accent-2)'
    : a.color === 'orange' ? 'var(--accent-1)'
    : 'var(--text-3)';

  const providerColor = PROVIDERS[a.provider]?.color ?? 'var(--text-3)';

  const promptInfo = a.id === 'buyer' ? '212 tokens \u00B7 5 slots'
    : a.id === 'seller' ? '198 tokens \u00B7 4 slots'
    : a.id === 'judge' ? '84 tokens \u00B7 0 slots'
    : '146 tokens \u00B7 1 slot';

  return (
    <div
      style={{
        background: 'var(--surface-panel)', border: '1px solid var(--line-1)',
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
          {(['edit', 'copy', 'trash'] as const).map(icon => (
            <button
              key={icon}
              title={icon === 'edit' ? 'Edit' : icon === 'copy' ? 'Duplicate' : 'Remove'}
              style={{
                width: 32, height: 32, borderRadius: 6,
                background: 'transparent', border: 0,
                color: 'var(--text-2)', cursor: 'pointer',
                display: 'grid', placeItems: 'center',
              }}
            >
              <Icon name={icon} size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Spec strip */}
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

function PromptEditor({ value }: { value: string }) {
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
    <div
      style={{
        padding: 16, height: 380, overflow: 'auto',
        fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.65,
        color: 'var(--text-1)', background: 'var(--surface-panel)',
      }}
    >
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{parts}</pre>
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
/*  Tab 1 — Agents                                                    */
/* ------------------------------------------------------------------ */

function AgentsPane() {
  const [agents, setAgents] = useState<Agent[]>(AGENTS);

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
    setAgents(prev => [...prev, newAgent]);
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
          {agents.map(a => <AgentCard key={a.id} a={a} />)}
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

interface StopCondition {
  id: string;
  chip: string;
  chipColor: 'blue' | 'grey';
  text: string;
}

function PolicyPane() {
  const [selected, setSelected] = useState('strict');
  const [stopConditions, setStopConditions] = useState<StopCondition[]>([
    { id: 'accept', chip: '[ACCEPT]', chipColor: 'blue', text: 'token in any agent message' },
    { id: 'walkaway', chip: '[WALKAWAY]', chipColor: 'blue', text: 'token in any agent message' },
    { id: 'cap', chip: 'round >= 12', chipColor: 'grey', text: 'Hard cap on rounds' },
  ]);

  const addCondition = () => {
    const id = `cond-${Date.now()}`;
    setStopConditions(prev => [...prev, { id, chip: '[STOP]', chipColor: 'grey', text: 'Custom stop condition' }]);
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
            const isSel = selected === p.id;
            return (
              <label
                key={p.id}
                onClick={() => setSelected(p.id)}
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

function PromptsPane() {
  const [selectedAgent, setSelectedAgent] = useState('buyer');
  const [slots, setSlots] = useState<Slot[]>(SLOTS);

  const handleDuplicate = () => {
    const label = AGENTS.find(a => a.id === selectedAgent)?.name ?? selectedAgent;
    alert(`Prompt for "${label}" duplicated. (Not yet persisted — coming soon.)`);
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
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
            style={{
              width: 220, padding: '6px 10px', borderRadius: 6,
              border: '1px solid var(--line-2)', background: 'var(--surface-panel)',
              fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-1)',
            }}
          >
            <option value="buyer">Buyer &middot; system prompt</option>
            <option value="seller">Seller &middot; system prompt</option>
            <option value="judge">Judge &middot; system prompt</option>
            <option value="analyst">Analyst &middot; system prompt</option>
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
              <span className="r-chip r-chip-grey" style={{ fontFamily: 'var(--font-num)' }}>212 tokens</span>
              <span className="r-chip r-chip-blue">5 slots</span>
            </div>
          </div>
          <PromptEditor value={BUYER_PROMPT} />
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
              Preview &middot; cell A1
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="r-chip r-chip-grey">price=80</span>
              <span className="r-chip r-chip-grey">walkaway=92</span>
              <span className="r-chip r-chip-grey">strong</span>
            </div>
          </div>
          <PromptPreview value={BUYER_PROMPT} subs={PREVIEW_SUBS} />
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

interface CsvColumn {
  col: string;
  type: string;
  src: string;
  required: boolean;
  where: string;
}

const CSV_COLUMNS: CsvColumn[] = [
  { col: 'dyad_id', type: 'string', src: 'auto', required: true, where: 'System' },
  { col: 'cell_id', type: 'string', src: 'auto', required: true, where: 'Experiment cell' },
  { col: 'outcome', type: 'enum', src: 'extracted', required: true, where: 'Analyst \u2192 final[outcome]' },
  { col: 'final_price', type: 'number', src: 'extracted', required: false, where: 'Analyst \u2192 final[price]' },
  { col: 'rounds_used', type: 'number', src: 'auto', required: true, where: 'Counter' },
  { col: 'judge_verdict', type: 'enum', src: 'extracted', required: false, where: 'Judge \u2192 terminal label' },
  { col: 'anomaly', type: 'boolean', src: 'derived', required: true, where: 'Heuristic' },
];

interface UtilOption {
  id: string;
  label: string;
  desc: string;
  sel: boolean;
}

const UTILITY_OPTIONS: UtilOption[] = [
  { id: 'piesplit', label: 'Pie-split / surplus', desc: 'Buyer + seller surplus from a single price.', sel: true },
  { id: 'multi', label: 'Multi-issue weighted', desc: 'Sum of issue \u00D7 weight per side.', sel: false },
  { id: 'binary', label: 'Binary verdict', desc: 'Win / loss / hung.', sel: false },
  { id: 'custom', label: 'Custom expression', desc: 'JS-style scoring expression.', sel: false },
];

function OutcomesPane() {
  const [selectedUtil, setSelectedUtil] = useState('piesplit');
  const [csvColumns, setCsvColumns] = useState<CsvColumn[]>(CSV_COLUMNS);

  const srcChipColor = (src: string) =>
    src === 'auto' ? 'grey' : src === 'extracted' ? 'blue' : 'orange';

  const addColumn = () => {
    const col = `col_${Date.now()}`;
    setCsvColumns(prev => [...prev, { col, type: 'string', src: 'derived', required: false, where: 'Custom' }]);
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
                  style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: 'transparent', border: 0, color: 'var(--text-2)',
                    cursor: 'pointer', display: 'grid', placeItems: 'center',
                  }}
                >
                  <Icon name="moreH" size={14} />
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
            const isSel = selectedUtil === u.id;
            return (
              <label
                key={u.id}
                onClick={() => setSelectedUtil(u.id)}
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
function buildDefaultConfig(): Omit<Scenario, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  return {
    name: 'B2B Renegotiation — capability variant',
    description: 'Buyer-seller negotiation with judge and analyst supervisors.',
    isPublic: false,
    isTemplate: false,
    domainAgents: AGENTS.filter(a => a.role === 'domain').map(a => ({
      name: a.name,
      description: a.desc,
      defaultPromptTemplate: '',
    })),
    supervisors: AGENTS.filter(a => a.role === 'supervisor').map(a => ({
      name: a.name,
      type: 'classifier' as const,
      timing: 'per_round' as const,
      outputSchema: {},
      promptTemplate: '',
    })),
    turnPolicy: {
      type: 'alternating',
      roundDefinition: ['Buyer', 'Seller'],
    },
    terminationConditions: [
      { type: 'turn_cap', maxTurns: 12 },
    ],
    outcomeSchema: {
      columns: CSV_COLUMNS.map(c => ({
        name: c.col,
        type: c.type as 'string' | 'integer' | 'float',
        nullable: !c.required,
      })),
      utilityFunction: 'weighted_sum',
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

interface ScenarioBuilderProps {
  scenarioId?: string;
}

export function ScenarioBuilder({ scenarioId }: ScenarioBuilderProps) {
  const [tab, setTab] = useState<TabId>('agents');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [scenarioName, setScenarioName] = useState('B2B Renegotiation — capability variant');
  const [scenarioDesc, setScenarioDesc] = useState('Buyer-seller negotiation with judge and analyst supervisors.');
  const [currentId, setCurrentId] = useState<string | undefined>(scenarioId);
  const [loading, setLoading] = useState(!!scenarioId);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastSavedLabel, setLastSavedLabel] = useState<string>('');
  const [showExperimentMsg, setShowExperimentMsg] = useState(false);
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
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [scenarioId]);

  const doSave = useCallback(async () => {
    setSaving(true);
    const config = scenario
      ? {
          name: scenarioName,
          description: scenarioDesc,
          isPublic: scenario.isPublic,
          isTemplate: scenario.isTemplate,
          domainAgents: scenario.domainAgents,
          supervisors: scenario.supervisors,
          turnPolicy: scenario.turnPolicy,
          terminationConditions: scenario.terminationConditions,
          outcomeSchema: scenario.outcomeSchema,
        }
      : { ...buildDefaultConfig(), name: scenarioName, description: scenarioDesc };

    const saved = await saveScenario(config, currentId);
    setSaving(false);
    if (saved) {
      setScenario(saved);
      setCurrentId(saved.id);
      setLastSaved(new Date());
      dirty.current = false;
    }
  }, [scenario, scenarioName, scenarioDesc, currentId]);

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

  const handleDuplicate = useCallback(async () => {
    if (!currentId) {
      // Save first, then clone
      const saved = await saveScenario(
        { ...buildDefaultConfig(), name: scenarioName, description: scenarioDesc },
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
  }, [currentId, scenarioName, scenarioDesc, doSave]);

  const agentCount = scenario
    ? scenario.domainAgents.length + scenario.supervisors.length
    : AGENTS.length;

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
              onClick={() => setShowExperimentMsg(true)}
            >
              <Icon name="flask" size={14} /> Use in experiment
            </button>
          </div>
        </div>

        {/* Experiment placeholder message */}
        {showExperimentMsg && (
          <div
            style={{
              margin: '12px 0 0',
              padding: '10px 14px',
              background: 'var(--accent-2-soft)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--accent-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Icon name="flask" size={14} />
            Experiment integration coming soon. This scenario will be available in the Experiments tab.
            <button
              onClick={() => setShowExperimentMsg(false)}
              style={{
                marginLeft: 'auto', background: 'transparent', border: 0,
                color: 'var(--accent-2)', cursor: 'pointer', padding: '2px 6px',
              }}
            >
              <Icon name="close" size={12} />
            </button>
          </div>
        )}

        {/* Tab bar */}
        <TabBar tabs={TABS} current={tab} onChange={setTab} />
      </div>

      {/* Tab body */}
      <div style={{ padding: '16px 24px 32px' }}>
        {tab === 'agents' && <AgentsPane />}
        {tab === 'policy' && <PolicyPane />}
        {tab === 'prompts' && <PromptsPane />}
        {tab === 'outcomes' && <OutcomesPane />}
      </div>
    </div>
  );
}
