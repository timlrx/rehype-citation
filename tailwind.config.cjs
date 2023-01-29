/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './demo/**/*.{js,ts,jsx,tsx}'],
  safelist: ['sr-only'],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
}
