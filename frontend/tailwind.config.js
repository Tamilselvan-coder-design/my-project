/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81' },
        surface: { 50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',800:'#1e293b',850:'#172033',900:'#0f172a',950:'#080d1a' },
        amber: { 400:'#fbbf24',500:'#f59e0b',600:'#d97706' },
        orange: { 400:'#fb923c',500:'#f97316',600:'#ea580c' },
      },
      fontFamily: { sans: ['DM Sans', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
      animation: { 
        'fade-in': 'fadeIn .3s ease', 
        'slide-up': 'slideUp .4s ease', 
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'scale-in': 'scaleIn .2s ease',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        scaleIn: { from: { transform: 'scale(0.95)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    }
  },
  plugins: []
}
