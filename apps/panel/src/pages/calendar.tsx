import { useEffect, useRef, useState } from 'react';

/**
 * `/calendar` must render the vendored source calendar runtime 1:1.
 *
 * We intentionally replace the whole document with HTML served by
 * `/api/calendar-embed` (which injects runtime config and keeps script loading
 * isolated from Next.js hydration).
 */

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
                setError(
                    e instanceof Error
                        ? e.message
                        : 'Nieznany błąd ładowania kalendarza',
                );
            }
        };

        void run();
    }, []);

    if (error) {
        return (
            <main className="p-6 font-sans">
                <h1 className="text-[18px] m-0">
                    Kalendarz jest chwilowo niedostępny
                </h1>
                <p className="mt-3 mb-0 opacity-80">{error}</p>
                <p className="mt-3 mb-0">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="appearance-none border border-gray-300 px-[10px] py-1.5 rounded-md bg-white cursor-pointer"
                    >
                        Odśwież
                    </button>
                </p>
            </main>
        );
    }

    return <main className="p-6 font-sans">Ładowanie kalendarza...</main>;
}
