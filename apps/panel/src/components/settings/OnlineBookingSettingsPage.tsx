import { useEffect, useState } from 'react';
import SettingsDetailLayout from '@/components/settings/SettingsDetailLayout';
import {
    useOnlineBookingSettings,
    useSettingsMutations,
} from '@/hooks/useSettings';
import type { UpdateOnlineBookingSettingsRequest } from '@/types';

const NAV_ITEMS = [
    {
        label: 'Rezerwacja online',
        iconClass: 'sprite-settings_calendar',
        href: '/settings/online-booking',
        active: true,
    },
    {
        label: 'Widoczność usług',
        iconClass: 'sprite-settings_services',
    },
    {
        label: 'Widget',
        iconClass: 'sprite-settings_cut_logo',
    },
] as const;

export default function OnlineBookingSettingsPage() {
    const { data, isLoading, error, refetch } = useOnlineBookingSettings();
    const { updateOnlineBookingSettings } = useSettingsMutations();

    const [notice, setNotice] = useState<{
        msg: string;
        ok: boolean;
    } | null>(null);
    const [saving, setSaving] = useState(false);

    const [isEnabled, setIsEnabled] = useState(true);
    const [requireAccount, setRequireAccount] = useState(true);
    const [requirePhone, setRequirePhone] = useState(true);
    const [requireEmail, setRequireEmail] = useState(true);
    const [requireConfirmation, setRequireConfirmation] = useState(true);
    const [autoConfirm, setAutoConfirm] = useState(false);
    const [sendConfirmationEmail, setSendConfirmationEmail] = useState(true);
    const [sendConfirmationSms, setSendConfirmationSms] = useState(false);
    const [allowEmployeeSelection, setAllowEmployeeSelection] = useState(true);
    const [showEmployeePhotosOnline, setShowEmployeePhotosOnline] =
        useState(true);
    const [autoAssignEmployee, setAutoAssignEmployee] = useState(false);
    const [showPrices, setShowPrices] = useState(true);
    const [showDuration, setShowDuration] = useState(true);
    const [allowMultipleServices, setAllowMultipleServices] = useState(true);
    const [maxServicesPerBooking, setMaxServicesPerBooking] = useState(5);
    const [onlineSlotDuration, setOnlineSlotDuration] = useState(30);
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [showCancellationPolicy, setShowCancellationPolicy] = useState(true);
    const [cancellationPolicyText, setCancellationPolicyText] = useState('');

    useEffect(() => {
        if (!data) return;
        setIsEnabled(data.isEnabled);
        setRequireAccount(data.requireAccount);
        setRequirePhone(data.requirePhone);
        setRequireEmail(data.requireEmail);
        setRequireConfirmation(data.requireConfirmation);
        setAutoConfirm(data.autoConfirm);
        setSendConfirmationEmail(data.sendConfirmationEmail);
        setSendConfirmationSms(data.sendConfirmationSms);
        setAllowEmployeeSelection(data.allowEmployeeSelection);
        setShowEmployeePhotosOnline(data.showEmployeePhotosOnline);
        setAutoAssignEmployee(data.autoAssignEmployee);
        setShowPrices(data.showPrices);
        setShowDuration(data.showDuration);
        setAllowMultipleServices(data.allowMultipleServices);
        setMaxServicesPerBooking(data.maxServicesPerBooking);
        setOnlineSlotDuration(data.onlineSlotDuration);
        setWelcomeMessage(data.welcomeMessage ?? '');
        setConfirmationMessage(data.confirmationMessage ?? '');
        setShowCancellationPolicy(data.showCancellationPolicy);
        setCancellationPolicyText(data.cancellationPolicyText ?? '');
    }, [data]);

    const save = async (
        partial?: Partial<UpdateOnlineBookingSettingsRequest>,
    ) => {
        setSaving(true);
        setNotice(null);
        const payload: UpdateOnlineBookingSettingsRequest = partial ?? {
            isEnabled,
            requireAccount,
            requirePhone,
            requireEmail,
            requireConfirmation,
            autoConfirm,
            sendConfirmationEmail,
            sendConfirmationSms,
            allowEmployeeSelection,
            showEmployeePhotosOnline,
            autoAssignEmployee,
            showPrices,
            showDuration,
            allowMultipleServices,
            maxServicesPerBooking,
            onlineSlotDuration,
            welcomeMessage: welcomeMessage || undefined,
            confirmationMessage: confirmationMessage || undefined,
            showCancellationPolicy,
            cancellationPolicyText: cancellationPolicyText || undefined,
        };
        try {
            await updateOnlineBookingSettings.mutateAsync(payload);
            setNotice({ msg: 'Ustawienia zostały zapisane.', ok: true });
        } catch {
            setNotice({
                msg: 'Nie udało się zapisać ustawień.',
                ok: false,
            });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <SettingsDetailLayout
                sectionTitle="Rezerwacja online"
                breadcrumbLabel="Rezerwacja online"
                navItems={[...NAV_ITEMS]}
            >
                <div className="settings-detail-state">
                    Ładowanie ustawień...
                </div>
            </SettingsDetailLayout>
        );
    }

    if (error || !data) {
        return (
            <SettingsDetailLayout
                sectionTitle="Rezerwacja online"
                breadcrumbLabel="Rezerwacja online"
                navItems={[...NAV_ITEMS]}
            >
                <div className="settings-detail-state settings-detail-state--error">
                    <div>Nie udało się pobrać ustawień rezerwacji online.</div>
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm mt-2"
                        onClick={() => void refetch()}
                    >
                        odśwież
                    </button>
                </div>
            </SettingsDetailLayout>
        );
    }

    return (
        <SettingsDetailLayout
            sectionTitle="Rezerwacja online"
            breadcrumbLabel="Rezerwacja online"
            navItems={[...NAV_ITEMS]}
        >
            <div className="online-booking-settings">
                {/* --- Ogólne --- */}
                <section className="online-booking-settings__section">
                    <h3 className="online-booking-settings__section-title">
                        Ogólne
                    </h3>
                    <label className="online-booking-settings__toggle">
                        <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => {
                                setIsEnabled(e.target.checked);
                                void save({ isEnabled: e.target.checked });
                            }}
                        />
                        <span>
                            Rezerwacja online aktywna
                            <span className="online-booking-settings__badge">
                                {isEnabled ? 'włączona' : 'wyłączona'}
                            </span>
                        </span>
                    </label>
                    <p className="online-booking-settings__hint">
                        Gdy wyłączona, klienci nie mogą rezerwować wizyt przez
                        internet.
                    </p>
                </section>

                {/* --- Wymagania dla klienta --- */}
                <section className="online-booking-settings__section">
                    <h3 className="online-booking-settings__section-title">
                        Wymagania dla klienta
                    </h3>
                    <label className="online-booking-settings__toggle">
                        <input
                            type="checkbox"
                            checked={requireAccount}
                            disabled={!isEnabled}
                            onChange={(e) =>
                                setRequireAccount(e.target.checked)
                            }
                        />
                        <span>Wymagaj rejestracji / logowania</span>
                    </label>
                    <label className="online-booking-settings__toggle">
                        <input
                            type="checkbox"
                            checked={requirePhone}
                            disabled={!isEnabled}
                            onChange={(e) => setRequirePhone(e.target.checked)}
                        />
                        <span>Wymagaj numeru telefonu</span>
                    </label>
                    <label className="online-booking-settings__toggle">
                        <input
                            type="checkbox"
                            checked={requireEmail}
                            disabled={!isEnabled}
                            onChange={(e) => setRequireEmail(e.target.checked)}
                        />
                        <span>Wymagaj adresu e-mail</span>
                    </label>
                </section>

                {/* --- Potwierdzenie wizyty --- */}
                <section className="online-booking-settings__section">
                    <h3 className="online-booking-settings__section-title">
                        Potwierdzenie wizyty
                    </h3>
                    <label className="online-booking-settings__toggle">
                        <input
                            type="checkbox"
                            checked={requireConfirmation}
                            disabled={!isEnabled}
                            onChange={(e) => {
                                setRequireConfirmation(e.target.checked);
                                if (e.target.checked) setAutoConfirm(false);
                            }}
                        />
                        <span>
                            Rezerwacja wymaga zatwierdzenia przez salon
                            <span className="online-booking-settings__hint-inline">
                                (status: oczekuje na potwierdzenie)
                            </span>
                        </span>
                    </label>
                    <label className="online-booking-settings__toggle">
                        <input
                            type="checkbox"
                            checked={autoConfirm}
                            disabled={!isEnabled || requireConfirmation}
                            onChange={(e) => setAutoConfirm(e.target.checked)}
                        />
                        <span>
                            Auto-potwierdź rezerwację od razu
                            <span className="online-booking-settings__hint-inline">
                                (pomija etap oczekiwania)
                            </span>
                        </span>
                    </label>
                    <div className="online-booking-settings__subgroup">
                        <p className="online-booking-settings__subgroup-label">
                            Powiadomienia po potwierdzeniu
                        </p>
                        <label className="online-booking-settings__toggle">
                            <input
                                type="checkbox"
                                checked={sendConfirmationEmail}
                                disabled={!isEnabled}
                                onChange={(e) =>
                                    setSendConfirmationEmail(e.target.checked)
                                }
                            />
                            <span>Wyślij potwierdzenie e-mail</span>
                        </label>
                        <label className="online-booking-settings__toggle">
                            <input
                                type="checkbox"
                                checked={sendConfirmationSms}
                                disabled={!isEnabled}
                                onChange={(e) =>
                                    setSendConfirmationSms(e.target.checked)
                                }
                            />
                            <span>Wyślij potwierdzenie SMS</span>
                        </label>
                    </div>
                </section>

                {/* --- Pracownicy --- */}
                <section className="online-booking-settings__section">
                    <h3 className="online-booking-settings__section-title">
                        Pracownicy
                    </h3>
                    <label className="online-booking-settings__toggle">
                        <input
                            type="checkbox"
                            checked={allowEmployeeSelection}
                            disabled={!isEnabled}
                            onChange={(e) => {
                                setAllowEmployeeSelection(e.target.checked);
                                if (!e.target.checked)
                                    setAutoAssignEmployee(true);
                            }}
                        />
                        <span>Klient może wybrać pracownika</span>
                    </label>
                    <label className="online-booking-settings__toggle">
                        <input
                            type="checkbox"
                            checked={showEmployeePhotosOnline}
                            disabled={!isEnabled || !allowEmployeeSelection}
                            onChange={(e) =>
                                setShowEmployeePhotosOnline(e.target.checked)
                            }
                        />
                        <span>Pokazuj zdjęcia pracowników</span>
                    </label>
                    <label className="online-booking-settings__toggle">
                        <input
                            type="checkbox"
                            checked={autoAssignEmployee}
                            disabled={!isEnabled || allowEmployeeSelection}
                            onChange={(e) =>
                                setAutoAssignEmployee(e.target.checked)
                            }
                        />
                        <span>
                            Auto-przypisz pracownika
                            <span className="online-booking-settings__hint-inline">
                                (aktywne gdy brak wyboru pracownika)
                            </span>
                        </span>
                    </label>
                </section>

                {/* --- Usługi --- */}
                <section className="online-booking-settings__section">
                    <h3 className="online-booking-settings__section-title">
                        Wyświetlanie usług
                    </h3>
                    <label className="online-booking-settings__toggle">
                        <input
                            type="checkbox"
                            checked={showPrices}
                            disabled={!isEnabled}
                            onChange={(e) => setShowPrices(e.target.checked)}
                        />
                        <span>Pokazuj ceny usług</span>
                    </label>
                    <label className="online-booking-settings__toggle">
                        <input
                            type="checkbox"
                            checked={showDuration}
                            disabled={!isEnabled}
                            onChange={(e) => setShowDuration(e.target.checked)}
                        />
                        <span>Pokazuj czas trwania usług</span>
                    </label>
                    <label className="online-booking-settings__toggle">
                        <input
                            type="checkbox"
                            checked={allowMultipleServices}
                            disabled={!isEnabled}
                            onChange={(e) =>
                                setAllowMultipleServices(e.target.checked)
                            }
                        />
                        <span>Zezwól na rezerwację wielu usług naraz</span>
                    </label>
                    {allowMultipleServices && (
                        <div className="online-booking-settings__field">
                            <label htmlFor="max-services">
                                Maks. usług na wizytę
                            </label>
                            <input
                                id="max-services"
                                type="number"
                                min={1}
                                max={20}
                                value={maxServicesPerBooking}
                                disabled={!isEnabled}
                                onChange={(e) =>
                                    setMaxServicesPerBooking(
                                        Number(e.target.value),
                                    )
                                }
                            />
                        </div>
                    )}
                    <div className="online-booking-settings__field">
                        <label htmlFor="slot-duration">
                            Długość slotu online (min)
                        </label>
                        <select
                            id="slot-duration"
                            value={onlineSlotDuration}
                            disabled={!isEnabled}
                            onChange={(e) =>
                                setOnlineSlotDuration(Number(e.target.value))
                            }
                        >
                            {[15, 20, 30, 45, 60].map((v) => (
                                <option key={v} value={v}>
                                    {v} min
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* --- Wiadomości --- */}
                <section className="online-booking-settings__section">
                    <h3 className="online-booking-settings__section-title">
                        Wiadomości dla klientów
                    </h3>
                    <div className="online-booking-settings__field">
                        <label htmlFor="welcome-msg">
                            Wiadomość powitalna
                        </label>
                        <textarea
                            id="welcome-msg"
                            rows={3}
                            placeholder="np. Witamy w salonie SalonBW! Wybierz usługę..."
                            value={welcomeMessage}
                            disabled={!isEnabled}
                            onChange={(e) =>
                                setWelcomeMessage(e.target.value)
                            }
                        />
                    </div>
                    <div className="online-booking-settings__field">
                        <label htmlFor="confirm-msg">
                            Wiadomość potwierdzająca
                        </label>
                        <textarea
                            id="confirm-msg"
                            rows={3}
                            placeholder="np. Twoja wizyta została potwierdzona. Do zobaczenia!"
                            value={confirmationMessage}
                            disabled={!isEnabled}
                            onChange={(e) =>
                                setConfirmationMessage(e.target.value)
                            }
                        />
                    </div>
                </section>

                {/* --- Polityka anulowania --- */}
                <section className="online-booking-settings__section">
                    <h3 className="online-booking-settings__section-title">
                        Polityka anulowania
                    </h3>
                    <label className="online-booking-settings__toggle">
                        <input
                            type="checkbox"
                            checked={showCancellationPolicy}
                            disabled={!isEnabled}
                            onChange={(e) =>
                                setShowCancellationPolicy(e.target.checked)
                            }
                        />
                        <span>Pokazuj politykę anulowania przy rezerwacji</span>
                    </label>
                    {showCancellationPolicy && (
                        <div className="online-booking-settings__field">
                            <label htmlFor="cancel-policy">
                                Treść polityki anulowania
                            </label>
                            <textarea
                                id="cancel-policy"
                                rows={4}
                                placeholder="np. Wizytę możesz anulować najpóźniej 24h przed planowanym terminem..."
                                value={cancellationPolicyText}
                                disabled={!isEnabled}
                                onChange={(e) =>
                                    setCancellationPolicyText(e.target.value)
                                }
                            />
                        </div>
                    )}
                </section>

                {/* --- Akcje --- */}
                <div className="online-booking-settings__actions">
                    <button
                        type="button"
                        className="btn btn-primary"
                        disabled={saving || !isEnabled}
                        onClick={() => void save()}
                    >
                        {saving ? 'zapisywanie...' : 'zapisz ustawienia'}
                    </button>
                    {notice && (
                        <span
                            className={`online-booking-settings__notice ${notice.ok ? 'online-booking-settings__notice--ok' : 'online-booking-settings__notice--err'}`}
                            role="status"
                        >
                            {notice.msg}
                        </span>
                    )}
                </div>
            </div>
        </SettingsDetailLayout>
    );
}
