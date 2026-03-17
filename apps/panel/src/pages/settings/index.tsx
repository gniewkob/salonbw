import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

type SettingsTile = {
    href: string;
    label: string;
    icon: string;
};

const addonTiles: SettingsTile[] = [
    {
        href: '/extension/tools/4',
        label: 'Marketing Automatyczny',
        icon: 'sprite-automatic_marketing',
    },
];

const mainTiles: SettingsTile[] = [
    {
        href: '/settings/timetable/employees',
        label: 'grafiki pracy',
        icon: 'sprite-settings_work_schedule',
    },
    {
        href: '/settings/branch',
        label: 'dane salonu',
        icon: 'sprite-settings_branch',
    },
    {
        href: '/settings/calendar',
        label: 'kalendarz',
        icon: 'sprite-settings_opening_hours',
    },
    { href: '/calendar', label: 'kalendarz', icon: 'sprite-settings_calendar' },
    {
        href: '/employees',
        label: 'pracownicy',
        icon: 'sprite-settings_employees',
    },
    { href: '/customers', label: 'klienci', icon: 'sprite-settings_customers' },
    {
        href: '/communication',
        label: 'rezerwacja online',
        icon: 'sprite-settings_booking',
    },
    { href: '/reviews', label: 'komentarze', icon: 'sprite-settings_notice' },
    {
        href: '/communication',
        label: 'łączność',
        icon: 'sprite-settings_sms_nav',
    },
    {
        href: '/communication',
        label: 'komunikacja z klientem',
        icon: 'sprite-settings_notifications_nav',
    },
    {
        href: '/communication',
        label: 'media społecznościowe',
        icon: 'sprite-settings_social_media',
    },
    {
        href: '/invoices',
        label: 'faktury i abonament',
        icon: 'sprite-settings_invoice',
    },
    {
        href: '/statistics',
        label: 'płatności',
        icon: 'sprite-settings_payment_methods',
    },
    {
        href: '/extension',
        label: 'Premium',
        icon: 'sprite-settings_subscription',
    },
    {
        href: '/settings',
        label: 'inne ustawienia',
        icon: 'sprite-settings_blue',
    },
];

export default function SettingsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <VersumShell role={role}>
                <div className="versum-page" data-testid="settings-page">
                    <h2>
                        <i
                            className="icon sprite-wrench settings-section-heading-icon"
                            aria-hidden="true"
                        />
                        Ustawienia
                    </h2>

                    <div className="settings-tiles-grid">
                        {mainTiles.map((tile) => (
                            <Link
                                key={tile.label}
                                href={tile.href}
                                className="settings-tile"
                            >
                                <i
                                    className={`icon ${tile.icon} settings-tile__icon`}
                                    aria-hidden="true"
                                />
                                <span>{tile.label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="settings-addon-section">
                        <h2>
                            <i
                                className="icon sprite-star settings-section-heading-icon"
                                aria-hidden="true"
                            />
                            Ustawienia dodatków
                        </h2>
                        <div className="settings-tiles-grid">
                            {addonTiles.map((tile) => (
                                <Link
                                    key={tile.label}
                                    href={tile.href}
                                    className="settings-tile"
                                >
                                    <i
                                        className={`icon ${tile.icon} settings-tile__icon`}
                                        aria-hidden="true"
                                    />
                                    <span>{tile.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
