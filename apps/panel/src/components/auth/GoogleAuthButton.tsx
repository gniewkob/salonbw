/**
 * "Continue with Google" button. A full-page link (OAuth is a browser
 * navigation, not a fetch) to the API's social-auth start endpoint. The API
 * sets SSO cookies (Domain=.salon-bw.pl) on callback and redirects back to the
 * panel. The Google "G" is Google's trademark — the one allowed non-mono logo
 * (required for sign-in recognition), like our own logo.
 *
 * In prod NEXT_PUBLIC_API_URL is the relative proxy "/api", but OAuth must hit
 * the API domain directly, so fall back to the absolute API URL.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_API_URL
    : 'https://api.salon-bw.pl';

function GoogleGlyph() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
        >
            <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
            />
            <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
            />
            <path
                fill="#FBBC05"
                d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33Z"
            />
            <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
            />
        </svg>
    );
}

export default function GoogleAuthButton({
    label = 'Kontynuuj z Google',
}: {
    label?: string;
}) {
    // Only show once Google OAuth is actually configured (owner sets this +
    // GOOGLE_CLIENT_ID/SECRET on the API), so we never show a button that 404s.
    if (process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== 'true') {
        return null;
    }
    const divider = {
        flex: 1,
        height: 1,
        background: 'rgba(255,255,255,0.18)',
    } as const;
    return (
        <>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    margin: '1.5rem 0',
                }}
            >
                <span style={divider} />
                <span
                    style={{
                        fontSize: '0.7rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.45)',
                        fontFamily: "'Open Sans', sans-serif",
                    }}
                >
                    lub
                </span>
                <span style={divider} />
            </div>
            <a
                href={`${API_BASE}/auth/social/google`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    width: '100%',
                    padding: '0.85rem 1.5rem',
                    background: '#ffffff',
                    color: '#1a1a1a',
                    border: '1px solid #dadce0',
                    borderRadius: '2px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    fontFamily: "'Open Sans', sans-serif",
                    textDecoration: 'none',
                }}
            >
                <GoogleGlyph />
                {label}
            </a>
        </>
    );
}
