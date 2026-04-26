/* global React, Icon */
// Run Dashboard — calm, real-time progress monitor for a 480-dyad experiment.

const CELLS = [
  { id: 'A1', factors: ['buyer:strong', 'seller:OpenAI'], total: 60, done: 60, failed: 1, anomaly: 2, status: 'done' },
  { id: 'A2', factors: ['buyer:strong', 'seller:Anthropic'], total: 60, done: 60, failed: 0, anomaly: 1, status: 'done' },
  { id: 'A3', factors: ['buyer:strong', 'seller:Google'], total: 60, done: 58, failed: 2, anomaly: 4, status: 'done' },
  { id: 'A4', factors: ['buyer:strong', 'seller:Mistral'], total: 60, done: 47, failed: 1, anomaly: 3, status: 'running' },
  { id: 'B1', factors: ['buyer:weak', 'seller:OpenAI'], total: 60, done: 32, failed: 0, anomaly: 1, status: 'running' },
  { id: 'B2', factors: ['buyer:weak', 'seller:Anthropic'], total: 60, done: 18, failed: 1, anomaly: 0, status: 'running' },
  { id: 'B3', factors: ['buyer:weak', 'seller:Google'], total: 60, done: 4, failed: 0, anomaly: 0, status: 'running' },
  { id: 'B4', factors: ['buyer:weak', 'seller:Mistral'], total: 60, done: 0, failed: 0, anomaly: 0, status: 'queued' },
];

const totalDone = CELLS.reduce((a, c) => a + c.done, 0);
const totalFail = CELLS.reduce((a, c) => a + c.failed, 0);
const totalAnom = CELLS.reduce((a, c) => a + c.anomaly, 0);
const totalAll  = CELLS.reduce((a, c) => a + c.total, 0);

const LIVE = [
  { t: '14:32:08', cell: 'A4', dyad: 'd_0247', kind: 'completed', msg: 'deal · €82.50 · 7 rounds', tone: 'ok' },
  { t: '14:32:04', cell: 'B1', dyad: 'd_0312', kind: 'started', msg: 'turn 1/12', tone: 'info' },
  { t: '14:32:01', cell: 'A4', dyad: 'd_0246', kind: 'anomaly', msg: 'Seller emitted JSON in transcript', tone: 'warn' },
  { t: '14:31:58', cell: 'B2', dyad: 'd_0188', kind: 'completed', msg: 'walkaway · 12 rounds (cap)', tone: 'ok' },
  { t: '14:31:53', cell: 'A4', dyad: 'd_0245', kind: 'completed', msg: 'deal · €78.00 · 5 rounds', tone: 'ok' },
  { t: '14:31:49', cell: 'B1', dyad: 'd_0311', kind: 'completed', msg: 'deal · €88.50 · 9 rounds', tone: 'ok' },
  { t: '14:31:42', cell: 'B3', dyad: 'd_0017', kind: 'failed', msg: 'Provider 429 — retried (3/3)', tone: 'err' },
  { t: '14:31:38', cell: 'A4', dyad: 'd_0244', kind: 'completed', msg: 'deal · €81.00 · 8 rounds', tone: 'ok' },
];

const StatTile = ({ label, value, sub, tone, ic }) => (
  <div className={`stat-tile tone-${tone || 'neutral'}`}>
    <div className="st-label">{label}</div>
    <div className="st-row">
      <div className="st-value num">{value}</div>
      {ic && <Icon name={ic} size={16}/>}
    </div>
    <div className="st-sub">{sub}</div>
  </div>
);

const CellRow = ({ c }) => {
  const pct = (c.done / c.total) * 100;
  return (
    <div className="cell-row">
      <div className="cr-id">
        <span className={`cr-dot cr-${c.status}`}/>
        <span className="mono cr-cellid">{c.id}</span>
      </div>
      <div className="cr-factors">
        {c.factors.map(f => {
          const [k, v] = f.split(':');
          return <span key={f} className="chip chip-grey"><span className="cr-fk">{k}</span><span className="cr-fv">{v}</span></span>;
        })}
      </div>
      <div className="cr-bar">
        <div className="bar"><div className={`fill ${c.status === 'done' ? 'ok' : c.status === 'queued' ? 'muted' : ''}`} style={{ width: `${pct}%` }}/></div>
      </div>
      <div className="cr-prog num">{c.done}<span className="cr-of">/{c.total}</span></div>
      <div className="cr-fail num">{c.failed > 0 ? c.failed : <span style={{ color: 'var(--text-4)' }}>—</span>}</div>
      <div className="cr-anom num">{c.anomaly > 0 ? <span className="anom-pill">{c.anomaly}</span> : <span style={{ color: 'var(--text-4)' }}>—</span>}</div>
      <div className="cr-status">
        {c.status === 'done' && <span className="chip chip-green"><Icon name="check" size={11}/> Done</span>}
        {c.status === 'running' && <span className="chip chip-blue"><span className="pulse-dot"/> Running</span>}
        {c.status === 'queued' && <span className="chip chip-grey">Queued</span>}
      </div>
      <div><button className="btn btn-ghost btn-sm">Inspect</button></div>
    </div>
  );
};

const RunDashboard = () => {
  const overallPct = (totalDone / totalAll) * 100;
  return (
    <div className="run-page">
      <div className="page-head run-head">
        <div className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="sb-crumb">
              <a href="#">Experiments</a>
              <Icon name="chevron" size={12}/>
              <a href="#">Buyer Capability × Provider</a>
              <Icon name="chevron" size={12}/>
              <span>Run #14</span>
            </div>
            <h1 className="page-title" style={{ marginTop: 6 }}>
              <span className="pulse-dot lg"/> Buyer Capability × Provider · Run #14
            </h1>
            <p className="page-sub">
              Started 14:08 · 24 min elapsed · est. 38 min remaining · 2×4 design · N=60 per cell · seed 4719
            </p>
          </div>
          <div className="row">
            <button className="btn btn-secondary"><Icon name="pause" size={13}/> Pause</button>
            <button className="btn btn-secondary"><Icon name="stop" size={13}/> Abort</button>
            <button className="btn btn-ghost"><Icon name="download" size={13}/> Snapshot CSV</button>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="run-stats">
          <StatTile label="Completed" value={totalDone} sub={`of ${totalAll} dyads · ${overallPct.toFixed(1)}%`} tone="ok" ic="check"/>
          <StatTile label="In flight" value={28} sub="across 3 cells" tone="info"/>
          <StatTile label="Queued" value={totalAll - totalDone - 28} sub={`${CELLS.filter(c => c.status === 'queued').length} cells waiting`} tone="neutral"/>
          <StatTile label="Failed" value={totalFail} sub="all retries exhausted" tone={totalFail > 0 ? 'warn' : 'neutral'}/>
          <StatTile label="Anomalies" value={totalAnom} sub={`${(100*totalAnom/totalDone).toFixed(1)}% of completed`} tone="warn" ic="bell"/>
          <StatTile label="Token spend" value="2.41M" sub="≈ €18.40 · 49% of budget" tone="neutral"/>
        </div>

        <div className="run-overall">
          <div className="run-overall-head">
            <h2 className="lib-h2">Overall progress</h2>
            <div className="row">
              <span className="num" style={{ fontFamily: 'var(--font-num)', fontSize: 13, fontWeight: 600 }}>{totalDone} / {totalAll}</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>· est. complete 14:46</span>
            </div>
          </div>
          <div className="run-overall-bar">
            {CELLS.map(c => (
              <div key={c.id} className="rob-segment" style={{ flex: c.total }}>
                <div className={`rob-fill rob-${c.status}`} style={{ width: `${(c.done / c.total) * 100}%` }}/>
                <div className="rob-tick">{c.id}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="run-grid">
          <div className="run-cells">
            <div className="run-cells-head">
              <div>
                <h2 className="lib-h2">Cells</h2>
                <span className="lib-h2-sub">Click a cell to inspect dyads · 8 cells · 2×4 design</span>
              </div>
              <div className="row">
                <button className="btn btn-ghost btn-sm"><Icon name="filter" size={12}/> Filter</button>
                <button className="btn btn-ghost btn-sm"><Icon name="grid" size={12}/> Matrix view</button>
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
              {CELLS.map(c => <CellRow key={c.id} c={c}/>)}
            </div>
          </div>

          <div className="run-side">
            <div className="run-side-card">
              <div className="rsc-head">
                <div>
                  <h3 className="rsc-h">Live event log</h3>
                  <span className="rsc-sub">Last 30 seconds</span>
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <span className="pulse-dot"/>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Streaming</span>
                </div>
              </div>
              <div className="live-list">
                {LIVE.map((e, i) => (
                  <div key={i} className="live-row">
                    <span className="live-t mono">{e.t}</span>
                    <span className={`live-tag live-${e.tone}`}>
                      {e.kind === 'completed' && <Icon name="check" size={10} stroke={2.5}/>}
                      {e.kind === 'started' && <Icon name="play" size={10}/>}
                      {e.kind === 'failed' && <Icon name="x" size={10} stroke={2.5}/>}
                      {e.kind === 'anomaly' && <Icon name="bell" size={10}/>}
                      {e.kind}
                    </span>
                    <span className="mono live-id">{e.cell}·{e.dyad}</span>
                    <span className="live-msg">{e.msg}</span>
                  </div>
                ))}
              </div>
              <div className="live-foot">
                <a href="#">View full log →</a>
              </div>
            </div>

            <div className="run-side-card">
              <div className="rsc-head">
                <h3 className="rsc-h">Anomalies (7)</h3>
                <a href="#" style={{ fontSize: 11 }}>Triage all →</a>
              </div>
              <div className="anom-list">
                {[
                  { tag: 'json-leak', count: 3, ex: 'Seller emitted raw JSON in transcript' },
                  { tag: 'role-confusion', count: 2, ex: 'Buyer addressed itself as "the seller"' },
                  { tag: 'walkaway-mismatch', count: 1, ex: '[ACCEPT] token but no terminal price' },
                  { tag: 'analyst-fail', count: 1, ex: 'Analyst returned non-JSON output' },
                ].map(a => (
                  <div key={a.tag} className="anom-row">
                    <div className="anom-row-head">
                      <span className="chip chip-orange mono">{a.tag}</span>
                      <span className="num" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{a.count}×</span>
                    </div>
                    <div className="anom-row-ex">{a.ex}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { RunDashboard });
