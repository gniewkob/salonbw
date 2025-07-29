import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    black: '#000000',
                    white: '#ffffff',
                    gold: '#c5a880',
                },
            },
            fontFamily: {
                heading: ['"Playfair Display"', 'serif'],
                body: ['"Open Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
export default config;
