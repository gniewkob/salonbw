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
                    silver: '#b8bcc8',
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
