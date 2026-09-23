import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#111418",
        panel: "#171b21",
        ink: "#eef3f7",
        muted: "#99a4b1",
        line: "#2a313a",
        civic: "#3dd6a3",
        signal: "#f2bd57",
        alert: "#f05f5f",
        skyline: "#78a9ff"
      },
      boxShadow: {
        soft: "0 18px 70px rgba(0,0,0,.28)"
      }
    }
  },
  plugins: []
};

export default config;
