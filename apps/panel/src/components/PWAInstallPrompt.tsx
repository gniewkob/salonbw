import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_STORAGE_KEY = 'salonbw-pwa-install-dismissed-at';
const DISMISS_COOLDOWN_DAYS = 14;

function dismissedRecently(): boolean {
    if (typeof window === 'undefined') return false;
    const raw = window.localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    const elapsedDays = (Date.now() - at) / (24 * 60 * 60 * 1000);
    return elapsedDays < DISMISS_COOLDOWN_DAYS;
}

function isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
    // iOS Safari standalone signal
    const nav = window.navigator as Navigator & { standalone?: boolean };
    return nav.standalone === true;
}

/**
 * Branded install prompt banner. Listens for the Chrome
 * `beforeinstallprompt` event, suppresses the default browser UI, and
 * shows our own banner styled to match the brand. Receptionist taps
 * "Zainstaluj" → native install dialog fires; "Później" → banner hides
 * for 14 days.
 *
 * Mounted at the bottom of the persistent shell so it never overlaps
 * the topbar or main nav. Hidden when the app is already running in
 * standalone mode (display-mode: standalone or iOS Safari standalone).
 */
export default function PWAInstallPrompt() {
    const isMobile = useIsMobile();
    const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (isStandalone()) {
            setInstalled(true);
            return;
        }
        if (dismissedRecently()) return;

        const handler = (raw: Event) => {
            raw.preventDefault();
            setEvent(raw as BeforeInstallPromptEvent);
        };
        const installedHandler = () => {
            setInstalled(true);
            setEvent(null);
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', installedHandler);
        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    if (!isMobile || installed || !event) return null;

    const handleInstall = async () => {
        try {
            await event.prompt();
            const choice = await event.userChoice;
            if (choice.outcome === 'dismissed') {
                window.localStorage.setItem(
                    DISMISS_STORAGE_KEY,
                    String(Date.now()),
                );
            }
        } catch {
            // ignore
        } finally {
            setEvent(null);
        }
    };

    const handleDismiss = () => {
        window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
        setEvent(null);
    };

    return (
        <div
            role="dialog"
            aria-label="Zainstaluj aplikację Salon B&W"
            style={{
                position: 'fixed',
                left: '0.75rem',
                right: '0.75rem',
                bottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
                zIndex: 1090,
                background: '#0d0d0d',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                padding: '0.875rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.32)',
            }}
        >
            <span
                aria-hidden
                style={{
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#1a1a1a',
                    color: '#b4b8be',
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    letterSpacing: '-0.05em',
                }}
            >
                BW
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        marginBottom: 2,
                    }}
                >
                    Zainstaluj Salon B&amp;W
                </div>
                <div
                    style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.65)',
                    }}
                >
                    Dodaj panel do ekranu początkowego — szybki dostęp bez
                    pasków przeglądarki.
                </div>
            </div>
            <button
                type="button"
                onClick={handleDismiss}
                style={{
                    minHeight: 36,
                    padding: '0.375rem 0.625rem',
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.6)',
                    border: 'none',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                }}
            >
                Później
            </button>
            <button
                type="button"
                onClick={() => {
                    void handleInstall();
                }}
                style={{
                    minHeight: 36,
                    padding: '0.5rem 0.875rem',
                    background: '#b4b8be',
                    color: '#0d0d0d',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                }}
            >
                Zainstaluj
            </button>
        </div>
    );
}
