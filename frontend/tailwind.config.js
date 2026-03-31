/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        sans:    ['"Plus Jakarta Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        cyan:  { 400:'#22d3ee', 500:'#06b6d4', 600:'#0891b2' },
        violet:{ 400:'#a78bfa', 500:'#8b5cf6', 600:'#7c3aed' },
        ink: {
          950: '#030712',
          900: '#060d1f',
          850: '#0a1120',
          800: '#0d1526',
          750: '#111c30',
          700: '#162038',
          600: '#1e2d4a',
          500: '#263858',
        },
        surface: {
          DEFAULT: '#0f1729',
          raised:  '#141f35',
          overlay: '#192440',
          border:  'rgba(255,255,255,0.06)',
        },
      },
      boxShadow: {
        'glow-cyan':   '0 0 20px rgba(6,182,212,0.25)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.25)',
        'card':        '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        'card-hover':  '0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px rgba(6,182,212,0.15)',
      },
      animation: {
        'fade-up':   'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':   'fadeIn 0.3s ease both',
        'slide-in':  'slideIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        'shimmer':   'shimmer 1.8s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-sm': 'bounceSm 0.6s ease both',
      },
      keyframes: {
        fadeUp:   { from:{opacity:0,transform:'translateY(12px)'}, to:{opacity:1,transform:'translateY(0)'} },
        fadeIn:   { from:{opacity:0}, to:{opacity:1} },
        slideIn:  { from:{opacity:0,transform:'translateX(-10px)'}, to:{opacity:1,transform:'translateX(0)'} },
        pulseDot: { '0%,100%':{opacity:1}, '50%':{opacity:0.3} },
        shimmer:  { '0%':{backgroundPosition:'-200% 0'}, '100%':{backgroundPosition:'200% 0'} },
        bounceSm: { '0%':{transform:'scale(0.8)'}, '60%':{transform:'scale(1.05)'}, '100%':{transform:'scale(1)'} },
      },
    },
  },
  plugins: [],
}
