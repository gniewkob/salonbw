import { useState } from 'react';
import Link from 'next/link';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useReminderSettings, useSettingsMutations } from '@/hooks/useSettings';

const REMINDERS_NAV = (
    <div className="sidenav secondarynav" id="sidenav">
        <div className="column_row tree communication_settings">
            <h4>Komunikacja z klientem</h4>
            <ul>
                <li className="nav-header-item">
                    <span className="nav-section-label">PRZYPOMNIENIA</span>
                </li>
                <li>
                    <Link href="/settings/reminders" className="active">
                        <div className="icon_box">
                            <span className="icon sprite-settings_notifications_nav" />
                        </div>
                        Przypomnienie o wizycie
                    </Link>
                </li>
                <li className="nav-header-item">
                    <span className="nav-section-label">REZERWACJE</span>
                </li>
                <li>
                    <span className="settings-detail-layout__nav-disabled">
                        <div className="icon_box">
                            <span className="icon sprite-settings_sms_nav" />
                        </div>
                        Nowa rezerwacja
                    </span>
                </li>
                <li>
                    <span className="settings-detail-layout__nav-disabled">
                        <div className="icon_box">
                            <span className="icon sprite-settings_sms_nav" />
                        </div>
                        Edycja rezerwacji
                    </span>
                </li>
                <li className="nav-header-item">
                    <span className="nav-section-label">ŻYCZENIA</span>
                </li>
                <li>
                    <span className="settings-detail-layout__nav-disabled">
                        <div className="icon_box">
                            <span className="icon sprite-settings_sms_nav" />
                        </div>
                        Życzenia urodzinowe
                    </span>
                </li>
                <li>
                    <span className="settings-detail-layout__nav-disabled">
                        <div className="icon_box">
                            <span className="icon sprite-settings_sms_nav" />
                        </div>
                        Życzenia imieninowe
                    </span>
                </li>
            </ul>
        </div>
        <div className="column_row tree communication_settings">
            <h4>Ustawienia łączności</h4>
            <ul>
                <li>
                    <Link href="/settings/sms">
                        <div className="icon_box">
                            <span className="icon sprite-settings_sms_nav" />
                        </div>
                        Wiadomości SMS
                    </Link>
                </li>
            </ul>
        </div>
    </div>
);

function timingLabel(hours: number): string {
    if (hours === 24) return 'Jeden dzień przed wizytą';
    if (hours === 48) return 'Dwa dni przed wizytą';
    if (hours === 2) return 'Dwie godziny przed wizytą';
    if (hours === 1) return 'Jedną godzinę przed wizytą';
    if (hours < 24) return `${hours} godzin przed wizytą`;
    return `${Math.round(hours / 24)} dni przed wizytą`;
}

function channelLabel(channel: string): string {
    if (channel === 'sms') return 'preferuj wiadomość SMS';
    if (channel === 'email') return 'preferuj e-mail';
    return 'SMS i e-mail';
}

export default function EventRemindersPage() {
    useSetSecondaryNav(REMINDERS_NAV);

    const { data: settings, isLoading } = useReminderSettings();
    const { updateReminderSettings } = useSettingsMutations();
    const [howItWorksOpen, setHowItWorksOpen] = useState(false);
    const [toggling, setToggling] = useState(false);

    const handleToggleActive = async () => {
        if (!settings || toggling) return;
        setToggling(true);
        try {
            await updateReminderSettings.mutateAsync({
                active: !settings.active,
            });
        } finally {
            setToggling(false);
        }
    };

    if (isLoading) {
        return (
            <div className="event-reminders-page">
                <div className="breadcrumbs" e2e-breadcrumbs="">
                    <ul>
                        <li>
                            <div className="icon sprite-breadcrumbs_settings" />
                            <Link href="/settings">Ustawienia</Link>
                        </li>
                        <li>
                            <span> / </span>
                            Komunikacja z klientem
                        </li>
                        <li>
                            <span> / </span>
                            Przypomnienie o wizycie
                        </li>
                    </ul>
                </div>
                <div className="inner">
                    <p>Ładowanie...</p>
                </div>
            </div>
        );
    }

    const smsPreview =
        settings?.smsTemplate ??
        'Salon przypomina o wizycie jutro. W razie pytań prosimy o kontakt.';

    const emailSubject = settings?.emailSubject ?? 'Przypomnienie o wizycie';

    return (
        <div className="event-reminders-page">
            <div className="breadcrumbs" e2e-breadcrumbs="">
                <ul>
                    <li>
                        <div className="icon sprite-breadcrumbs_settings" />
                        <Link href="/settings">Ustawienia</Link>
                    </li>
                    <li>
                        <span> / </span>
                        Komunikacja z klientem
                    </li>
                    <li>
                        <span> / </span>
                        Przypomnienie o wizycie
                    </li>
                </ul>
            </div>

            <div className="inner edit_branch_form">
                <div className="actions">
                    <div className="btn-group pull-right">
                        <button
                            type="button"
                            className="btn btn-default dropdown-toggle"
                            data-toggle="dropdown"
                        >
                            więcej <span className="caret" />
                        </button>
                        <ul className="dropdown-menu pull-right">
                            <li>
                                <Link href="/settings/sms">
                                    Szablony przypomnień
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <button
                        type="button"
                        className="btn button-blue pull-right"
                        style={{ marginRight: '8px' }}
                        onClick={() => {
                            /* edit modal placeholder */
                        }}
                    >
                        edytuj przypomnienie
                    </button>
                </div>

                <h2>Przypomnienie o wizycie</h2>

                <div className="visit_reminder">
                    <div className="reminder-status-row">
                        <span
                            className={`tag ${settings?.active ? 'tag-success' : 'tag-default'}`}
                        >
                            {settings?.active ? 'Aktywny' : 'Nieaktywny'}
                        </span>
                        <button
                            type="button"
                            className="btn-link reminder-toggle-link"
                            onClick={() => void handleToggleActive()}
                            disabled={toggling}
                        >
                            {settings?.active ? 'wyłącz' : 'włącz'}
                        </button>
                    </div>

                    <dl className="dl-horizontal reminder-details">
                        <dt>Czas wysyłki</dt>
                        <dd>{timingLabel(settings?.timingHours ?? 24)}</dd>
                        <dt>Wyślij jako</dt>
                        <dd>
                            {channelLabel(settings?.preferredChannel ?? 'sms')}
                            <span
                                className="icon sprite-tooltip_i reminder-channel-tooltip"
                                title="Jeśli klient podał numer telefonu, wysyłamy SMS. W przeciwnym razie e-mail."
                            />
                        </dd>
                    </dl>
                </div>

                <h2>Podgląd wiadomości</h2>

                <div className="reminder-preview-section">
                    <div className="reminder-preview-label">
                        <span className="icon sprite-sms_icon" />
                        SMS{' '}
                        {(settings?.preferredChannel ?? 'sms') !== 'email' && (
                            <span className="tag tag-info reminder-preferred-tag">
                                preferowany
                            </span>
                        )}
                    </div>
                    <div className="reminder-preview-sms">{smsPreview}</div>
                </div>

                <div className="reminder-preview-section">
                    <div className="reminder-preview-label">
                        <span className="icon sprite-email_icon" />
                        E-mail{' '}
                        {settings?.preferredChannel === 'email' && (
                            <span className="tag tag-info reminder-preferred-tag">
                                preferowany
                            </span>
                        )}
                    </div>
                    <div className="reminder-preview-email">
                        <div className="reminder-preview-email__subject">
                            Temat: {emailSubject}
                        </div>
                        <div className="reminder-preview-email__body">
                            {settings?.emailTemplate ?? (
                                <>
                                    <p>
                                        Przypominamy o wizycie zaplanowanej na
                                        jutro.
                                    </p>
                                    <p>
                                        W razie konieczności odwołania wizyty
                                        prosimy o wcześniejszy kontakt.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="reminder-how-it-works">
                    <button
                        type="button"
                        className="btn btn-default"
                        onClick={() => setHowItWorksOpen((v) => !v)}
                    >
                        Jak to działa?{' '}
                        <span
                            className={`caret ${howItWorksOpen ? 'caret-up' : ''}`}
                        />
                    </button>
                    {howItWorksOpen && (
                        <div className="reminder-how-it-works__content">
                            <p>
                                System automatycznie wysyła wiadomość do
                                klientów przed zaplanowaną wizytą. Przypomnienia
                                zmniejszają liczbę nieobecności nawet o 70%.
                            </p>
                            <ul>
                                <li>
                                    Wiadomość jest wysyłana automatycznie w
                                    ustalonym czasie przed wizytą.
                                </li>
                                <li>
                                    Jeśli klient podał numer telefonu, otrzyma
                                    SMS. W przeciwnym razie zostanie wysłany
                                    e-mail.
                                </li>
                                <li>
                                    Możesz edytować treść wiadomości i czas
                                    wysyłki.
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
