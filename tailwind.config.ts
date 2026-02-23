import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cricket: {
          green: "#1a472a",
          gold: "#c9a227",
          cream: "#f5f0e6",
        },
      },
      minHeight: { touch: "44px" },
    },
  },
  plugins: [],
};

export default config;
