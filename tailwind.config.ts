import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        sunken: v('sunken'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        molho: v('molho'),
        'molho-ink': v('molho-ink'),
        basil: v('basil'),
        gema: v('gema'),
        forno: '#D42A1C',
        massa: '#FFF3DC',
      },
      fontFamily: {
        sans: ['"Archivo Variable"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '20px', field: '12px' },
      boxShadow: {
        lift: '0 1px 0 rgb(var(--line)), 0 18px 40px -24px rgb(30 26 23 / 0.45)',
        pop: '0 30px 80px -30px rgb(30 26 23 / 0.6)',
      },
      maxWidth: { page: '1240px' },
    },
  },
  plugins: [],
};
export default config;
