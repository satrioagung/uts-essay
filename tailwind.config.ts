import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#77839a",
        line: "#e8ebf0",
        canvas: "#f7f8fb",
        brand: { DEFAULT: "#4e46e5", soft: "#eeedff" },
        success: { DEFAULT: "#17a673", soft: "#e8f8f1" },
        warning: { DEFAULT: "#d98a00", soft: "#fff5de" },
        danger: { DEFAULT: "#d65362", soft: "#fff0f1" },
      },
      boxShadow: { soft: "0 8px 30px rgba(31, 41, 67, 0.06)" },
      borderRadius: { xl: "14px", "2xl": "18px" },
    },
  },
  plugins: [],
};
export default config;
