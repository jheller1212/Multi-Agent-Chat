/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
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
        'lab-card': '16px',
        'lab-btn': '6px',
      },
      boxShadow: {
        'lab-soft': '0 4px 20px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
};
