import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        go: "#22c55e",
        wait: "#ef4444",
        sell: "#f97316",
        hold: "#22c55e",
      },
    },
  },
  plugins: [],
};
export default config;
