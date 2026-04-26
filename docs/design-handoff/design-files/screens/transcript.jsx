/* global React, Icon */
// Transcript Viewer — the microscope.
// 3-column: agents | conversation | supervisor decisions

const META = {
  cell: 'A4',
  dyad: 'd_0247',
  factors: { buyer_capability: 'strong', seller_provider: 'Mistral' },
  models: { buyer: 'Anthropic · claude-sonnet-4.5', seller: 'Mistral · mistral-large', judge: 'OpenAI · gpt-4o-mini', analyst: 'Anthropic · claude-haiku-4.5' },
  seed: 4719,
  rounds: 7,
  outcome: 'deal',
  finalPrice: '€82.50',
  duration: '38s',
  tokens: '12,408'
};

const TURNS = [
{ round: 1, agent: 'buyer', text: "Good afternoon — I'd like to revisit our supply contract. Given current market conditions and our volume of 50,000 units, we're targeting €78 per unit on a 12-month term.", offer: { price: 78, vol: 50000 } },
{ round: 1, agent: 'seller', text: "Thanks for opening with a number. €78 is well below where we can deliver at scale. Our floor for that volume is €92 — but I have flexibility on payment terms and I can hold a lock for 18 months.", offer: { price: 92, vol: 50000, term: 18 } },
{ round: 2, agent: 'buyer', text: "I appreciate the offer to lock the price longer, but 18 months locks us into a unit cost we can't justify. We can move to €82 on a 12-month — that gets us within striking distance of our budget.", offer: { price: 82, vol: 50000 } },
{ round: 2, agent: 'seller', text: "€82 is closer. To meet you there I'd need either volume guarantees of 60k or net-30 terms cut to net-15. Which works better for your team?", offer: { price: 82, vol: 60000 } },
{ round: 3, agent: 'buyer', text: "We can't move to 60k — that's a real capacity question on our end. Net-15 we can do, given the unit price comes in at €82.", offer: { price: 82, vol: 50000, term: 12 } },
{ round: 3, agent: 'seller', text: "Then €82.50 with net-15, 12-month — that's the lowest I can take this. If we're aligned, I'll send the term sheet today.", offer: { price: 82.5, vol: 50000, term: 12 } },
{ round: 4, agent: 'buyer', text: "€82.50 net-15 12-month works. Send the term sheet — we'll counter-sign tomorrow. [ACCEPT]", offer: { price: 82.5, vol: 50000 } }];


const JUDGE = [
{ round: 1, label: 'cooperative', conf: 0.78, rat: 'Both sides open with concrete numbers and frame the gap honestly. No posturing.' },
{ round: 2, label: 'competitive', conf: 0.62, rat: 'Seller introduces conditional asks (volume, net-15) tied to price concessions — characteristic distributive move.' },
{ round: 3, label: 'cooperative', conf: 0.84, rat: 'Buyer accepts a non-price concession (net-15) to bridge price. Mutual movement on different issues.' },
{ round: 4, label: 'cooperative', conf: 0.91, rat: 'Closure with [ACCEPT]; no walkaway, no late posturing. Terminal cooperative.' }];


const TurnBubble = ({ t, prov }) => {
  const isBuyer = t.agent === 'buyer';
  return (
    <div className={`turn ${isBuyer ? 'turn-l' : 'turn-r'}`}>
      <div className={`turn-avatar ${isBuyer ? 'ac-blue' : 'ac-orange'}`}>{isBuyer ? 'B' : 'S'}</div>
      <div className="turn-bubble">
        <div className="turn-meta">
          <span className="turn-name">{isBuyer ? 'Buyer' : 'Seller'}</span>
          <span className="turn-prov mono">{isBuyer ? 'claude-sonnet-4.5' : 'mistral-large'}</span>
          <span className="turn-round">round {t.round}</span>
        </div>
        <div className="turn-text">{t.text.replace(/\[ACCEPT\]/g, '').trim()}{t.text.includes('[ACCEPT]') && <span className="end-tok">[ACCEPT]</span>}</div>
        {t.offer &&
        <div className="turn-offer">
            <span className="off-k">offer extracted</span>
            {t.offer.price && <span className="off-v">€{t.offer.price}</span>}
            {t.offer.vol && <span className="off-v">{t.offer.vol.toLocaleString()}u</span>}
            {t.offer.term && <span className="off-v">{t.offer.term}mo</span>}
          </div>
        }
      </div>
    </div>);

};

const TranscriptViewer = () =>
<div className="tv-page">
    <div className="page-head tv-head">
      <div className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="sb-crumb">
            <a href="#">Run #14</a>
            <Icon name="chevron" size={12} />
            <a href="#">Cell {META.cell}</a>
            <Icon name="chevron" size={12} />
            <span className="mono">{META.dyad}</span>
          </div>
          <h1 className="page-title" style={{ marginTop: 6 }}>
            Dyad <span className="mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 18 }}>{META.dyad}</span>
            <span className="chip chip-green" style={{ marginLeft: 12, verticalAlign: 'middle' }}>
              <Icon name="check" size={11} stroke={2.5} /> Deal · {META.finalPrice}
            </span>
          </h1>
        </div>
        <div className="row">
          <button className="btn btn-ghost btn-sm"><Icon name="chevron" size={13} stroke={2} /> Prev dyad</button>
          <button className="btn btn-ghost btn-sm">Next dyad <Icon name="arrowRight" size={13} /></button>
          <button className="btn btn-secondary btn-sm"><Icon name="download" size={13} /> Export JSON</button>
        </div>
      </div>
      <div className="meta-strip">
        <div className="ms-cell"><span className="ms-k">Cell</span><span className="ms-v mono">{META.cell}</span></div>
        <div className="ms-cell"><span className="ms-k">buyer_capability</span><span className="ms-v">{META.factors.buyer_capability}</span></div>
        <div className="ms-cell"><span className="ms-k">seller_provider</span><span className="ms-v">{META.factors.seller_provider}</span></div>
        <div className="ms-cell"><span className="ms-k">Seed</span><span className="ms-v mono">{META.seed}</span></div>
        <div className="ms-cell"><span className="ms-k">Rounds</span><span className="ms-v num">{META.rounds}/12</span></div>
        <div className="ms-cell"><span className="ms-k">Tokens</span><span className="ms-v num">{META.tokens}</span></div>
        <div className="ms-cell"><span className="ms-k">Duration</span><span className="ms-v">{META.duration}</span></div>
      </div>
    </div>

    <div className="tv-body">
      <div className="tv-left">
        <div className="tv-side-h">Agents</div>
        {[
      { name: 'Buyer', role: 'Domain', avatar: 'B', col: 'ac-blue', model: 'claude-sonnet-4.5', prov: 'Anthropic', temp: 0.7 },
      { name: 'Seller', role: 'Domain', avatar: 'S', col: 'ac-orange', model: 'mistral-large', prov: 'Mistral', temp: 0.7 },
      { name: 'Judge', role: 'Supervisor', avatar: 'J', col: 'ac-grey', model: 'gpt-4o-mini', prov: 'OpenAI', temp: 0.0 },
      { name: 'Analyst', role: 'Supervisor', avatar: 'A', col: 'ac-grey', model: 'claude-haiku-4.5', prov: 'Anthropic', temp: 0.0 }].
      map((a) =>
      <div key={a.name} className="tv-agent">
            <div className={`ac-avatar ${a.col}`} style={{ width: 26, height: 26, fontSize: 11, fontWeight: 700 }}>{a.avatar}</div>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="tv-a-name">{a.name} <span className="tv-a-role">· {a.role}</span></div>
              <div className="tv-a-model mono">{a.prov} · {a.model}</div>
              <div className="tv-a-meta">temp {a.temp.toFixed(2)}</div>
            </div>
          </div>
      )}

        <div className="tv-side-h" style={{ marginTop: 18 }}>Slot bindings</div>
        <div className="tv-slots">
          {[
        ['BUYER_TARGET_PRICE', '78'],
        ['BUYER_WALKAWAY', '92'],
        ['SELLER_FLOOR_PRICE', '80'],
        ['VOLUME_TARGET', '50,000'],
        ['BUYER_CAPABILITY', 'strong']].
        map(([k, v]) =>
        <div key={k} className="tv-slot-row">
              <span className="slot inline-slot mono" style={{ fontSize: 10.5 }}>{k}</span>
              <span className="mono tv-slot-v">{v}</span>
            </div>
        )}
        </div>

        <div className="tv-side-h" style={{ marginTop: 18 }}>Anomalies</div>
        <div className="tv-clean"><Icon name="check" size={12} stroke={2.5} /> No anomalies flagged</div>
      </div>

      <div className="tv-mid">
        <div className="tv-mid-head">
          <h3 className="rsc-h">Transcript</h3>
          <div className="row">
            <button className="chip chip-blue" style={{ cursor: 'pointer' }}>Show offers</button>
            <button className="chip chip-grey" style={{ cursor: 'pointer' }}>Tokens</button>
            <button className="chip chip-grey" style={{ cursor: 'pointer' }}>Hide system</button>
          </div>
        </div>
        <div className="tv-stream" style={{ width: "800px" }}>
          <div className="tv-system">
            <Icon name="settings" size={12} /> System turn — slots bound · seed {META.seed} · turn order: <strong>buyer → seller</strong>
          </div>
          {TURNS.map((t, i) =>
        <React.Fragment key={i}>
              {i > 0 && t.round !== TURNS[i - 1].round &&
          <div className="round-divider"><span className="rd-line" /><span className="rd-label">round {t.round}</span><span className="rd-line" /></div>
          }
              <TurnBubble t={t} />
            </React.Fragment>
        )}
          <div className="tv-system tv-end">
            <Icon name="check" size={12} stroke={2.5} /> [ACCEPT] token detected · run terminated · final price <strong>€82.50</strong> · 7 rounds · 38s
          </div>
        </div>
      </div>

      <div className="tv-right">
        <div className="tv-side-h">Supervisor decisions</div>
        <div className="judge-list">
          {JUDGE.map((j) =>
        <div key={j.round} className="judge-card">
              <div className="judge-head">
                <span className="judge-round">Round {j.round}</span>
                <span className={`chip ${j.label === 'cooperative' ? 'chip-green' : j.label === 'competitive' ? 'chip-orange' : 'chip-grey'}`}>{j.label}</span>
              </div>
              <div className="judge-conf">
                <div className="bar"><div className={`fill ${j.conf > 0.8 ? 'ok' : j.conf > 0.6 ? '' : 'warn'}`} style={{ width: `${j.conf * 100}%` }} /></div>
                <span className="num" style={{ fontSize: 11, color: 'var(--text-3)' }}>{(j.conf * 100).toFixed(0)}%</span>
              </div>
              <div className="judge-rat">{j.rat}</div>
            </div>
        )}
        </div>

        <div className="tv-side-h" style={{ marginTop: 16 }}>Analyst extractions</div>
        <div className="analyst-card">
          <div className="ana-h">Final outcome JSON</div>
          <pre className="ana-json">{`{
  "outcome": "deal",
  "final_price": 82.50,
  "volume": 50000,
  "term_months": 12,
  "payment": "net-15",
  "rounds_used": 7,
  "buyer_surplus": 9.50,
  "seller_surplus": 2.50,
  "joint_surplus": 12.00
}`}</pre>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn btn-secondary btn-sm grow" style={{ justifyContent: 'center' }}><Icon name="copy" size={12} /> Copy</button>
          <button className="btn btn-ghost btn-sm grow" style={{ justifyContent: 'center' }}>View raw</button>
        </div>
      </div>
    </div>
  </div>;


Object.assign(window, { TranscriptViewer });