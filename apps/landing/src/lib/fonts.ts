import { Playfair_Display, Open_Sans, Tangerine } from 'next/font/google';

export const playfair = Playfair_Display({
    subsets: ['latin', 'latin-ext'],
    weight: ['400', '600', '700'],
    style: ['normal', 'italic'],
    variable: '--font-playfair',
    display: 'swap',
});

export const openSans = Open_Sans({
    subsets: ['latin', 'latin-ext'],
    weight: ['400', '500', '600'],
    variable: '--font-open-sans',
    display: 'swap',
});

export const tangerine = Tangerine({
    subsets: ['latin'],
    weight: ['700'],
    variable: '--font-tangerine',
    display: 'swap',
});
