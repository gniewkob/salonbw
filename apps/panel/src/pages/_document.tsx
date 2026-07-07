import { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentProps } from 'next/document';

// Extend DocumentProps to include nonce
interface CustomDocumentProps extends DocumentProps {
    nonce?: string;
}

export default function Document(props: CustomDocumentProps) {
    // Next.js automatically passes nonce to Script components when CSP is set via middleware
    return (
        <Html lang="pl">
            <Head nonce={props.nonce}>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#0d0d0d" />
                <meta name="application-name" content="Salon B&amp;W" />
                {/* Modern standard; the apple-prefixed one is kept for older iOS but is deprecated. */}
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="black-translucent"
                />
                <meta
                    name="apple-mobile-web-app-title"
                    content="Salon B&amp;W"
                />
                <link rel="apple-touch-icon" href="/icon.svg" />
                <link rel="icon" type="image/svg+xml" href="/icon.svg" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Lato:wght@100;300;400;700;900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap"
                    rel="stylesheet"
                />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
                />
                {/* Vendored CSS removed - using only salonbw-shell.css for React modules */}
            </Head>
            <body>
                <Main />
                <NextScript nonce={props.nonce} />
            </body>
        </Html>
    );
}
