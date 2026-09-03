import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        frido: {
          bg: '#F8FAFC', // slate-50
          cream: '#F8FAFC', // alias
          white: '#FFFFFF', // surfaces/cards
          line: '#E2E8F0', // slate-200
          ink: '#0F172A', // slate-900
          muted: '#475569', // slate-600
          primary: '#2563EB', // blue-600
          'primary-hover': '#1D4ED8', // blue-700
          ring: '#3B82F6', // blue-500
          // Status token aliases
          open: '#6B7280', // gray-500
          inReview: '#F59E0B', // amber-500
          approved: '#2563EB', // blue-600
          completed: '#16A34A', // green-600
          rejected: '#DC2626', // red-600
        },
      },
    },
  },
  plugins: [],
};

export default config;
