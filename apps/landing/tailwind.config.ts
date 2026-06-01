import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    black: '#000000',
                    white: '#ffffff',
                    gold: '#b4b8be',
                },
            },
            fontFamily: {
                heading: ['var(--font-playfair)', 'Georgia', 'serif'],
                body: ['var(--font-open-sans)', 'Arial', 'sans-serif'],
                script: ['var(--font-tangerine)', 'cursive'],
            },
        },
    },
    plugins: [],
};
export default config;
