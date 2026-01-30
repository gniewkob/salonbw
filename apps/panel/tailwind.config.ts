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
                    DEFAULT: '#25B4C1', // Versum Teal
                    hover: '#1f9ba8',
                    black: '#333333',
                    white: '#ffffff',
                    gray: '#f5f5f5',
                },
            },
            fontFamily: {
                sans: ['"Open Sans"', 'sans-serif'],
                body: ['"Open Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
export default config;
