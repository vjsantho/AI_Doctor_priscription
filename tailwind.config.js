const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        "section-dark": "#111111",
        "section-darker": "#161616",
        primary: {
          DEFAULT: "#3b82f6", // Bright blue for contrast on dark
          hover: "#2563eb",
          glow: "rgba(59, 130, 246, 0.4)",
        },
        secondary: "#94a3b8",
        "text-main": "#f8fafc",
        "text-muted": "#94a3b8",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.15)",
        "card-hover": "0 0 30px rgba(59, 130, 246, 0.1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
