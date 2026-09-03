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
          ink: '#1E293B', // deep slate text
          charcoal: '#334155', // secondary slate
          violet: '#7C3AED', // primary royal violet accent
          'violet-dark': '#6D28D9', // violet hover state
          'violet-light': '#EDE9FE', // soft lilac pill background
          porcelain: '#FAF9F6', // warm porcelain canvas
          cream: '#FAF9F6', // alias for background
          bg: '#FAF9F6', // alias
          white: '#FFFFFF', // pure card white
          line: '#E4E4E7', // clean zinc-200 borders
          amber: '#F59E0B', // warm amber indicator
          'amber-dark': '#D97706',
        },
      },
    },
  },
  plugins: [],
};

export default config;
