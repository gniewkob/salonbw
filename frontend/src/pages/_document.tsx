import { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentProps } from 'next/document';

export default function Document(props: DocumentProps) {
    // Next.js automatically passes nonce to Script components when CSP is set via middleware
    return (
        <Html lang="en">
            <Head nonce={props.nonce} />
            <body>
                <Main />
                <NextScript nonce={props.nonce} />
            </body>
        </Html>
    );
}
