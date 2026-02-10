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
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
                />
                {/* Vendored CSS removed - using only versum-shell.css for React modules */}
            </Head>
            <body>
                <Main />
                <NextScript nonce={props.nonce} />
            </body>
        </Html>
    );
}
