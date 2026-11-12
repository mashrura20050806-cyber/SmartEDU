/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          950: '#051F20',
          900: '#0B2B26',
          800: '#163832',
          700: '#235347',
          300: '#8EB69B',
          50: '#DAF1DE',
        },
      },
    },
  },
  plugins: [],
};
