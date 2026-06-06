import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';

type SettingsTile = {
    href: string;
    label: string;
    boxClass: string;
    iconId: string;
};

type SettingsGroup = {
    heading: string;
    tiles: SettingsTile[];
};

const SETTINGS_ICON_SPRITE = '/assets/settings-dashboard-icons.svg';

const GROUPS: SettingsGroup[] = [
    {
        heading: 'Salon',
        tiles: [
            {
                href: '/settings/branch',
                label: 'dane salonu',
                boxClass: 'salon',
                iconId: 'svg-salon',
            },
            {
                href: '/settings/timetable/branch',
                label: 'godziny otwarcia',
                boxClass: 'opening_hours_clock',
                iconId: 'svg-opening_hours_clock',
            },
        ],
    },
    {
        heading: 'Pracownicy',
        tiles: [
            {
                href: '/settings/employees',
                label: 'pracownicy',
                boxClass: 'employees',
                iconId: 'svg-employees',
            },
            {
                href: '/settings/timetable/employees',
                label: 'grafiki pracy',
                boxClass: 'work_schedule',
                iconId: 'svg-work_schedule',
            },
        ],
    },
    {
        heading: 'Usługi i wizyty',
        tiles: [
            {
                href: '/settings/categories',
                label: 'kategorie usług',
                boxClass: 'extra_settings',
                iconId: 'svg-extra_settings',
            },
            {
                href: '/settings/calendar',
                label: 'kalendarz',
                boxClass: 'calendar',
                iconId: 'svg-calendar',
            },
            {
                href: '/settings/online-booking',
                label: 'rezerwacja online',
                boxClass: 'booking',
                iconId: 'svg-booking',
            },
        ],
    },
    {
        heading: 'Klienci',
        tiles: [
            {
                href: '/settings/extra-fields',
                label: 'pola klientów',
                boxClass: 'customers',
                iconId: 'svg-customers',
            },
            {
                href: '/reviews',
                label: 'komentarze',
                boxClass: 'settings_opinions',
                iconId: 'svg-settings_opinions',
            },
        ],
    },
    {
        heading: 'Komunikacja',
        tiles: [
            {
                href: '/communication/reminders',
                label: 'komunikacja z klientem',
                boxClass: 'client_communication',
                iconId: 'svg-client_communication',
            },
            {
                href: '/settings/sms',
                label: 'SMS i łączność',
                boxClass: 'communication',
                iconId: 'svg-communication',
            },
            {
                href: '/communication',
                label: 'media społecznościowe',
                boxClass: 'social_media',
                iconId: 'svg-social_media',
            },
        ],
    },
    {
        heading: 'Finanse',
        tiles: [
            {
                href: '/settings/payment-configuration',
                label: 'płatności',
                boxClass: 'prepayments',
                iconId: 'svg-prepayments',
            },
            {
                href: '/invoices',
                label: 'faktury i abonament',
                boxClass: 'billing',
                iconId: 'svg-billing',
            },
        ],
    },
    {
        heading: 'Prywatność',
        tiles: [
            {
                href: '/settings/privacy',
                label: 'prywatność i zgody',
                boxClass: 'extra_settings',
                iconId: 'svg-extra_settings',
            },
        ],
    },
];

const addonTiles: SettingsTile[] = [
    {
        href: '/extension/tools/4',
        label: 'Marketing Automatyczny',
        boxClass: 'automatic_marketing',
        iconId: 'svg-automatic_marketing',
    },
    {
        href: '/extension',
        label: 'Premium',
        boxClass: 'moment_power',
        iconId: 'svg-moment_power',
    },
    {
        href: '/settings/categories',
        label: 'kategorie usług',
        boxClass: 'extra_settings',
        iconId: 'svg-extra_settings',
    },
];

function TileGrid({ tiles }: { tiles: SettingsTile[] }) {
    return (
        <>
            {tiles.map((tile) => (
                <div key={tile.href} className={`setting-box ${tile.boxClass}`}>
                    <Link href={tile.href}>
                        <div className="ico-container">
                            <svg className={tile.iconId} aria-hidden="true">
                                <use
                                    xlinkHref={`${SETTINGS_ICON_SPRITE}#${tile.iconId}`}
                                />
                            </svg>
                        </div>
                        {tile.label}
                    </Link>
                </div>
            ))}
        </>
    );
}

export default function SettingsPage() {
    const { role } = useAuth();

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <div data-testid="settings-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[{ label: 'Ustawienia' }]}
                    />

                    {GROUPS.map((group) => (
                        <div key={group.heading}>
                            <div className="settings-dashboard-section__title">
                                {group.heading}
                            </div>
                            <div className="settings-dashboard-inner">
                                <TileGrid tiles={group.tiles} />
                            </div>
                        </div>
                    ))}

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
                    <div className="settings-dashboard-inner settings-dashboard-inner--addons">
                        <TileGrid tiles={addonTiles} />
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
