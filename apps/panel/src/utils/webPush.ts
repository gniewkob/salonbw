/**
 * Web-push helpers.
 *
 * Logika rozbita na czyste funkcje, bo `ServiceWorkerRegistration`,
 * `PushManager` i `Notification` są w jsdomie niedostępne — bez tego
 * rozdziału jedyną opcją byłoby mockowanie całego API przeglądarki
 * albo rezygnacja z testów.
 */

export type PushPermissionState =
    | 'unsupported'
    | 'default'
    | 'granted'
    | 'denied';

export interface VapidConfig {
    publicKey: string | null;
    enabled: boolean;
}

/**
 * VAPID public key przychodzi z backendu jako base64url, a `PushManager`
 * wymaga `Uint8Array`. Zwykły `atob` nie zadziała: base64url używa `-`/`_`
 * zamiast `+`/`/` i pomija dopełnienie `=`.
 */
export function urlBase64ToUint8Array(
    base64String: string,
): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const raw = atob(base64);
    // Backed by a concrete ArrayBuffer (not ArrayBufferLike) so the result
    // satisfies BufferSource, which is what PushManager.subscribe expects.
    const output = new Uint8Array(new ArrayBuffer(raw.length));
    for (let i = 0; i < raw.length; i += 1) {
        output[i] = raw.charCodeAt(i);
    }
    return output;
}

/**
 * Czy w ogóle da się subskrybować. iOS pokazuje push tylko dla aplikacji
 * dodanej do ekranu głównego, a poza HTTPS (i localhostem) Service Worker
 * nie istnieje — dlatego sprawdzamy realne API, nie user-agenta.
 */
export function isPushSupported(win: {
    isSecureContext?: boolean;
    Notification?: unknown;
    navigator?: { serviceWorker?: unknown };
    PushManager?: unknown;
}): boolean {
    return Boolean(
        win.isSecureContext &&
            win.Notification &&
            win.navigator?.serviceWorker &&
            win.PushManager,
    );
}

/**
 * Stan do pokazania w UI. Rozróżnienie „denied" od „default" jest istotne:
 * przy „denied" przeglądarka NIE pokaże już promptu, więc przycisk
 * „Włącz" byłby ślepy — trzeba pokierować do ustawień przeglądarki.
 */
export function resolvePermissionState(
    supported: boolean,
    permission: string | undefined,
): PushPermissionState {
    if (!supported) return 'unsupported';
    if (permission === 'granted') return 'granted';
    if (permission === 'denied') return 'denied';
    return 'default';
}

export function describePushState(
    state: PushPermissionState,
    subscribed: boolean,
): string {
    switch (state) {
        case 'unsupported':
            return 'Ta przeglądarka nie obsługuje powiadomień push. Na iPhonie dodaj panel do ekranu głównego.';
        case 'denied':
            return 'Powiadomienia są zablokowane w ustawieniach przeglądarki — odblokuj je dla panel.salon-bw.pl.';
        case 'granted':
            return subscribed
                ? 'Powiadomienia włączone na tym urządzeniu.'
                : 'Zezwolenie jest, ale to urządzenie nie jest jeszcze zapisane.';
        default:
            return 'Włącz, aby dostawać powiadomienie o nowej rezerwacji na ten telefon.';
    }
}
