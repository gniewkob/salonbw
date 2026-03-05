import { useEffect, useRef, useState } from 'react';

/**
 * `/calendar` must render the vendored Versum calendar runtime 1:1.
 *
 * We intentionally replace the whole document with HTML served by
 * `/api/calendar-embed` (which injects runtime config and keeps script loading
 * isolated from Next.js hydration).
 */
const containerStyle: React.CSSProperties = {
    padding: 24,
    fontFamily: 'system-ui, sans-serif',
};
const titleStyle: React.CSSProperties = { fontSize: 18, margin: 0 };
const errorTextStyle: React.CSSProperties = {
    marginTop: 12,
    marginBottom: 0,
    opacity: 0.8,
};
const actionsStyle: React.CSSProperties = { marginTop: 12, marginBottom: 0 };
const buttonStyle: React.CSSProperties = {
    appearance: 'none',
    border: '1px solid #ddd',
    padding: '6px 10px',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
};

export default function CalendarPage() {
    const didReplaceDocumentRef = useRef(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (didReplaceDocumentRef.current) return;
        didReplaceDocumentRef.current = true;

        const run = async () => {
            try {
                const res = await fetch('/api/calendar-embed', {
                    credentials: 'include',
                    cache: 'no-store',
                });

                // If the API route performs an auth redirect, honor it.
                if (res.redirected) {
                    window.location.href = res.url;
                    return;
                }

                if (!res.ok) {
                    throw new Error(`calendar-embed HTTP ${res.status}`);
                }

                const html = await res.text();
                document.open();
                document.write(html);
                document.close();
            } catch (e) {
                didReplaceDocumentRef.current = false;
                setError(e instanceof Error ? e.message : 'Unknown error');
            }
        };

        void run();
    }, []);

    if (error) {
        return (
            <main style={containerStyle}>
                <h1 style={titleStyle}>Calendar unavailable</h1>
                <p style={errorTextStyle}>{error}</p>
                <p style={actionsStyle}>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        style={buttonStyle}
                    >
                        Reload
                    </button>
                </p>
            </main>
        );
    }

    return <main style={containerStyle}>Loading calendar...</main>;
}
