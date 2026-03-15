import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#E07A5F', dark: '#C96B52', light: '#F0A78D' },
        accent: '#3D405B',
        surface: '#FAFAF8',
      },
    },
  },
  plugins: [],
};
export default config;
