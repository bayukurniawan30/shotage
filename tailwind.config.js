import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        pastel: {
          purple: '#cdb4db',
          pinkLight: '#ffc8dd',
          pink: '#ffafcc',
          blueLight: '#bde0fe',
          blue: '#a2d2ff',
        },
        brand: {
          50: '#fcf7fd',
          100: '#f8eefb',
          200: '#cdb4db',
          300: '#bde0fe',
          400: '#a2d2ff',
          500: '#ffafcc',
          600: '#ffc8dd',
          700: '#cdb4db',
          800: '#a2d2ff',
          900: '#7a5a8f',
          950: '#4d3060',
        },
      },
    },
  },
  plugins: [animate],
};
