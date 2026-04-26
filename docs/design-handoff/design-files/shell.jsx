/* global React */
// Shell — Sidebar + Topbar wrapper. Use as <AppShell page="library">{content}</AppShell>

const Icon = ({ name, size = 16, stroke = 1.6 }) => {
  // Lucide-style hand-drawn icons. Stroke uses currentColor.
  const paths = {
    library: <><rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="18" rx="1.5"/><line x1="6.5" y1="7" x2="6.5" y2="17"/><line x1="17.5" y1="7" x2="17.5" y2="17"/></>,
    flask: <><path d="M9 3h6"/><path d="M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.3h12.4a1.5 1.5 0 0 0 1.3-2.3L14 9V3"/><path d="M7.5 14h9"/></>,
    play: <><polygon points="6 3 20 12 6 21 6 3"/></>,
    chart: <><line x1="3" y1="21" x2="21" y2="21"/><rect x="5" y="13" width="3" height="6"/><rect x="10" y="9" width="3" height="10"/><rect x="15" y="5" width="3" height="14"/></>,
    chat: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    search: <><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></>,
    star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    bot: <><rect x="3" y="8" width="18" height="13" rx="2"/><circle cx="8.5" cy="14" r="1.2"/><circle cx="15.5" cy="14" r="1.2"/><line x1="12" y1="3" x2="12" y2="8"/><circle cx="12" cy="2.5" r="1"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    chevron: <><polyline points="9 18 15 12 9 6"/></>,
    chevronDown: <><polyline points="6 9 12 15 18 9"/></>,
    pause: <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
    stop: <><rect x="5" y="5" width="14" height="14" rx="1"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></>,
    bell: <><path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16z"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-1 .5-1.5 1-1.5 2.2"/><circle cx="12" cy="17" r=".7" fill="currentColor"/></>,
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    scale: <><line x1="12" y1="3" x2="12" y2="21"/><path d="M6 7l-3 7a3 3 0 0 0 6 0z"/><path d="M18 7l-3 7a3 3 0 0 0 6 0z"/><line x1="3" y1="7" x2="21" y2="7"/></>,
    handshake: <><path d="M11 17a2 2 0 0 0 2.83 0l4.24-4.24a2 2 0 0 0 0-2.83l-2.83-2.83-3.54 3.54-1.41-1.41 5-5 4.24 4.24a4 4 0 0 1 0 5.66L14.83 19a4 4 0 0 1-5.66 0z"/><path d="M3 7l4-4 5 5"/></>,
    sparkle: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    refresh: <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    x: <><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></>,
    layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    table: <><rect x="3" y="3" width="18" height="18" rx="1.5"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></>,
    sliders: <><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>,
    code: <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    spark: <><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
    moreH: <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
    sortAsc: <><line x1="11" y1="5" x2="21" y2="5"/><line x1="11" y1="9" x2="18" y2="9"/><line x1="11" y1="13" x2="15" y2="13"/><polyline points="3 17 6 20 9 17"/><line x1="6" y1="4" x2="6" y2="20"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className="ic">
      {paths[name]}
    </svg>
  );
};

const Topbar = ({ page, breadcrumb, theme, onTheme }) => (
  <div className="topbar">
    <div className="brand">
      <div className="brand-mark"><span>M</span></div>
      <div>
        <div className="brand-name">Multi‑Agent‑Chat<em>Research</em></div>
      </div>
    </div>
    <div className="topbar-mid">
      <div className="crumbs">
        {breadcrumb.map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === breadcrumb.length - 1 ? "here" : ""}>{b}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
    <div className="topbar-right">
      <button className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
        <Icon name="help" size={14}/> Docs
      </button>
      <button className="icon-btn" title="Notifications"><Icon name="bell"/></button>
      <button className="icon-btn" onClick={onTheme} title="Toggle theme">
        <Icon name={theme === 'dark' ? 'sun' : 'moon'}/>
      </button>
      <div className="user-chip">
        <div className="avatar">JS</div>
        jonasheller89
      </div>
    </div>
  </div>
);

const Sidebar = ({ page }) => {
  const item = (id, label, icon, badge) => (
    <div key={id} className={`nav-item ${page === id ? 'active' : ''}`}>
      <Icon name={icon}/> <span>{label}</span>
      {badge && <span className="badge">{badge}</span>}
    </div>
  );
  return (
    <div className="sidebar">
      <div className="nav-section-title">Workspace</div>
      {item('chat', 'Quick Chat', 'chat')}
      {item('history', 'History', 'clock')}

      <div className="nav-section-title">Research</div>
      {item('library', 'Library', 'library')}
      {item('scenario', 'Scenarios', 'book', '12')}
      {item('experiment', 'Experiments', 'flask', '4')}
      {item('runs', 'Runs', 'play', '2')}
      {item('results', 'Results', 'chart')}

      <div className="nav-section-title">Account</div>
      {item('settings', 'Settings', 'settings')}

      <div className="sidebar-foot">
        <div className="workspace">
          <div className="logo">DX</div>
          <div>
            <div className="name">DEXLab · SBE</div>
            <div className="meta">Maastricht U.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppShell = ({ page, breadcrumb, theme, onTheme, density, children }) => (
  <div className="appshell" data-density={density} data-theme={theme}>
    <Topbar page={page} breadcrumb={breadcrumb} theme={theme} onTheme={onTheme}/>
    <Sidebar page={page}/>
    <div className="main">{children}</div>
  </div>
);

Object.assign(window, { Icon, AppShell, Topbar, Sidebar });
