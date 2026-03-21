import Link from 'next/link';
import { useEffect } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';

type SettingsTile = {
    href: string;
    label: string;
    boxClass: string;
    iconId: string;
};

const SETTINGS_ICON_SPRITE = '/assets/settings-dashboard-icons.svg';

const addonTiles: SettingsTile[] = [
    {
        href: '/extension/tools/4',
        label: 'Marketing Automatyczny',
        boxClass: 'automatic_marketing',
        iconId: 'svg-automatic_marketing',
    },
];

const mainTiles: SettingsTile[] = [
    {
        href: '/settings/timetable/employees',
        label: 'grafiki pracy',
        boxClass: 'work_schedule',
        iconId: 'svg-work_schedule',
    },
    {
        href: '/settings/branch',
        label: 'dane salonu',
        boxClass: 'salon',
        iconId: 'svg-salon',
    },
    {
        href: '/settings/calendar',
        label: 'godziny otwarcia',
        boxClass: 'opening_hours_clock',
        iconId: 'svg-opening_hours_clock',
    },
    {
        href: '/calendar',
        label: 'kalendarz',
        boxClass: 'calendar',
        iconId: 'svg-calendar',
    },
    {
        href: '/employees',
        label: 'pracownicy',
        boxClass: 'employees',
        iconId: 'svg-employees',
    },
    {
        href: '/customers',
        label: 'klienci',
        boxClass: 'customers',
        iconId: 'svg-customers',
    },
    {
        href: '/communication',
        label: 'rezerwacja online',
        boxClass: 'booking',
        iconId: 'svg-booking',
    },
    {
        href: '/reviews',
        label: 'komentarze',
        boxClass: 'settings_opinions',
        iconId: 'svg-settings_opinions',
    },
    {
        href: '/communication',
        label: 'łączność',
        boxClass: 'communication',
        iconId: 'svg-communication',
    },
    {
        href: '/communication',
        label: 'komunikacja z klientem',
        boxClass: 'client_communication',
        iconId: 'svg-client_communication',
    },
    {
        href: '/communication',
        label: 'media społecznościowe',
        boxClass: 'social_media',
        iconId: 'svg-social_media',
    },
    {
        href: '/invoices',
        label: 'faktury i abonament',
        boxClass: 'billing',
        iconId: 'svg-billing',
    },
    {
        href: '/statistics',
        label: 'płatności',
        boxClass: 'prepayments',
        iconId: 'svg-prepayments',
    },
    {
        href: '/extension',
        label: 'Premium',
        boxClass: 'moment_power',
        iconId: 'svg-moment_power',
    },
    {
        href: '/settings',
        label: 'inne ustawienia',
        boxClass: 'extra_settings',
        iconId: 'svg-extra_settings',
    },
];

export default function SettingsPage() {
    const { role } = useAuth();

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.body.classList.add('settings-dashboard-landing');
        document.body.classList.add('no_sidenav');
        return () => {
            document.body.classList.remove('settings-dashboard-landing');
            document.body.classList.remove('no_sidenav');
        };
    }, []);

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonBWShell role={role}>
                <div data-testid="settings-page">
                    <div className="breadcrumbs" e2e-breadcrumbs="">
                        <ul>
                            <li>
                                <div
                                    className="icon sprite-breadcrumbs_settings"
                                    aria-hidden="true"
                                />
                                Ustawienia
                            </li>
                        </ul>
                    </div>

                    <div className="inner settings-dashboard-inner">
                        {mainTiles.map((tile) => (
                            <div
                                key={tile.label}
                                className={`setting-box ${tile.boxClass}`}
                            >
                                <Link href={tile.href}>
                                    <div className="ico-container">
                                        <svg
                                            className={tile.iconId}
                                            aria-hidden="true"
                                        >
                                            <use
                                                xlinkHref={`${SETTINGS_ICON_SPRITE}#${tile.iconId}`}
                                            />
                                        </svg>
                                    </div>
                                    {tile.label}
                                </Link>
                            </div>
                        ))}
                    </div>

                    <div className="breadcrumbs">
                        <ul>
                            <li>
                                <div
                                    className="icon sprite-extension_star_black settings-addon-title-icon"
                                    aria-hidden="true"
                                />
                                Ustawienia dodatków
                            </li>
                        </ul>
                    </div>
                    <div className="inner settings-dashboard-inner settings-dashboard-inner--addons">
                        {addonTiles.map((tile) => (
                            <div
                                key={tile.label}
                                className={`setting-box ${tile.boxClass}`}
                            >
                                <Link href={tile.href}>
                                    <div className="ico-container">
                                        <svg
                                            className={tile.iconId}
                                            aria-hidden="true"
                                        >
                                            <use
                                                xlinkHref={`${SETTINGS_ICON_SPRITE}#${tile.iconId}`}
                                            />
                                        </svg>
                                    </div>
                                    {tile.label}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </SalonBWShell>
        </RouteGuard>
    );
}
