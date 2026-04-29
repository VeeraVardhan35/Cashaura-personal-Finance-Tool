/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#191610",
        paper: "#f8f1e3",
        accent: "#da5a2a",
        sage: "#72806f",
        sand: "#dccfb8"
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        body: ["'Space Mono'", "monospace"],
        mono: ["'Space Mono'", "monospace"]
      },
      boxShadow: {
        card: "8px 8px 0 rgba(25, 22, 16, 0.12)"
      }
    },
  },
  plugins: [],
};
