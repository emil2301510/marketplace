import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fef9ee',
          100: '#fdf0d5',
          200: '#f9ddaa',
          300: '#f5c474',
          400: '#f0a43c',
          500: '#ec8a18',
          600: '#dd6f0e',
          700: '#b7530e',
          800: '#924113',
          900: '#773713',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
