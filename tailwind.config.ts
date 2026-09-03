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
          ink: '#1a1a1a',
          charcoal: '#2b2b2b',
          amber: '#f5a623',
          'amber-dark': '#d4890f',
          cream: '#faf9f7',
          line: '#e5e2dc',
        },
      },
    },
  },
  plugins: [],
};

export default config;
