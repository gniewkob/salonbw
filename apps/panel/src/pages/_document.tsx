import { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentProps } from 'next/document';

// Extend DocumentProps to include nonce
interface CustomDocumentProps extends DocumentProps {
    nonce?: string;
}

export default function Document(props: CustomDocumentProps) {
    // Next.js automatically passes nonce to Script components when CSP is set via middleware
    return (
        <Html lang="en">
            <Head nonce={props.nonce}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Lato:wght@100;300;400;700;900&family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap"
                    rel="stylesheet"
                />
                {/* Vendored Versum CSS - only essential files (skip responsive-*.css which is 821KB Bootstrap) */}
                <link
                    href="/versum-calendar/assets/new-ui-9cfd3fdff9f46796405002ac31d294d5bf69241e972905313e73767abe10af07.css"
                    rel="stylesheet"
                />
                <link
                    href="/versum-calendar/javascripts/new/default-51c7a0b55a22f2c6e6d3402e1cc0060b.css"
                    rel="stylesheet"
                />
                <link
                    href="/versum-calendar/javascripts/new/style-d5194205877fdbcc0f7b046384512047.css"
                    rel="stylesheet"
                />
            </Head>
            <body>
                <Main />
                <NextScript nonce={props.nonce} />
            </body>
        </Html>
    );
}
