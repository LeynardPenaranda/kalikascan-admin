import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        app: {
          button: "#569033",
          buttonHover: "#7DBB55",
          buttonBorder: "#569033",
          headerText: "#184A2C",
          inputText: "#497B2C",
          bg: "#f4faf4",
          text: "#535252",
          inputBorder: "#B5AEAE",
          sentMessage: "#69af40",
          responseMessage: "#aabba1",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)"],
      },
    },
  },
  plugins: [],
};

export default config;
