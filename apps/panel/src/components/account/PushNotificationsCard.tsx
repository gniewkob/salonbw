import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    describePushState,
    isPushSupported,
    resolvePermissionState,
    urlBase64ToUint8Array,
    type PushPermissionState,
    type VapidConfig,
} from '@/utils/webPush';

/**
 * Zapis TEGO urządzenia do powiadomień push.
 *
 * Subskrypcja jest per-urządzenie i per-przeglądarka — właścicielka musi
 * ją włączyć osobno na telefonie i na komputerze. Dlatego karta mówi
 * wprost „na tym urządzeniu", zamiast udawać globalny przełącznik.
 */
export default function PushNotificationsCard() {
    const { apiFetch } = useAuth();
    const toast = useToast();

    const [state, setState] = useState<PushPermissionState>('unsupported');
    const [subscribed, setSubscribed] = useState(false);
    const [config, setConfig] = useState<VapidConfig | null>(null);
    const [busy, setBusy] = useState(false);
    const [ready, setReady] = useState(false);

    const refreshState = useCallback(async () => {
        const supported = isPushSupported(window);
        setState(
            resolvePermissionState(
                supported,
                supported ? Notification.permission : undefined,
            ),
        );

        if (!supported) {
            setReady(true);
            return;
        }

        try {
            const registration =
                await navigator.serviceWorker.getRegistration('/sw.js');
            const existing = await registration?.pushManager.getSubscription();
            setSubscribed(Boolean(existing));
        } catch {
            setSubscribed(false);
        } finally {
            setReady(true);
        }
    }, []);

    useEffect(() => {
        void (async () => {
            try {
                // Backend zwraca {publicKey, enabled}. Bez VAPID-a na serwerze
                // nie ma czego włączać — wtedy karta mówi o tym wprost,
                // zamiast pokazywać przycisk kończący się błędem.
                const vapid = await apiFetch<VapidConfig>(
                    '/push/vapid-public-key',
                );
                setConfig(vapid);
            } catch {
                setConfig({ publicKey: null, enabled: false });
            }
            await refreshState();
        })();
    }, [apiFetch, refreshState]);

    const enable = useCallback(async () => {
        if (!config?.publicKey) return;
        setBusy(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setState(resolvePermissionState(true, permission));
                return;
            }

            const registration =
                await navigator.serviceWorker.register('/sw.js');
            // Rejestracja wraca zanim worker zacznie działać; bez tego
            // `pushManager.subscribe` potrafi paść na świeżej instalacji.
            await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(config.publicKey),
            });

            await apiFetch('/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: subscription.toJSON() }),
            });

            setSubscribed(true);
            setState('granted');
            toast.success('Powiadomienia włączone na tym urządzeniu');
        } catch (error) {
            console.error('Push subscribe failed', error);
            toast.error('Nie udało się włączyć powiadomień na tym urządzeniu');
        } finally {
            setBusy(false);
        }
    }, [apiFetch, config, toast]);

    const disable = useCallback(async () => {
        setBusy(true);
        try {
            const registration =
                await navigator.serviceWorker.getRegistration('/sw.js');
            const subscription =
                await registration?.pushManager.getSubscription();

            if (subscription) {
                // Kolejność ma znaczenie: najpierw powiedz backendowi, póki
                // jeszcze znamy endpoint, dopiero potem odsubskrybuj lokalnie.
                await apiFetch('/push/unsubscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });
                await subscription.unsubscribe();
            }

            setSubscribed(false);
            toast.success('Powiadomienia wyłączone na tym urządzeniu');
        } catch (error) {
            console.error('Push unsubscribe failed', error);
            toast.error('Nie udało się wyłączyć powiadomień');
        } finally {
            setBusy(false);
        }
    }, [apiFetch, toast]);

    const serverReady = config?.enabled && Boolean(config.publicKey);

    return (
        <div style={{ maxWidth: 480 }}>
            <p className="text-muted" style={{ marginTop: -4 }}>
                Powiadomienie o nowej rezerwacji online trafi na ten telefon
                nawet przy zamkniętym panelu — drugi kanał obok e-maila.
                Ustawienie dotyczy tego urządzenia, więc włącz je osobno na
                telefonie i na komputerze.
            </p>

            {!ready && <p className="text-muted">Sprawdzanie...</p>}

            {ready && !serverReady && (
                <p className="text-muted" role="status">
                    Powiadomienia push nie są jeszcze skonfigurowane po stronie
                    serwera (brak kluczy VAPID).
                </p>
            )}

            {ready && serverReady && (
                <>
                    <p
                        className={
                            state === 'denied' ? 'text-danger' : 'text-muted'
                        }
                        role="status"
                    >
                        {describePushState(state, subscribed)}
                    </p>

                    {state !== 'unsupported' && state !== 'denied' && (
                        <button
                            type="button"
                            className={`btn btn-sm ${subscribed ? 'btn-outline-secondary' : 'btn-dark'}`}
                            disabled={busy}
                            onClick={() =>
                                void (subscribed ? disable() : enable())
                            }
                        >
                            {busy
                                ? 'Chwileczkę...'
                                : subscribed
                                  ? 'Wyłącz na tym urządzeniu'
                                  : 'Włącz na tym urządzeniu'}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
