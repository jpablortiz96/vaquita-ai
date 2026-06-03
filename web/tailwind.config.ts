import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                bg: "#0a0a0f",
                surface: "#15151c",
                border: "#2a2a35",
                primary: "#00d4aa",
                accent: "#a855f7",
                "text-dim": "#8a8a96",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
        },
    },
    plugins: [],
};
export default config;
