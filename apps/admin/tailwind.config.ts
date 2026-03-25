import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#7C3AED', dark: '#6D28D9', light: '#A78BFA' },
        accent: '#2D1B69',
        surface: '#FAF5FF',
        terracotta: '#E07A5F',
      },
    },
  },
  plugins: [],
};
export default config;
