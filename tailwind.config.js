/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#f5821f',
          red: '#e02424',
          navy: '#0b2a52',
          navyDark: '#071a33',
          navyLight: '#1b3f75',
        },
      },
    },
  },
  plugins: [],
}
