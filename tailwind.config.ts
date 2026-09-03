import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
          warning: 'var(--border-warning)',
          success: 'var(--border-success)',
          danger: 'var(--border-danger)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          accent: 'var(--text-accent)',
          warning: 'var(--text-warning)',
          success: 'var(--text-success)',
          danger: 'var(--text-danger)',
        },
        fill: {
          accent: 'var(--fill-accent)',
          success: 'var(--fill-success)',
          warning: 'var(--fill-warning)',
          danger: 'var(--fill-danger)',
        },
        bg: {
          accent: 'var(--bg-accent)',
          success: 'var(--bg-success)',
          warning: 'var(--bg-warning)',
          danger: 'var(--bg-danger)',
        },
        on: {
          accent: 'var(--on-accent)',
          success: 'var(--on-success)',
          warning: 'var(--on-warning)',
          danger: 'var(--on-danger)',
        },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        card: 'var(--radius-card)',
        badge: 'var(--radius-badge)',
      },
    },
  },
  plugins: [],
};

export default config;
