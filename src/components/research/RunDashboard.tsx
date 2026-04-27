import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Icon } from './Icon';
import { exportRunCSV, downloadCSV } from '../../lib/outcomes/csv-export';

// --- Types ---

interface CellData {
  id: string;
  factors: string[];
  total: number;
  done: number;
  failed: number;
  anomaly: number;
  status: 'done' | 'running' | 'queued';
}

interface LiveEvent {
  t: string;
  cell: string;
  dyad: string;
  kind: 'completed' | 'started' | 'anomaly' | 'failed';
  msg: string;
  tone: 'ok' | 'info' | 'warn' | 'err';
}

interface AnomalyData {
  tag: string;
  count: number;
  ex: string;
}

// --- Mock data ---

const MOCK_CELLS: CellData[] = [
  { id: 'A1', factors: ['buyer:strong', 'seller:OpenAI'], total: 60, done: 60, failed: 1, anomaly: 2, status: 'done' },
  { id: 'A2', factors: ['buyer:strong', 'seller:Anthropic'], total: 60, done: 60, failed: 0, anomaly: 1, status: 'done' },
  { id: 'A3', factors: ['buyer:strong', 'seller:Google'], total: 60, done: 58, failed: 2, anomaly: 4, status: 'done' },
  { id: 'A4', factors: ['buyer:strong', 'seller:Mistral'], total: 60, done: 47, failed: 1, anomaly: 3, status: 'running' },
  { id: 'B1', factors: ['buyer:weak', 'seller:OpenAI'], total: 60, done: 32, failed: 0, anomaly: 1, status: 'running' },
  { id: 'B2', factors: ['buyer:weak', 'seller:Anthropic'], total: 60, done: 18, failed: 1, anomaly: 0, status: 'running' },
  { id: 'B3', factors: ['buyer:weak', 'seller:Google'], total: 60, done: 4, failed: 0, anomaly: 0, status: 'running' },
  { id: 'B4', factors: ['buyer:weak', 'seller:Mistral'], total: 60, done: 0, failed: 0, anomaly: 0, status: 'queued' },
];

const MOCK_LIVE: LiveEvent[] = [
  { t: '14:32:08', cell: 'A4', dyad: 'd_0247', kind: 'completed', msg: 'deal \u00b7 \u20ac82.50 \u00b7 7 rounds', tone: 'ok' },
  { t: '14:32:04', cell: 'B1', dyad: 'd_0312', kind: 'started', msg: 'turn 1/12', tone: 'info' },
  { t: '14:32:01', cell: 'A4', dyad: 'd_0246', kind: 'anomaly', msg: 'Seller emitted JSON in transcript', tone: 'warn' },
  { t: '14:31:58', cell: 'B2', dyad: 'd_0188', kind: 'completed', msg: 'walkaway \u00b7 12 rounds (cap)', tone: 'ok' },
  { t: '14:31:53', cell: 'A4', dyad: 'd_0245', kind: 'completed', msg: 'deal \u00b7 \u20ac78.00 \u00b7 5 rounds', tone: 'ok' },
  { t: '14:31:49', cell: 'B1', dyad: 'd_0311', kind: 'completed', msg: 'deal \u00b7 \u20ac88.50 \u00b7 9 rounds', tone: 'ok' },
  { t: '14:31:42', cell: 'B3', dyad: 'd_0017', kind: 'failed', msg: 'Provider 429 \u2014 retried (3/3)', tone: 'err' },
  { t: '14:31:38', cell: 'A4', dyad: 'd_0244', kind: 'completed', msg: 'deal \u00b7 \u20ac81.00 \u00b7 8 rounds', tone: 'ok' },
];

const MOCK_ANOMALIES: AnomalyData[] = [
  { tag: 'json-leak', count: 3, ex: 'Seller emitted raw JSON in transcript' },
  { tag: 'role-confusion', count: 2, ex: 'Buyer addressed itself as "the seller"' },
  { tag: 'walkaway-mismatch', count: 1, ex: '[ACCEPT] token but no terminal price' },
  { tag: 'analyst-fail', count: 1, ex: 'Analyst returned non-JSON output' },
];

// --- Supabase row types ---

interface ExperimentRunRow {
  id: string;
  status: string;
  config_snapshot: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  progress: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    pending: number;
  } | null;
}

interface DyadRow {
  id: string;
  cell_label: string;
  factors: Record<string, string>;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  failure_reason: string | null;
  termination_reason: string | null;
}

// --- Sub-components ---

interface StatTileProps {
  label: string;
  value: string | number;
  sub: string;
  tone?: 'ok' | 'info' | 'warn' | 'neutral';
  ic?: string;
}

function StatTile({ label, value, sub, tone = 'neutral', ic }: StatTileProps) {
  const toneClass = `tone-${tone}`;
  return (
    <div className={`stat-tile ${toneClass}`}>
      <div className="st-label">{label}</div>
      <div className="st-row">
        <div className="st-value num">{value}</div>
        {ic && <Icon name={ic} size={16} />}
      </div>
      <div className="st-sub">{sub}</div>
    </div>
  );
}

interface CellRowProps {
  c: CellData;
  onInspect?: () => void;
}

function CellRow({ c, onInspect }: CellRowProps) {
  const pct = (c.done / c.total) * 100;
  const fillClass = c.status === 'done' ? 'ok' : c.status === 'queued' ? 'muted' : '';

  return (
    <div className="cell-row">
      <div className="cr-id">
        <span className={`cr-dot cr-${c.status}`} />
        <span className="mono cr-cellid">{c.id}</span>
      </div>
      <div className="cr-factors">
        {c.factors.map((f) => {
          const [k, v] = f.split(':');
          return (
            <span key={f} className="r-chip r-chip-grey" style={{ padding: '2px 7px', gap: 4 }}>
              <span className="cr-fk">{k}</span>
              <span className="cr-fv">{v}</span>
            </span>
          );
        })}
      </div>
      <div className="cr-bar">
        <div className="r-bar">
          <div
            className={`r-bar-fill ${fillClass === 'ok' ? 'r-bar-fill-ok' : fillClass === 'muted' ? '' : 'r-bar-fill-run'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="cr-prog num">
        {c.done}
        <span className="cr-of">/{c.total}</span>
      </div>
      <div className="cr-fail num">
        {c.failed > 0 ? c.failed : <span style={{ color: 'var(--text-4)' }}>&mdash;</span>}
      </div>
      <div className="cr-anom num">
        {c.anomaly > 0 ? (
          <span className="anom-pill">{c.anomaly}</span>
        ) : (
          <span style={{ color: 'var(--text-4)' }}>&mdash;</span>
        )}
      </div>
      <div className="cr-status">
        {c.status === 'done' && (
          <span className="r-chip r-chip-green">
            <Icon name="check" size={11} /> Done
          </span>
        )}
        {c.status === 'running' && (
          <span className="r-chip r-chip-blue">
            <span className="pulse-dot" /> Running
          </span>
        )}
        {c.status === 'queued' && <span className="r-chip r-chip-grey">Queued</span>}
      </div>
      <div>
        <button className="r-btn r-btn-ghost r-btn-sm" onClick={onInspect}>Inspect</button>
      </div>
    </div>
  );
}

function LiveEventRow({ e }: { e: LiveEvent }) {
  return (
    <div className="live-row">
      <span className="live-t mono">{e.t}</span>
      <span className={`live-tag live-${e.tone}`}>
        {e.kind === 'completed' && <Icon name="check" size={10} stroke={2.5} />}
        {e.kind === 'started' && <Icon name="play" size={10} />}
        {e.kind === 'failed' && <Icon name="x" size={10} stroke={2.5} />}
        {e.kind === 'anomaly' && <Icon name="bell" size={10} />}
        {e.kind}
      </span>
      <span className="mono live-id">
        {e.cell}&middot;{e.dyad}
      </span>
      <span className="live-msg">{e.msg}</span>
    </div>
  );
}

// --- Helpers ---

function dyadsToCells(dyads: DyadRow[]): CellData[] {
  const cellMap = new Map<string, { factors: Record<string, string>; dyads: DyadRow[] }>();

  for (const d of dyads) {
    const existing = cellMap.get(d.cell_label);
    if (existing) {
      existing.dyads.push(d);
    } else {
      cellMap.set(d.cell_label, { factors: d.factors, dyads: [d] });
    }
  }

  const cells: CellData[] = [];
  for (const [label, { factors, dyads: cellDyads }] of cellMap) {
    const done = cellDyads.filter((d) => d.status === 'completed').length;
    const failed = cellDyads.filter((d) => d.status === 'failed').length;
    const running = cellDyads.filter((d) => d.status === 'running').length;
    const total = cellDyads.length;

    let status: CellData['status'] = 'queued';
    if (done === total) status = 'done';
    else if (running > 0) status = 'running';

    const factorChips = Object.entries(factors).map(([k, v]) => `${k}:${v}`);

    cells.push({
      id: label,
      factors: factorChips,
      total,
      done,
      failed,
      anomaly: 0, // anomaly data requires supervisor_outputs join — not fetched here
      status,
    });
  }

  return cells;
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// --- Main component ---

export interface RunDashboardProps {
  runId?: string;
  onInspectDyad?: (dyadId: string) => void;
}

const POLL_INTERVAL_MS = 5000;

export function RunDashboard({ runId, onInspectDyad }: RunDashboardProps) {
  const [run, setRun] = useState<ExperimentRunRow | null>(null);
  const [dyads, setDyads] = useState<DyadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [csvExporting, setCsvExporting] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    try {
      const [runResult, dyadsResult] = await Promise.all([
        supabase.from('experiment_runs').select('id, status, config_snapshot, started_at, completed_at, progress').eq('id', runId).single(),
        supabase.from('dyads').select('id, cell_label, factors, status, started_at, completed_at, failure_reason, termination_reason').eq('run_id', runId),
      ]);
      if (runResult.data) setRun(runResult.data as ExperimentRunRow);
      if (dyadsResult.data) setDyads(dyadsResult.data as DyadRow[]);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  // Initial fetch
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Poll every 5 seconds while the run is active
  useEffect(() => {
    if (!runId) return;

    const scheduleNext = () => {
      pollTimerRef.current = setTimeout(async () => {
        await fetchData();
        // Only continue polling if the run is still active
        setRun(prev => {
          if (prev && (prev.status === 'running' || prev.status === 'paused')) {
            scheduleNext();
          }
          return prev;
        });
      }, POLL_INTERVAL_MS);
    };

    scheduleNext();

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [runId, fetchData]);

  const handlePause = async () => {
    if (!runId) return;
    setActionError(null);
    const { error } = await supabase.from('experiment_runs').update({ status: 'paused' }).eq('id', runId);
    if (error) { setActionError(error.message); return; }
    setRun((prev) => prev ? { ...prev, status: 'paused' } : prev);
  };

  const handleAbort = async () => {
    if (!runId) return;
    setActionError(null);
    const { error } = await supabase.from('experiment_runs').update({ status: 'failed' }).eq('id', runId);
    if (error) { setActionError(error.message); return; }
    setRun((prev) => prev ? { ...prev, status: 'failed' } : prev);
  };

  const handleSnapshotCSV = async () => {
    if (!runId) return;
    setCsvExporting(true);
    try {
      const csv = await exportRunCSV(runId);
      if (csv) {
        downloadCSV(csv, `run-${runId.slice(0, 8)}-snapshot.csv`);
      } else {
        setActionError('No outcome data available yet for this run.');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'CSV export failed');
    } finally {
      setCsvExporting(false);
    }
  };

  // Find first dyad id for each cell (for Inspect button when no specific dyad is selected)
  const cellFirstDyad = (cellLabel: string): string | undefined => {
    return dyads.find((d) => d.cell_label === cellLabel)?.id;
  };

  // --- Derived data ---
  const isDemo = !runId;

  const cells: CellData[] = isDemo ? MOCK_CELLS : dyadsToCells(dyads);
  const liveEvents: LiveEvent[] = isDemo ? MOCK_LIVE : [];
  const anomalies: AnomalyData[] = isDemo ? MOCK_ANOMALIES : [];

  const totalDone = cells.reduce((a, c) => a + c.done, 0);
  const totalFail = cells.reduce((a, c) => a + c.failed, 0);
  const totalAnom = cells.reduce((a, c) => a + c.anomaly, 0);
  const totalAll = cells.reduce((a, c) => a + c.total, 0);
  const overallPct = totalAll > 0 ? (totalDone / totalAll) * 100 : 0;

  const inFlight = isDemo ? 28 : dyads.filter((d) => d.status === 'running').length;
  const queued = isDemo ? totalAll - totalDone - inFlight : dyads.filter((d) => d.status === 'pending').length;
  const queuedCells = cells.filter((c) => c.status === 'queued').length;
  const anomPct = totalDone > 0 ? ((100 * totalAnom) / totalDone).toFixed(1) : '0.0';

  const runStatus = isDemo ? 'running' : (run?.status ?? 'unknown');
  const isRunning = runStatus === 'running';

  const configSnapshot = run?.config_snapshot as { name?: string } | null;
  const runName = configSnapshot?.name ?? (isDemo ? 'Buyer Capability \u00d7 Provider' : runId ?? 'Run');
  const startedAt = isDemo ? '14:08' : formatTime(run?.started_at ?? null);

  if (!isDemo && loading && !run) {
    return (
      <div className="run-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <span style={{ color: 'var(--text-3)', fontSize: 14 }}>Loading run data...</span>
      </div>
    );
  }

  return (
    <div className="run-page">
      {/* Page head */}
      <div className="r-page-head run-head">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--text-3)',
                marginBottom: 6,
              }}
            >
              <a href="#" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>
                Experiments
              </a>
              <Icon name="chevron" size={12} />
              <a href="#" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>
                {runName}
              </a>
              <Icon name="chevron" size={12} />
              <span style={{ color: 'var(--text-1)' }}>{isDemo ? 'Run #14' : `Run ${runId?.slice(0, 8) ?? ''}`}</span>
            </div>
            <h1 className="r-page-title" style={{ marginTop: 6 }}>
              {isRunning && (
                <span
                  className="pulse-dot"
                  style={{ width: 8, height: 8, display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }}
                />
              )}{' '}
              {runName} &middot; {isDemo ? 'Run #14' : `Run ${runId?.slice(0, 8) ?? ''}`}
            </h1>
            <p className="r-page-sub">
              Started {startedAt}
              {isDemo && ' \u00b7 24 min elapsed \u00b7 est. 38 min remaining \u00b7 2\u00d74 design \u00b7 N=60 per cell \u00b7 seed 4719'}
              {!isDemo && ` \u00b7 ${cells.length} cells \u00b7 ${totalAll} total dyads`}
              {!isDemo && runStatus !== 'running' && ` \u00b7 status: ${runStatus}`}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="r-btn r-btn-secondary"
                onClick={isDemo ? undefined : handlePause}
                disabled={!isDemo && !isRunning}
              >
                <Icon name="pause" size={13} /> {runStatus === 'paused' ? 'Resume' : 'Pause'}
              </button>
              <button
                className="r-btn r-btn-secondary"
                onClick={isDemo ? undefined : handleAbort}
                disabled={!isDemo && (runStatus === 'aborted' || runStatus === 'completed')}
              >
                <Icon name="stop" size={13} /> Abort
              </button>
              <button
                className="r-btn r-btn-ghost"
                onClick={isDemo ? undefined : handleSnapshotCSV}
                disabled={!isDemo && csvExporting}
              >
                <Icon name="download" size={13} /> {csvExporting ? 'Exporting...' : 'Snapshot CSV'}
              </button>
            </div>
            {actionError && (
              <span style={{ fontSize: 11, color: 'var(--accent-1)' }}>{actionError}</span>
            )}
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="r-page-body">
        {/* Stat tiles */}
        <div className="run-stats">
          <StatTile
            label="Completed"
            value={totalDone}
            sub={`of ${totalAll} dyads \u00b7 ${overallPct.toFixed(1)}%`}
            tone="ok"
            ic="check"
          />
          <StatTile label="In flight" value={inFlight} sub={`across ${cells.filter((c) => c.status === 'running').length} cells`} tone="info" />
          <StatTile label="Queued" value={queued} sub={`${queuedCells} cells waiting`} tone="neutral" />
          <StatTile
            label="Failed"
            value={totalFail}
            sub="all retries exhausted"
            tone={totalFail > 0 ? 'warn' : 'neutral'}
          />
          <StatTile label="Anomalies" value={totalAnom} sub={`${anomPct}% of completed`} tone="warn" ic="bell" />
          <StatTile label="Token spend" value={isDemo ? '2.41M' : '—'} sub={isDemo ? '\u2248 \u20ac18.40 \u00b7 49% of budget' : 'not tracked'} tone="neutral" />
        </div>

        {/* Overall progress bar */}
        <div className="run-overall">
          <div className="run-overall-head">
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-h)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-1)',
              }}
            >
              Overall progress
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="num" style={{ fontFamily: 'var(--font-num)', fontSize: 13, fontWeight: 600 }}>
                {totalDone} / {totalAll}
              </span>
              {isDemo && (
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>&middot; est. complete 14:46</span>
              )}
            </div>
          </div>
          <div className="run-overall-bar">
            {cells.map((c) => (
              <div key={c.id} className="rob-segment" style={{ flex: c.total }}>
                <div
                  className={`rob-fill rob-${c.status}`}
                  style={{ width: `${(c.done / c.total) * 100}%` }}
                />
                <div className="rob-tick">{c.id}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 2-column body: cells table + side cards */}
        <div className="run-grid">
          {/* Cells table */}
          <div className="run-cells">
            <div className="run-cells-head">
              <div>
                <h2
                  style={{
                    margin: '0 0 2px',
                    fontFamily: 'var(--font-h)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--text-1)',
                  }}
                >
                  Cells
                </h2>
                <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                  Click Inspect to view dyad transcripts &middot; {cells.length} cells
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="r-btn r-btn-ghost r-btn-sm"
                  title="Coming soon"
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <Icon name="filter" size={12} /> Filter
                </button>
                <button
                  className="r-btn r-btn-ghost r-btn-sm"
                  title="Coming soon"
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <Icon name="grid" size={12} /> Matrix view
                </button>
              </div>
            </div>
            <div className="cell-table">
              <div className="cell-row cell-head">
                <div>Cell</div>
                <div>Factors</div>
                <div>Progress</div>
                <div>Done</div>
                <div>Fail</div>
                <div>Anom</div>
                <div>Status</div>
                <div></div>
              </div>
              {cells.map((c) => (
                <CellRow
                  key={c.id}
                  c={c}
                  onInspect={
                    onInspectDyad
                      ? () => {
                          const dyadId = isDemo ? 'd_0247' : cellFirstDyad(c.id);
                          if (dyadId) onInspectDyad(dyadId);
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </div>

          {/* Right side cards */}
          <div className="run-side">
            {/* Live event log */}
            <div className="run-side-card">
              <div className="rsc-head">
                <div>
                  <h3 className="rsc-h">Live event log</h3>
                  <span className="rsc-sub">{isDemo ? 'Last 30 seconds' : 'Demo — connect a live runner to stream events'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isRunning && <span className="pulse-dot" />}
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{isRunning ? 'Streaming' : 'Idle'}</span>
                </div>
              </div>
              <div className="live-list">
                {liveEvents.length > 0
                  ? liveEvents.map((e, i) => <LiveEventRow key={i} e={e} />)
                  : !isDemo && (
                    <div style={{ padding: '12px 0', fontSize: 12, color: 'var(--text-4)', textAlign: 'center' }}>
                      No events yet
                    </div>
                  )}
              </div>
              <div className="live-foot">
                <a href="#">View full log &rarr;</a>
              </div>
            </div>

            {/* Anomalies card */}
            <div className="run-side-card">
              <div className="rsc-head">
                <h3 className="rsc-h">Anomalies ({totalAnom})</h3>
                <a href="#" style={{ fontSize: 11 }}>
                  Triage all &rarr;
                </a>
              </div>
              <div className="anom-list">
                {anomalies.length > 0
                  ? anomalies.map((a) => (
                    <div key={a.tag} className="anom-row">
                      <div className="anom-row-head">
                        <span className="r-chip r-chip-orange mono">{a.tag}</span>
                        <span className="num" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                          {a.count}&times;
                        </span>
                      </div>
                      <div className="anom-row-ex">{a.ex}</div>
                    </div>
                  ))
                  : !isDemo && (
                    <div style={{ padding: '12px 0', fontSize: 12, color: 'var(--text-4)', textAlign: 'center' }}>
                      No anomalies detected
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
