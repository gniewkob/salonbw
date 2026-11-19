import localFont from 'next/font/local';
// Subset (Latin + Latin Extended: PL/EN/DE) WOFF2 builds of the OFL variable fonts
// in ./fonts, instanced to the weights the site uses (wght 400–700; Open Sans
// width pinned to 100) — ~165 KB in total. Regenerate with fonttools pyftsubset
// + fontTools.varLib.instancer.

export const playfair = localFont({
    src: [
        { path: './fonts/PlayfairDisplay.woff2', weight: '400 700', style: 'normal' },
        { path: './fonts/PlayfairDisplay-Italic.woff2', weight: '400 700', style: 'italic' },
    ],
    variable: '--font-playfair',
    display: 'swap',
});

export const openSans = localFont({
    src: [{ path: './fonts/OpenSans.woff2', weight: '400 700', style: 'normal' }],
    variable: '--font-open-sans',
    display: 'swap',
});
