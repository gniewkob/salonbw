import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useReminderSettings, useSettingsMutations } from '@/hooks/useSettings';
import PanelSection from '@/components/ui/PanelSection';
import type { ReminderChannel, UpdateReminderSettingsRequest } from '@/types';

type ReminderDraft = Required<UpdateReminderSettingsRequest> & {
    preferredChannel: ReminderChannel;
};

const REMINDERS_NAV = (
    <div className="sidenav" id="sidenav">
        <div className="column_row tree communication_settings">
            <h4>Komunikacja z klientem</h4>
            <ul>
                <li className="nav-header-item">
                    <span className="nav-section-label">PRZYPOMNIENIA</span>
                </li>
                <li>
                    <Link href="/event-reminders" className="active">
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
    const router = useRouter();
    useSetSecondaryNav(REMINDERS_NAV);

    const { data: settings, isLoading } = useReminderSettings();
    const { updateReminderSettings } = useSettingsMutations();
    const [howItWorksOpen, setHowItWorksOpen] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [draft, setDraft] = useState<ReminderDraft>({
        active: true,
        timingHours: 24,
        preferredChannel: 'sms',
        smsTemplate: '',
        emailSubject: '',
        emailTemplate: '',
    });

    const isEditing = router.query.edit === '1';

    useEffect(() => {
        if (!settings) return;
        setDraft({
            active: settings.active,
            timingHours: settings.timingHours,
            preferredChannel: settings.preferredChannel,
            smsTemplate: settings.smsTemplate ?? '',
            emailSubject: settings.emailSubject ?? '',
            emailTemplate: settings.emailTemplate ?? '',
        });
    }, [settings]);

    const openEdit = async () => {
        await router.replace(
            {
                pathname: '/event-reminders',
                query: { edit: '1' },
            },
            undefined,
            { shallow: true },
        );
    };

    const closeEdit = async () => {
        await router.replace('/event-reminders', undefined, { shallow: true });
    };

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

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await updateReminderSettings.mutateAsync(draft);
        await closeEdit();
    };

    if (isLoading) {
        return (
            <div className="event-reminders-page">
                <SalonBreadcrumbs
                    iconClass="sprite-breadcrumbs_settings"
                    items={[
                        { label: 'Ustawienia', href: '/settings' },
                        { label: 'Komunikacja z klientem' },
                        { label: 'Przypomnienie o wizycie' },
                    ]}
                />
                <p>Ładowanie...</p>
            </div>
        );
    }

    const previewSettings = isEditing ? draft : settings;
    const smsPreview =
        previewSettings?.smsTemplate ||
        'Salon przypomina o wizycie jutro. W razie pytań prosimy o kontakt.';

    const emailSubject =
        previewSettings?.emailSubject ?? 'Przypomnienie o wizycie';

    return (
        <div className="event-reminders-page">
            <SalonBreadcrumbs
                iconClass="sprite-breadcrumbs_settings"
                items={[
                    { label: 'Ustawienia', href: '/settings' },
                    { label: 'Komunikacja z klientem' },
                    { label: 'Przypomnienie o wizycie' },
                ]}
            />

            <PanelSection>
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
                                <span className="settings-detail-layout__nav-disabled">
                                    Szablony przypomnień
                                </span>
                            </li>
                        </ul>
                    </div>
                    <button
                        type="button"
                        className="btn button-blue pull-right"
                        style={{ marginRight: '8px' }}
                        onClick={() => void openEdit()}
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

                {isEditing && (
                    <form
                        className="well"
                        onSubmit={(event) => void handleSave(event)}
                    >
                        <h3>Edytuj przypomnienie</h3>
                        <div className="form-group">
                            <label className="control-label">Status</label>
                            <div>
                                <label className="radio-inline">
                                    <input
                                        type="radio"
                                        name="reminder-status"
                                        checked={draft.active}
                                        onChange={() =>
                                            setDraft((current) => ({
                                                ...current,
                                                active: true,
                                            }))
                                        }
                                    />{' '}
                                    Aktywny
                                </label>
                                <label className="radio-inline">
                                    <input
                                        type="radio"
                                        name="reminder-status"
                                        checked={!draft.active}
                                        onChange={() =>
                                            setDraft((current) => ({
                                                ...current,
                                                active: false,
                                            }))
                                        }
                                    />{' '}
                                    Nieaktywny
                                </label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label
                                htmlFor="timingHours"
                                className="control-label"
                            >
                                Czas wysyłki
                            </label>
                            <select
                                id="timingHours"
                                className="form-control"
                                value={draft.timingHours}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        timingHours: Number(event.target.value),
                                    }))
                                }
                            >
                                <option value={1}>
                                    Jedną godzinę przed wizytą
                                </option>
                                <option value={2}>
                                    Dwie godziny przed wizytą
                                </option>
                                <option value={24}>
                                    Jeden dzień przed wizytą
                                </option>
                                <option value={48}>Dwa dni przed wizytą</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label
                                htmlFor="preferredChannel"
                                className="control-label"
                            >
                                Preferowany kanał
                            </label>
                            <select
                                id="preferredChannel"
                                className="form-control"
                                value={draft.preferredChannel}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        preferredChannel: event.target
                                            .value as typeof current.preferredChannel,
                                    }))
                                }
                            >
                                <option value="sms">
                                    preferuj wiadomość SMS
                                </option>
                                <option value="email">preferuj e-mail</option>
                                <option value="both">SMS i e-mail</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label
                                htmlFor="smsTemplate"
                                className="control-label"
                            >
                                Treść SMS
                            </label>
                            <textarea
                                id="smsTemplate"
                                className="form-control"
                                rows={3}
                                value={draft.smsTemplate}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        smsTemplate: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="form-group">
                            <label
                                htmlFor="emailSubject"
                                className="control-label"
                            >
                                Temat e-maila
                            </label>
                            <input
                                id="emailSubject"
                                type="text"
                                className="form-control"
                                value={draft.emailSubject}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        emailSubject: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="form-group">
                            <label
                                htmlFor="emailTemplate"
                                className="control-label"
                            >
                                Treść e-maila
                            </label>
                            <textarea
                                id="emailTemplate"
                                className="form-control"
                                rows={6}
                                value={draft.emailTemplate}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        emailTemplate: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="form-group">
                            <button
                                type="submit"
                                className="btn button-blue"
                                disabled={updateReminderSettings.isPending}
                            >
                                {updateReminderSettings.isPending
                                    ? 'Zapisywanie...'
                                    : 'zapisz ustawienia'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-default"
                                style={{ marginLeft: '8px' }}
                                onClick={() => void closeEdit()}
                                disabled={updateReminderSettings.isPending}
                            >
                                anuluj
                            </button>
                        </div>
                    </form>
                )}

                <h2>Podgląd wiadomości</h2>

                <div className="reminder-preview-section">
                    <div className="reminder-preview-label">
                        <span className="icon sprite-sms_icon" />
                        SMS{' '}
                        {(previewSettings?.preferredChannel ?? 'sms') !==
                            'email' && (
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
                        {previewSettings?.preferredChannel === 'email' && (
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
                            {previewSettings?.emailTemplate ? (
                                previewSettings.emailTemplate
                            ) : (
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
            </PanelSection>
        </div>
    );
}
