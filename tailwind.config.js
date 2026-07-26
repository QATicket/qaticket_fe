/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#f5821f',
          red: '#e02424',
        },
      },
    },
  },
  plugins: [],
}
