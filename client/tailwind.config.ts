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
        background: 'var(--background)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        border: 'var(--border)',
        error: 'var(--error)',
        green: 'var(--green)',
        yellow: 'var(--yellow)',
        orange: 'var(--orange)',
        red: 'var(--password-weak)',
      },
    },
  },
  plugins: [],
};

export default config;
