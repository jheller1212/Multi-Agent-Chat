export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'linear-gradient(135deg, var(--accent-2) 0 50%, var(--accent-1) 50% 100%)',
          display: 'grid', placeItems: 'center',
          position: 'relative', flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute', inset: 4, borderRadius: 4,
            background: 'var(--surface-panel)',
          }}
        />
        <span
          style={{
            position: 'relative', zIndex: 1,
            fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 14,
            letterSpacing: '0.02em',
            background: 'linear-gradient(135deg, var(--accent-2) 0 50%, var(--accent-1) 50% 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}
        >
          M
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 15,
            letterSpacing: '-0.01em', color: 'var(--text-1)',
          }}
        >
          Multi‑Agent‑Chat
        </span>
        <span
          style={{
            fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 10,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--text-3)',
          }}
        >
          RESEARCH
        </span>
      </div>
    </div>
  );
}
