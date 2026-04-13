/**
 * `/calendar` renders the vendored source calendar runtime inside an iframe.
 *
 * Using an iframe gives the vendored scripts their own document lifecycle
 * (DOMContentLoaded, isolated window, etc.) which avoids the race conditions
 * caused by replacing the document via `document.write()` after Next.js
 * hydration.
 */

export default function CalendarPage() {
    return (
        <iframe
            src="/api/calendar-embed"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                border: 0,
            }}
            title="SalonBW Calendar"
        />
    );
}
