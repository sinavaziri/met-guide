import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'met-red': '#C41230',
        'met-gold': '#B4975A',
        'met-gold-light': '#D4A853',
        'met-ivory': '#FAF8F5',
        'met-charcoal': '#1C1917',
        'met-espresso': '#292524',
      },
    },
  },
  plugins: [],
};
export default config;
