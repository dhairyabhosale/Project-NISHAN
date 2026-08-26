import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#202124", stone: "#E8E5DF", alert: "#B42318", rupee: "#B45309" } } },
  plugins: []
};
export default config;
