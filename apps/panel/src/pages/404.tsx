import Head from 'next/head';
import Link from 'next/link';

export default function NotFound() {
    return (
        <>
            <Head>
                <title>
                    404 — Nie znaleziono strony | Salon Black &amp; White
                </title>
                <meta name="robots" content="noindex" />
            </Head>
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                    padding: '2rem',
                }}
            >
                <h1
                    style={{
                        fontSize: '4rem',
                        fontWeight: 700,
                        margin: 0,
                        color: '#333',
                    }}
                >
                    404
                </h1>
                <p style={{ fontSize: '1.125rem', color: '#666', margin: 0 }}>
                    Nie znaleziono strony.
                </p>
                <Link
                    href="/"
                    className="btn btn-primary"
                    style={{ marginTop: '0.5rem' }}
                >
                    Wróć do pulpitu
                </Link>
            </div>
        </>
    );
}
