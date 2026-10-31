/**
 * WDI browser-QA API fixture (CI only).
 *
 * Listen on loopback ONLY, serve deterministic synthetic content, and never
 * forward to the public production or protected DEV API.
 * No customer data, authentication, email, payments or appointments.
 */
import { createServer } from 'node:http';

const HOST = '127.0.0.1';
const PORT = 43177;

const services = [
    {
        id: 801,
        name: 'Strzyżenie damskie – włosy krótkie',
        category: 'Fryzjerstwo',
        price: 130,
        duration: 45,
        onlineBooking: true,
        isActive: true,
    },
    {
        id: 802,
        name: 'Strzyżenie damskie – włosy długie',
        category: 'Fryzjerstwo',
        price: 190,
        duration: 75,
        onlineBooking: true,
        isActive: true,
    },
    {
        id: 803,
        name: 'Olaplex',
        category: 'Pielęgnacja włosów',
        price: 180,
        duration: 60,
        onlineBooking: true,
        isActive: true,
    },
    {
        id: 804,
        name: 'Koloryzacja testowa',
        category: 'Koloryzacja',
        price: 280,
        duration: 90,
        onlineBooking: true,
        isActive: true,
        variants: [
            { id: 901, name: 'włosy krótkie', price: 280, duration: 90, isActive: true },
            { id: 902, name: 'włosy długie', price: 390, duration: 150, isActive: true },
            { id: 903, name: 'wycofany', price: 50, duration: 30, isActive: false },
        ],
    },
    {
        id: 805,
        name: 'Usługa wyłączona z rezerwacji',
        category: 'Pielęgnacja włosów',
        price: 5,
        duration: 5,
        onlineBooking: false,
        isActive: true,
    },
];

const openingHours = {
    mon: [{ open: '09:00', close: '17:00' }],
    tue: [{ open: '09:00', close: '17:00' }],
    wed: [{ open: '09:00', close: '17:00' }],
    thu: [{ open: '09:00', close: '17:00' }],
    fri: [{ open: '09:00', close: '17:00' }],
    sat: [],
    sun: [],
};

const routes = new Map([
    ['/healthz', { status: 'ok', fixture: true }],
    ['/services/public', services],
    ['/calendar/opening-hours', { hours: openingHours }],
    ['/calendar/nearest-slot', { slot: null }],
    [
        '/content/sections/founder_message',
        {
            data: {
                name: 'Testowa właścicielka salonu',
                quote: 'Treść syntetyczna do testów responsywności.',
            },
        },
    ],
]);

const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://${HOST}:${PORT}`);
    const path = url.pathname;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'GET') {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'read_only_fixture' }));
        return;
    }

    if (!routes.has(path)) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'fixture_not_found' }));
        return;
    }

    res.writeHead(200);
    res.end(JSON.stringify(routes.get(path)));
});

server.listen(PORT, HOST, () => {
    process.stdout.write(`WDI_LOOPBACK_API_READY=http://${HOST}:${PORT}\n`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
        server.close(() => process.exit(0));
    });
}
