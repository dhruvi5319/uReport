import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      screens: {
        sm: '375px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1920px',
      },
      colors: {
        // uReport semantic status tokens (UX-Mockup §Design System)
        'status-open': '#3b82f6',   // blue-500
        'status-closed': '#6b7280', // gray-500
        'sla-ok': '#22c55e',        // green-500
        'sla-warning': '#f59e0b',   // amber-500
        'sla-breach': '#ef4444',    // red-500
      },
    },
  },
  plugins: [animate],
};

export default config;
