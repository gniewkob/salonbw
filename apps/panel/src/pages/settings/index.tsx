import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

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
    { href: '/customers', label: 'klienci', icon: '👥' },
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
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <VersumShell role={role}>
                <div className="versum-page" data-testid="settings-page">
                    <ul className="breadcrumb">
                        <li>Ustawienia</li>
                    </ul>

                    <div className="versum-grid">
                        {mainTiles.map((tile) => (
                            <Link
                                key={tile.label}
                                href={tile.href}
                                className="versum-tile versum-tile--clickable"
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

                    <div className="versum-section">
                        <h2 className="versum-section__title">
                            Ustawienia dodatków
                        </h2>
                        <Link
                            href="/extension"
                            className="versum-tile versum-tile--clickable"
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
            </VersumShell>
        </RouteGuard>
    );
}
