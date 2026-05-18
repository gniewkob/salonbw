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
                <meta name="color-scheme" content="light" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </Head>
            <body>
                <Main />
                <NextScript nonce={props.nonce} />
            </body>
        </Html>
    );
}
