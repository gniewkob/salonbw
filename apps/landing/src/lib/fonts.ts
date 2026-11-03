import localFont from 'next/font/local';

export const playfair = localFont({
    src: [
        { path: './fonts/PlayfairDisplay.ttf', weight: '400 900', style: 'normal' },
        { path: './fonts/PlayfairDisplay-Italic.ttf', weight: '400 900', style: 'italic' },
    ],
    variable: '--font-playfair',
    display: 'swap',
});

export const openSans = localFont({
    src: [{ path: './fonts/OpenSans.ttf', weight: '300 800', style: 'normal' }],
    variable: '--font-open-sans',
    display: 'swap',
});
