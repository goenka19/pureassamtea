/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'tea-green': '#006C3F',
        'tea-dark':  '#1B4D3E',
        'tea-light': '#E8F5E9',
        'cream':     '#F9F8F3',
        'ink':       '#0E0E0E',
        'ink-2':     '#2A2A2A',
        'ink-3':     '#5A5A5A',
        'line':      '#E5E5E5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        'pat': {'max': '880px'},
        'mob': {'max': '639px'},
      },
    },
  },
  plugins: [],
}
