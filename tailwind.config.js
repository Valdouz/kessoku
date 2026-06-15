/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Fond "stellaire" — bleu nuit profond
        night: {
          950: '#07060f',
          900: '#0b0a14',
          850: '#11101d',
          800: '#171627',
          700: '#201f33',
          600: '#2c2a42',
          500: '#3a3856',
        },
        // Accent principal — rose Kessoku Band (Bocchi the Rock)
        kessoku: {
          50: '#fff1f6',
          100: '#ffe4ee',
          200: '#ffc9de',
          300: '#ff9dc2',
          400: '#ff5fa0',
          500: '#ff2e85',
          600: '#ed1370',
          700: '#c80a5b',
          800: '#a60c4f',
          900: '#8a1047',
        },
        // Accent secondaire — violet stellaire
        stellar: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,46,133,0.25), 0 8px 30px -8px rgba(255,46,133,0.35)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        twinkle: 'twinkle 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
