/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f3faf2",
          100: "#e3f4e0",
          200: "#c7e8c2",
          300: "#9bd594",
          400: "#67ba5e",
          500: "#43a03b",
          600: "#33812d",
          700: "#2a6627",
          800: "#235222",
          900: "#1d431d",
        },
      },
    },
  },
  plugins: [],
};
