import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Icon } from './Icon';

/* ── Static mock data ── */

const MOCK_META = {
  cell: 'A4',
  dyad: 'd_0247',
  factors: { buyer_capability: 'strong', seller_provider: 'Mistral' },
  seed: 4719,
  rounds: 7,
  outcome: 'deal',
  finalPrice: '\u20ac82.50',
  duration: '38s',
  tokens: '12,408',
};

interface Turn {
  round: number;
  agent: 'buyer' | 'seller';
  text: string;
  offer: { price?: number; vol?: number; term?: number };
}

const MOCK_TURNS: Turn[] = [
  { round: 1, agent: 'buyer', text: "Good afternoon \u2014 I\u2019d like to revisit our supply contract. Given current market conditions and our volume of 50,000 units, we\u2019re targeting \u20ac78 per unit on a 12-month term.", offer: { price: 78, vol: 50000 } },
  { round: 1, agent: 'seller', text: "Thanks for opening with a number. \u20ac78 is well below where we can deliver at scale. Our floor for that volume is \u20ac92 \u2014 but I have flexibility on payment terms and I can hold a lock for 18 months.", offer: { price: 92, vol: 50000, term: 18 } },
  { round: 2, agent: 'buyer', text: "I appreciate the offer to lock the price longer, but 18 months locks us into a unit cost we can\u2019t justify. We can move to \u20ac82 on a 12-month \u2014 that gets us within striking distance of our budget.", offer: { price: 82, vol: 50000 } },
  { round: 2, agent: 'seller', text: "\u20ac82 is closer. To meet you there I\u2019d need either volume guarantees of 60k or net-30 terms cut to net-15. Which works better for your team?", offer: { price: 82, vol: 60000 } },
  { round: 3, agent: 'buyer', text: "We can\u2019t move to 60k \u2014 that\u2019s a real capacity question on our end. Net-15 we can do, given the unit price comes in at \u20ac82.", offer: { price: 82, vol: 50000, term: 12 } },
  { round: 3, agent: 'seller', text: "Then \u20ac82.50 with net-15, 12-month \u2014 that\u2019s the lowest I can take this. If we\u2019re aligned, I\u2019ll send the term sheet today.", offer: { price: 82.5, vol: 50000, term: 12 } },
  { round: 4, agent: 'buyer', text: "\u20ac82.50 net-15 12-month works. Send the term sheet \u2014 we\u2019ll counter-sign tomorrow. [ACCEPT]", offer: { price: 82.5, vol: 50000 } },
];

interface JudgeDecision {
  round: number;
  label: 'cooperative' | 'competitive';
  conf: number;
  rat: string;
}

const MOCK_JUDGE: JudgeDecision[] = [
  { round: 1, label: 'cooperative', conf: 0.78, rat: 'Both sides open with concrete numbers and frame the gap honestly. No posturing.' },
  { round: 2, label: 'competitive', conf: 0.62, rat: 'Seller introduces conditional asks (volume, net-15) tied to price concessions \u2014 characteristic distributive move.' },
  { round: 3, label: 'cooperative', conf: 0.84, rat: 'Buyer accepts a non-price concession (net-15) to bridge price. Mutual movement on different issues.' },
  { round: 4, label: 'cooperative', conf: 0.91, rat: 'Closure with [ACCEPT]; no walkaway, no late posturing. Terminal cooperative.' },
];

const MOCK_OUTCOME_JSON = `{
  "outcome": "deal",
  "final_price": 82.50,
  "volume": 50000,
  "term_months": 12,
  "payment": "net-15",
  "rounds_used": 7,
  "buyer_surplus": 9.50,
  "seller_surplus": 2.50,
  "joint_surplus": 12.00
}`;

/* ── Supabase row types ── */

interface TranscriptMessageRow {
  id: string;
  dyad_id: string;
  turn: number;
  agent_name: string;
  content: string;
  provider: string | null;
  model: string | null;
  token_usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  time_taken_ms: number | null;
  word_count: number | null;
  created_at: string | null;
}

interface SupervisorOutputRow {
  id: string;
  dyad_id: string;
  after_turn: number;
  supervisor_name: string;
  output_type: string;
  parsed: Record<string, unknown>;
  raw_response: string;
}

interface DyadDetailRow {
  id: string;
  cell_label: string;
  factors: Record<string, string>;
  status: string;
  seed: number;
  termination_reason: string | null;
  termination_turn: number | null;
  completed_at: string | null;
  started_at: string | null;
  run_id: string;
}

/* ── Helpers ── */

function avatarBg(col: 'blue' | 'orange' | 'grey'): string {
  if (col === 'blue') return 'var(--accent-2-soft)';
  if (col === 'orange') return 'var(--accent-1-soft)';
  return 'var(--surface-sunken)';
}

function avatarColor(col: 'blue' | 'orange' | 'grey'): string {
  if (col === 'blue') return 'var(--accent-2)';
  if (col === 'orange') return 'var(--accent-1)';
  return 'var(--text-3)';
}

function chipColor(label: string): { bg: string; color: string } {
  if (label === 'cooperative') return { bg: 'rgba(46,163,107,0.10)', color: 'var(--success)' };
  if (label === 'competitive') return { bg: 'var(--accent-1-soft)', color: 'var(--accent-1)' };
  return { bg: 'var(--surface-sunken)', color: 'var(--text-3)' };
}

function barFillColor(conf: number): string {
  if (conf > 0.8) return 'var(--success)';
  if (conf > 0.6) return 'var(--accent-2)';
  return 'var(--accent-1)';
}

function agentColor(agentName: string): 'blue' | 'orange' | 'grey' {
  const lower = agentName.toLowerCase();
  if (lower.includes('buyer')) return 'blue';
  if (lower.includes('seller')) return 'orange';
  return 'grey';
}

/* ── Sub-components ── */

const offerPillStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  background: 'var(--surface-sunken)',
  padding: '1px 7px',
  borderRadius: 3,
  color: 'var(--text-1)',
  fontWeight: 600,
};

function TurnBubble({ t }: { t: Turn }) {
  const isBuyer = t.agent === 'buyer';
  const hasAccept = t.text.includes('[ACCEPT]');
  const bodyText = hasAccept ? t.text.replace(/\[ACCEPT\]/g, '').trim() : t.text;

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        maxWidth: '86%',
        alignSelf: isBuyer ? 'flex-start' : 'flex-end',
        flexDirection: isBuyer ? 'row' : 'row-reverse',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-h)',
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
          background: isBuyer ? 'var(--accent-2-soft)' : 'var(--accent-1-soft)',
          color: isBuyer ? 'var(--accent-2)' : 'var(--accent-1)',
        }}
      >
        {isBuyer ? 'B' : 'S'}
      </div>
      <div
        style={{
          background: isBuyer ? 'var(--surface-panel)' : 'rgba(232,78,16,0.04)',
          border: `1px solid ${isBuyer ? 'var(--line-1)' : 'rgba(232,78,16,0.18)'}`,
          borderRadius: 12,
          ...(isBuyer ? { borderTopLeftRadius: 4 } : { borderTopRightRadius: 4 }),
          padding: '12px 16px',
          flex: 1,
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-h)', fontSize: 12.5, fontWeight: 700, color: 'var(--text-1)' }}>
            {isBuyer ? 'Buyer' : 'Seller'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-3)' }}>
            {isBuyer ? 'claude-sonnet-4.5' : 'mistral-large'}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            round {t.round}
          </span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-1)' }}>
          {bodyText}
          {hasAccept && (
            <span
              style={{
                display: 'inline-block',
                marginLeft: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--success)',
                background: 'rgba(46,163,107,0.10)',
                padding: '1px 7px',
                borderRadius: 3,
              }}
            >
              [ACCEPT]
            </span>
          )}
        </div>
        {t.offer && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginTop: 10,
              paddingTop: 8,
              borderTop: '1px dashed var(--line-1)',
              fontSize: 11,
            }}
          >
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', fontWeight: 600, fontSize: 10 }}>
              offer extracted
            </span>
            {t.offer.price != null && <span style={offerPillStyle}>{'\u20ac'}{t.offer.price}</span>}
            {t.offer.vol != null && <span style={offerPillStyle}>{t.offer.vol.toLocaleString()}u</span>}
            {t.offer.term != null && <span style={offerPillStyle}>{t.offer.term}mo</span>}
          </div>
        )}
      </div>
    </div>
  );
}

interface LiveTurnBubbleProps {
  msg: TranscriptMessageRow;
}

function LiveTurnBubble({ msg }: LiveTurnBubbleProps) {
  const col = agentColor(msg.agent_name);
  const isLeft = col === 'blue';
  const hasAccept = msg.content.includes('[ACCEPT]');
  const bodyText = hasAccept ? msg.content.replace(/\[ACCEPT\]/g, '').trim() : msg.content;
  const avatarChar = msg.agent_name.charAt(0).toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        maxWidth: '86%',
        alignSelf: isLeft ? 'flex-start' : 'flex-end',
        flexDirection: isLeft ? 'row' : 'row-reverse',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-h)',
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
          background: avatarBg(col),
          color: avatarColor(col),
        }}
      >
        {avatarChar}
      </div>
      <div
        style={{
          background: isLeft ? 'var(--surface-panel)' : 'rgba(232,78,16,0.04)',
          border: `1px solid ${isLeft ? 'var(--line-1)' : 'rgba(232,78,16,0.18)'}`,
          borderRadius: 12,
          ...(isLeft ? { borderTopLeftRadius: 4 } : { borderTopRightRadius: 4 }),
          padding: '12px 16px',
          flex: 1,
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-h)', fontSize: 12.5, fontWeight: 700, color: 'var(--text-1)' }}>
            {msg.agent_name}
          </span>
          {msg.model && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-3)' }}>
              {msg.provider ? `${msg.provider} \u00b7 ` : ''}{msg.model}
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            turn {msg.turn}
          </span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-1)' }}>
          {bodyText}
          {hasAccept && (
            <span
              style={{
                display: 'inline-block',
                marginLeft: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--success)',
                background: 'rgba(46,163,107,0.10)',
                padding: '1px 7px',
                borderRadius: 3,
              }}
            >
              [ACCEPT]
            </span>
          )}
        </div>
        {msg.token_usage && (
          <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed var(--line-1)', fontSize: 10.5, color: 'var(--text-4)' }}>
            {msg.token_usage.total_tokens != null && `${msg.token_usage.total_tokens} tokens`}
            {msg.time_taken_ms != null && ` \u00b7 ${msg.time_taken_ms}ms`}
          </div>
        )}
      </div>
    </div>
  );
}

function RoundDivider({ round }: { round: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
      <span style={{ flex: 1, height: 1, background: 'var(--line-1)' }} />
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 10.5,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-4)',
          fontWeight: 600,
        }}
      >
        round {round}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--line-1)' }} />
    </div>
  );
}

function JudgeCard({ j }: { j: JudgeDecision }) {
  const chip = chipColor(j.label);
  return (
    <div style={{ background: 'var(--surface-panel)', border: '1px solid var(--line-1)', borderRadius: 6, padding: '10px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-h)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>
          Round {j.round}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 9px',
            borderRadius: 'var(--radius-pill)',
            background: chip.bg,
            color: chip.color,
          }}
        >
          {j.label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1, height: 4, background: 'var(--surface-sunken)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${j.conf * 100}%`, borderRadius: 2, background: barFillColor(j.conf) }} />
        </div>
        <span style={{ fontFamily: 'var(--font-num)', fontFeatureSettings: '"tnum"', fontSize: 11, color: 'var(--text-3)' }}>
          {(j.conf * 100).toFixed(0)}%
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{j.rat}</div>
    </div>
  );
}

function SideHeader({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-4)',
        fontWeight: 700,
        marginBottom: 8,
        fontFamily: 'var(--font-ui)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Main component ── */

export interface TranscriptViewerProps {
  dyadId?: string;
  onNavigateDyad?: (direction: 'prev' | 'next') => void;
  onBack?: () => void;
}

export function TranscriptViewer({ dyadId, onNavigateDyad, onBack }: TranscriptViewerProps) {
  const [dyad, setDyad] = useState<DyadDetailRow | null>(null);
  const [messages, setMessages] = useState<TranscriptMessageRow[]>([]);
  const [supervisorOutputs, setSupervisorOutputs] = useState<SupervisorOutputRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDyad = useCallback(async () => {
    if (!dyadId) return;
    setLoading(true);
    try {
      const [dyadResult, messagesResult, supervisorResult] = await Promise.all([
        supabase
          .from('dyads')
          .select('id, cell_label, factors, status, seed, termination_reason, termination_turn, completed_at, started_at, run_id')
          .eq('id', dyadId)
          .single(),
        supabase
          .from('transcript_messages')
          .select('id, dyad_id, turn, agent_name, content, provider, model, token_usage, time_taken_ms, word_count, created_at')
          .eq('dyad_id', dyadId)
          .order('turn', { ascending: true }),
        supabase
          .from('supervisor_outputs')
          .select('id, dyad_id, after_turn, supervisor_name, output_type, parsed, raw_response')
          .eq('dyad_id', dyadId)
          .order('after_turn', { ascending: true }),
      ]);

      if (dyadResult.data) setDyad(dyadResult.data as DyadDetailRow);
      if (messagesResult.data) setMessages(messagesResult.data as TranscriptMessageRow[]);
      if (supervisorResult.data) setSupervisorOutputs(supervisorResult.data as SupervisorOutputRow[]);
    } finally {
      setLoading(false);
    }
  }, [dyadId]);

  useEffect(() => {
    void fetchDyad();
  }, [fetchDyad]);

  const isDemo = !dyadId;

  // --- Derived data ---
  const displayDyadId = isDemo ? MOCK_META.dyad : (dyad?.id?.slice(0, 8) ?? dyadId ?? '—');
  const cellLabel = isDemo ? MOCK_META.cell : (dyad?.cell_label ?? '—');
  const seed = isDemo ? MOCK_META.seed : (dyad?.seed ?? 0);
  const terminationReason = isDemo ? 'deal' : (dyad?.termination_reason ?? '—');
  const terminationTurn = isDemo ? 7 : (dyad?.termination_turn ?? null);
  const factors = isDemo ? MOCK_META.factors : (dyad?.factors ?? {});
  const isDeal = terminationReason?.toLowerCase().includes('deal') || terminationReason?.toLowerCase().includes('accept');

  // Build unique agent list from messages
  const liveAgents = Array.from(new Set(messages.map((m) => m.agent_name))).map((name) => {
    const sample = messages.find((m) => m.agent_name === name);
    return { name, model: sample?.model ?? '—', provider: sample?.provider ?? '—' };
  });

  // Supervisor decisions for right rail (classifiers only)
  const classifierOutputs = supervisorOutputs.filter((o) => o.output_type === 'classification');
  const extractorOutput = supervisorOutputs.find((o) => o.output_type === 'extraction');

  const totalTokens = messages.reduce((sum, m) => sum + (m.token_usage?.total_tokens ?? 0), 0);

  if (!isDemo && loading && !dyad) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 60 }}>
        <span style={{ color: 'var(--text-3)', fontSize: 14 }}>Loading transcript...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Page head ── */}
      <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid var(--line-1)', background: 'var(--surface-panel)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
              <a
                href="#"
                style={{ color: 'var(--accent-2)', textDecoration: 'none' }}
                onClick={(e) => { e.preventDefault(); onBack?.(); }}
              >
                {isDemo ? 'Run #14' : `Run ${dyad?.run_id?.slice(0, 8) ?? ''}`}
              </a>
              <Icon name="chevron" size={12} />
              <a href="#" style={{ color: 'var(--accent-2)', textDecoration: 'none' }}>Cell {cellLabel}</a>
              <Icon name="chevron" size={12} />
              <span style={{ fontFamily: 'var(--font-mono)' }}>{displayDyadId}</span>
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-h)',
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                margin: '6px 0 0',
                color: 'var(--text-1)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Dyad{' '}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, marginLeft: 4 }}>{displayDyadId}</span>
              {isDeal && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginLeft: 12,
                    fontFamily: 'var(--font-ui)',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(46,163,107,0.10)',
                    color: 'var(--success)',
                  }}
                >
                  <Icon name="check" size={11} stroke={2.5} /> {isDemo ? `Deal \u00b7 ${MOCK_META.finalPrice}` : 'Deal'}
                </span>
              )}
              {!isDeal && terminationReason !== '—' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginLeft: 12,
                    fontFamily: 'var(--font-ui)',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-3)',
                  }}
                >
                  {terminationReason}
                </span>
              )}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className="r-btn r-btn-ghost r-btn-sm"
              onClick={() => onNavigateDyad?.('prev')}
              disabled={!onNavigateDyad}
            >
              <Icon name="chevron" size={13} stroke={2} /> Prev dyad
            </button>
            <button
              className="r-btn r-btn-ghost r-btn-sm"
              onClick={() => onNavigateDyad?.('next')}
              disabled={!onNavigateDyad}
            >
              Next dyad <Icon name="arrowRight" size={13} />
            </button>
            <button className="r-btn r-btn-secondary r-btn-sm">
              <Icon name="download" size={13} /> Export JSON
            </button>
          </div>
        </div>

        {/* Meta strip */}
        <div
          style={{
            display: 'flex',
            gap: 18,
            flexWrap: 'wrap',
            marginTop: 14,
            padding: '10px 14px',
            background: 'var(--surface-sunken)',
            border: '1px solid var(--line-1)',
            borderRadius: 6,
          }}
        >
          {[
            { key: 'Cell', value: cellLabel, mono: true },
            ...Object.entries(factors).map(([k, v]) => ({ key: k, value: v, mono: false })),
            { key: 'Seed', value: String(seed), mono: true },
            { key: 'Turns', value: terminationTurn != null ? `${terminationTurn}` : (isDemo ? `${MOCK_META.rounds}/12` : '—'), mono: false, num: true },
            { key: 'Tokens', value: isDemo ? MOCK_META.tokens : (totalTokens > 0 ? totalTokens.toLocaleString() : '—'), mono: false, num: true },
            { key: 'Status', value: isDemo ? 'completed' : (dyad?.status ?? '—'), mono: false },
          ].map((m) => (
            <div key={m.key} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', fontWeight: 600 }}>
                {m.key}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-1)',
                  fontWeight: 600,
                  ...(m.mono ? { fontFamily: 'var(--font-mono)' } : {}),
                  ...('num' in m && m.num ? { fontFamily: 'var(--font-num)', fontFeatureSettings: '"tnum"', fontVariantNumeric: 'tabular-nums' as const } : {}),
                }}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3-column body ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 340px', gap: 0, flex: 1, minHeight: 0 }}>
        {/* ── Left rail ── */}
        <div style={{ borderRight: '1px solid var(--line-1)', background: 'var(--surface-rail)', padding: '18px 16px', overflow: 'auto' }}>
          <SideHeader>Agents</SideHeader>
          {(isDemo
            ? [
                { name: 'Buyer', role: 'Domain', avatar: 'B', col: 'blue' as const, model: 'claude-sonnet-4.5', prov: 'Anthropic', temp: 0.7 },
                { name: 'Seller', role: 'Domain', avatar: 'S', col: 'orange' as const, model: 'mistral-large', prov: 'Mistral', temp: 0.7 },
                { name: 'Judge', role: 'Supervisor', avatar: 'J', col: 'grey' as const, model: 'gpt-4o-mini', prov: 'OpenAI', temp: 0.0 },
                { name: 'Analyst', role: 'Supervisor', avatar: 'A', col: 'grey' as const, model: 'claude-haiku-4.5', prov: 'Anthropic', temp: 0.0 },
              ]
            : liveAgents.map((a) => ({
                name: a.name,
                role: 'Domain',
                avatar: a.name.charAt(0).toUpperCase(),
                col: agentColor(a.name),
                model: a.model,
                prov: a.provider,
                temp: null as number | null,
              }))
          ).map((a) => (
            <div
              key={a.name}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                padding: '8px 10px',
                borderRadius: 6,
                background: 'var(--surface-panel)',
                border: '1px solid var(--line-1)',
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'var(--font-h)',
                  flexShrink: 0,
                  background: avatarBg(a.col),
                  color: avatarColor(a.col),
                }}
              >
                {a.avatar}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-1)' }}>
                  {a.name}{' '}
                  <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 11 }}>· {a.role}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>
                  {a.prov} · {a.model}
                </div>
                {a.temp != null && (
                  <div style={{ fontSize: 10.5, color: 'var(--text-4)' }}>temp {a.temp.toFixed(2)}</div>
                )}
              </div>
            </div>
          ))}

          <SideHeader style={{ marginTop: 18 }}>Factors</SideHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(factors).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 8px',
                  background: 'var(--surface-panel)',
                  border: '1px solid var(--line-1)',
                  borderRadius: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: 'var(--accent-2)',
                    background: 'var(--accent-2-soft)',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}
                >
                  {k}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-1)', fontWeight: 600 }}>
                  {v}
                </span>
              </div>
            ))}
          </div>

          <SideHeader style={{ marginTop: 18 }}>Anomalies</SideHeader>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--success)',
              background: 'rgba(46,163,107,0.08)',
              padding: '8px 12px',
              borderRadius: 6,
            }}
          >
            <Icon name="check" size={12} stroke={2.5} /> No anomalies flagged
          </div>
        </div>

        {/* ── Center column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface-canvas)', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 24px',
              background: 'var(--surface-panel)',
              borderBottom: '1px solid var(--line-1)',
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
              Transcript
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Show offers', 'Tokens', 'Hide system'].map((label) => (
                <button
                  key={label}
                  style={{
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'var(--font-ui)',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    background: label === 'Show offers' ? 'var(--accent-2-soft)' : 'var(--surface-sunken)',
                    color: label === 'Show offers' ? 'var(--accent-2)' : 'var(--text-3)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '24px 24px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* System top */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11.5,
                color: 'var(--text-3)',
                background: 'var(--surface-panel)',
                border: '1px dashed var(--line-2)',
                borderRadius: 6,
                padding: '8px 14px',
                alignSelf: 'center',
                maxWidth: '80%',
              }}
            >
              <Icon name="settings" size={12} /> System turn \u2014 seed {seed} \u00b7 factors bound
            </div>

            {isDemo
              ? MOCK_TURNS.map((t, i) => (
                <React.Fragment key={i}>
                  {i > 0 && t.round !== MOCK_TURNS[i - 1].round && <RoundDivider round={t.round} />}
                  <TurnBubble t={t} />
                </React.Fragment>
              ))
              : messages.length === 0
              ? (
                <div style={{ alignSelf: 'center', color: 'var(--text-4)', fontSize: 13, marginTop: 40 }}>
                  No transcript messages found.
                </div>
              )
              : messages.map((m, i) => (
                <React.Fragment key={m.id}>
                  {i > 0 && m.turn !== messages[i - 1].turn + 1 && messages[i - 1].agent_name === m.agent_name && (
                    <RoundDivider round={m.turn} />
                  )}
                  <LiveTurnBubble msg={m} />
                </React.Fragment>
              ))
            }

            {/* System bottom */}
            {(isDemo || (dyad && dyad.status === 'completed')) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11.5,
                  color: 'var(--success)',
                  background: 'rgba(46,163,107,0.04)',
                  border: '1px dashed var(--success)',
                  borderRadius: 6,
                  padding: '8px 14px',
                  alignSelf: 'center',
                  maxWidth: '80%',
                }}
              >
                <Icon name="check" size={12} stroke={2.5} />
                {isDemo
                  ? '[ACCEPT] token detected \u00b7 run terminated \u00b7 final price \u20ac82.50 \u00b7 7 rounds \u00b7 38s'
                  : `Run terminated \u00b7 reason: ${terminationReason}${terminationTurn != null ? ` \u00b7 ${terminationTurn} turns` : ''}`}
              </div>
            )}
          </div>
        </div>

        {/* ── Right rail ── */}
        <div style={{ borderLeft: '1px solid var(--line-1)', background: 'var(--surface-rail)', padding: '18px 16px', overflow: 'auto' }}>
          <SideHeader>Supervisor decisions</SideHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isDemo
              ? MOCK_JUDGE.map((j) => <JudgeCard key={j.round} j={j} />)
              : classifierOutputs.length === 0
              ? <div style={{ fontSize: 12, color: 'var(--text-4)' }}>No classifier outputs.</div>
              : classifierOutputs.map((o) => {
                  const parsed = o.parsed as { classification?: string; confidence?: number; rationale?: string };
                  const label = (parsed.classification ?? 'unknown').toLowerCase() as 'cooperative' | 'competitive';
                  const conf = parsed.confidence ?? 0.5;
                  const chip = chipColor(label);
                  return (
                    <div key={o.id} style={{ background: 'var(--surface-panel)', border: '1px solid var(--line-1)', borderRadius: 6, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-h)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>
                          Turn {o.after_turn} · {o.supervisor_name}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontFamily: 'var(--font-ui)',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 9px',
                            borderRadius: 'var(--radius-pill)',
                            background: chip.bg,
                            color: chip.color,
                          }}
                        >
                          {label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--surface-sunken)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${conf * 100}%`, borderRadius: 2, background: barFillColor(conf) }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-num)', fontFeatureSettings: '"tnum"', fontSize: 11, color: 'var(--text-3)' }}>
                          {(conf * 100).toFixed(0)}%
                        </span>
                      </div>
                      {parsed.rationale && (
                        <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{parsed.rationale}</div>
                      )}
                    </div>
                  );
                })
            }
          </div>

          <SideHeader style={{ marginTop: 16 }}>Analyst extractions</SideHeader>
          <div style={{ background: 'var(--surface-panel)', border: '1px solid var(--line-1)', borderRadius: 6, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-4)',
                fontWeight: 700,
                padding: '8px 12px',
                borderBottom: '1px solid var(--line-1)',
                background: 'var(--surface-sunken)',
              }}
            >
              Final outcome JSON
            </div>
            <pre
              style={{
                margin: 0,
                padding: '10px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                lineHeight: 1.55,
                color: 'var(--text-1)',
                background: 'var(--surface-panel)',
                whiteSpace: 'pre',
                overflowX: 'auto',
              }}
            >
              {isDemo
                ? MOCK_OUTCOME_JSON
                : extractorOutput
                ? JSON.stringify(extractorOutput.parsed, null, 2)
                : '// No extraction data'}
            </pre>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button className="r-btn r-btn-secondary r-btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="copy" size={12} /> Copy
            </button>
            <button className="r-btn r-btn-ghost r-btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
              View raw
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
