/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Design system v1 (docs/design-system.md)
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI Variable"',
          '"Segoe UI"', 'system-ui', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
        mono: [
          'ui-monospace', '"SF Mono"', 'SFMono-Regular', 'Menlo',
          'Consolas', '"Liberation Mono"', 'monospace',
        ],
        // Legacy (deprecated — migrate to sans)
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Design system v1 tokens (CSS vars in src/index.css)
        bg: {
          base: 'var(--bg-base)',
          elevated: 'var(--bg-elevated)',
          grouped: 'var(--bg-grouped)',
          sunken: 'var(--bg-sunken)',
        },
        label: {
          1: 'var(--label-primary)',
          2: 'var(--label-secondary)',
          3: 'var(--label-tertiary)',
          4: 'var(--label-quaternary)',
        },
        separator: {
          DEFAULT: 'var(--separator)',
          opaque: 'var(--separator-opaque)',
        },
        fill: {
          1: 'var(--fill-primary)',
          2: 'var(--fill-secondary)',
          3: 'var(--fill-tertiary)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          pressed: 'var(--accent-pressed)',
          soft: 'var(--accent-soft)',
          'soft-2': 'var(--accent-soft-2)',
          fill: 'var(--accent-fill)',
          'fill-hover': 'var(--accent-fill-hover)',
          on: 'var(--on-accent)',
        },
        success: { DEFAULT: 'var(--success)', soft: 'var(--success-soft)' },
        warning: { DEFAULT: 'var(--warning)', soft: 'var(--warning-soft)' },
        destructive: { DEFAULT: 'var(--destructive)', soft: 'var(--destructive-soft)' },
        agent: {
          1: 'var(--agent-1)', 2: 'var(--agent-2)', 3: 'var(--agent-3)',
          4: 'var(--agent-4)', 5: 'var(--agent-5)',
        },
        // Legacy (deprecated)
        lab: {
          bg: '#F9F9FB',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          primary: '#3B82F6',
          accent: '#10B981',
          heading: '#0F172A',
          body: '#475569',
        },
      },
      borderRadius: {
        xs: '5px',
        sm: '7px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        // Legacy (deprecated)
        'lab-card': '16px',
        'lab-btn': '6px',
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        3: 'var(--shadow-3)',
        4: 'var(--shadow-4)',
        // Legacy (deprecated)
        'lab-soft': '0 4px 20px rgba(0,0,0,0.05)',
      },
      fontSize: {
        display: ['34px', { lineHeight: '41px', letterSpacing: '-0.022em', fontWeight: '700' }],
        'title-1': ['28px', { lineHeight: '34px', letterSpacing: '-0.021em', fontWeight: '700' }],
        'title-2': ['22px', { lineHeight: '28px', letterSpacing: '-0.018em', fontWeight: '700' }],
        'title-3': ['17px', { lineHeight: '22px', letterSpacing: '-0.012em', fontWeight: '600' }],
        headline: ['15px', { lineHeight: '20px', letterSpacing: '-0.009em', fontWeight: '600' }],
        body: ['15px', { lineHeight: '22px', letterSpacing: '-0.009em' }],
        callout: ['13px', { lineHeight: '18px', letterSpacing: '-0.003em' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'caption-2': ['11px', { lineHeight: '13px', letterSpacing: '0.005em', fontWeight: '500' }],
        'mono-body': ['13px', { lineHeight: '20px' }],
        'mono-data': ['13px', { lineHeight: '18px', fontWeight: '500' }],
      },
      transitionDuration: { instant: '80ms', fast: '160ms', med: '240ms' },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'in-out': 'cubic-bezier(0.42, 0, 0.58, 1)',
      },
    },
  },
  plugins: [],
};
