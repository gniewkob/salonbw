import { Playfair_Display, Open_Sans } from 'next/font/google';

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
