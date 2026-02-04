import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';

type SettingsTile = {
    href: string;
    label: string;
    icon: string;
};

const mainTiles: SettingsTile[] = [
    { href: '/admin/timetables', label: 'grafiki pracy', icon: '🗂️' },
    { href: '/admin/settings/company', label: 'dane salonu', icon: '🏢' },
    { href: '/admin/settings/calendar', label: 'godziny otwarcia', icon: '🕒' },
    { href: '/calendar', label: 'kalendarz', icon: '📅' },
    { href: '/employees', label: 'pracownicy', icon: '🪪' },
    { href: '/clients', label: 'klienci', icon: '👥' },
    { href: '/communication', label: 'rezerwacja online', icon: '☁️' },
    { href: '/reviews', label: 'komentarze', icon: '⭐' },
    { href: '/communication', label: 'łączność', icon: '💬' },
    { href: '/communication', label: 'komunikacja z klientem', icon: '📨' },
    { href: '/communication', label: 'media społecznościowe', icon: '📘' },
    { href: '/invoices', label: 'faktury i abonament', icon: '🧾' },
    { href: '/statistics', label: 'płatności', icon: '💼' },
    { href: '/extension', label: 'Premium', icon: '👑' },
    { href: '/settings', label: 'inne ustawienia', icon: '⚙️' },
];

export default function SettingsPage() {
    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <DashboardLayout>
                <div className="versum-page" data-testid="settings-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">Ustawienia</h1>
                    </header>

                    <div className="versum-grid">
                        {mainTiles.map((tile) => (
                            <Link
                                key={tile.label}
                                href={tile.href}
                                className="versum-tile"
                            >
                                <span
                                    className="versum-tile__icon"
                                    aria-hidden="true"
                                >
                                    {tile.icon}
                                </span>
                                <span>{tile.label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="px-4 pb-5 pt-2">
                        <h2 className="mb-3 text-lg text-gray-700">
                            Ustawienia dodatków
                        </h2>
                        <Link
                            href="/extension"
                            className="versum-tile inline-flex"
                        >
                            <span
                                className="versum-tile__icon"
                                aria-hidden="true"
                            >
                                🧲
                            </span>
                            <span>Marketing Automatyczny</span>
                        </Link>
                    </div>
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}
