/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(207, 90%, 54%)',
        secondary: 'hsl(25, 5.3%, 44.7%)',
        accent: 'hsl(159, 84%, 39%)',
      },
    },
  },
  plugins: [],
}
