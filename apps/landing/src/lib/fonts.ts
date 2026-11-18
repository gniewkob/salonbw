import localFont from 'next/font/local';
// Subset (Latin + Latin Extended: PL/EN/DE) WOFF2 builds of the OFL variable fonts
// in ./fonts; 1.1 MB of TTF became ~250 KB. Regenerate with fonttools pyftsubset.

export const playfair = localFont({
    src: [
        { path: './fonts/PlayfairDisplay.woff2', weight: '400 900', style: 'normal' },
        { path: './fonts/PlayfairDisplay-Italic.woff2', weight: '400 900', style: 'italic' },
    ],
    variable: '--font-playfair',
    display: 'swap',
});

export const openSans = localFont({
    src: [{ path: './fonts/OpenSans.woff2', weight: '300 800', style: 'normal' }],
    variable: '--font-open-sans',
    display: 'swap',
});
