/* Service Worker panelu — wyłącznie powiadomienia push.
 *
 * Świadomie NIE cache'uje niczego: panel jest aplikacją wymagającą
 * zalogowania i świeżych danych, a nietrafiony cache pokazywałby
 * nieaktualny kalendarz. Jedyne zadanie tego workera to odebrać push
 * i otworzyć właściwy ekran po kliknięciu.
 */

self.addEventListener('install', () => {
    // Nowy worker przejmuje kontrolę od razu — bez tego pierwsze
    // powiadomienie działałoby dopiero po zamknięciu wszystkich kart.
    void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    // Backend wysyła JSON {title, body, icon?, url?}. Gdyby kiedykolwiek
    // przyszło coś innego (albo pusty push), pokazujemy sensowny fallback
    // zamiast wyrzucać wyjątek i gubić powiadomienie.
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch {
        payload = {};
    }

    const title = payload.title || 'Salon Black & White';
    const options = {
        body: payload.body || 'Nowe powiadomienie w panelu.',
        icon: payload.icon || '/icon.svg',
        badge: '/icon.svg',
        // Bez tego telefon z wygaszonym ekranem potrafi wyciszyć powiadomienie.
        requireInteraction: false,
        data: { url: payload.url || '/dashboard' },
        // Kolejne rezerwacje mają się układać obok siebie, nie nadpisywać.
        tag: payload.tag || undefined,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const target = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        (async () => {
            const allClients = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true,
            });

            // Jeśli panel jest już otwarty, przenieś tę kartę na wierzch i
            // przenawiguj — otwieranie kolejnej karty przy każdym kliknięciu
            // szybko zaśmieciłoby telefon.
            for (const client of allClients) {
                if (new URL(client.url).origin === self.location.origin) {
                    await client.focus();
                    if ('navigate' in client) {
                        await client.navigate(target);
                    }
                    return;
                }
            }

            await self.clients.openWindow(target);
        })(),
    );
});
