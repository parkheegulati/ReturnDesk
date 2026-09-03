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
          ink: '#131313', // primary text
          charcoal: '#222222', // secondary dark surfaces
          amber: '#FCD00F', // brand accent yellow
          yellow: '#FCD00F', // alias
          'amber-dark': '#E5BC00', // hover / pressed yellow
          cream: '#F7F7F7', // page background
          bg: '#F7F7F7', // alias
          white: '#FFFFFF', // clean white surfaces
          line: '#E5E5E5', // hairline borders
        },
      },
    },
  },
  plugins: [],
};

export default config;
