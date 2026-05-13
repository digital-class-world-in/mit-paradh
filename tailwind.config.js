/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          light: '#60a5fa',
        },
        institutional: {
          dark: '#002147',
          gold: '#ecc94b',
        }
      },
      boxShadow: {
        'premium': '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        'public-sans': ['var(--font-public-sans)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
