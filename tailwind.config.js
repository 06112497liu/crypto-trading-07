/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'bg-primary': '#0B0E11',
        'bg-secondary': '#181A20',
        'bg-tertiary': '#2B3139',
        'bg-card': '#1E2329',
        'border': '#2B3139',
        'text-primary': '#EAECEF',
        'text-secondary': '#848E9C',
        'text-tertiary': '#5E6673',
        'accent-yellow': '#F0B90B',
        'accent-yellow-hover': '#FCD535',
        'accent-green': '#0ECB81',
        'accent-red': '#F6465D',
        'accent-blue': '#2B6CB0',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['IBM Plex Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
