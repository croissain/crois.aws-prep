import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sumi: "#171815",
        kinari: "#f5f3ed",
        ai: "#0969ff",
        shu: "#ef4444"
      },
      boxShadow: { soft: "0 14px 40px rgba(23,24,21,.08)" }
    }
  },
  plugins: []
} satisfies Config;
