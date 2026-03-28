import { useEffect, useState } from 'react';
import SettingsDetailLayout from '@/components/settings/SettingsDetailLayout';
import PanelActionBar from '@/components/ui/PanelActionBar';
import {
    usePaymentConfigurationSettings,
    useSettingsMutations,
} from '@/hooks/useSettings';

const paymentNavItems = [
    {
        label: 'Moment Pay',
        iconClass: 'sprite-settings_product_purchase_prices',
        href: '/settings/payment-configuration',
        active: true,
    },
    {
        label: 'Przedpłaty',
        iconClass: 'sprite-settings_prepay',
    },
    {
        label: 'Napiwki',
        iconClass: 'sprite-tips',
        href: '/statistics/tips',
    },
    {
        label: 'Metody płatności',
        iconClass: 'sprite-settings_payment_methods',
    },
] as const;

const PREPAYMENT_OPTIONS = [10, 20, 30, 50, 100] as const;

export default function PaymentConfigurationPage() {
    const { data, isLoading, error, refetch } =
        usePaymentConfigurationSettings();
    const { updatePaymentConfiguration } = useSettingsMutations();
    const [learnMoreVisible, setLearnMoreVisible] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [requirePrepayment, setRequirePrepayment] = useState(false);
    const [prepaymentPercentage, setPrepaymentPercentage] = useState(100);

    useEffect(() => {
        if (!data) {
            return;
        }

        setRequirePrepayment(data.requirePrepayment);
        setPrepaymentPercentage(data.prepaymentPercentage);
    }, [data]);

    const isEnabled = data?.acceptOnlinePayments ?? false;

    const saveConfiguration = async (payload: {
        acceptOnlinePayments?: boolean;
        requirePrepayment?: boolean;
        prepaymentPercentage?: number;
    }) => {
        setNotice(null);

        try {
            await updatePaymentConfiguration.mutateAsync(payload);
            setNotice('Ustawienia płatności zostały zapisane.');
        } catch {
            setNotice('Nie udało się zapisać ustawień płatności.');
        }
    };

    if (isLoading) {
        return (
            <SettingsDetailLayout
                sectionTitle="Płatności"
                breadcrumbLabel="Moment Pay"
                navItems={[...paymentNavItems]}
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
                sectionTitle="Płatności"
                breadcrumbLabel="Moment Pay"
                navItems={[...paymentNavItems]}
            >
                <div className="settings-detail-state settings-detail-state--error">
                    <div>Nie udało się pobrać ustawień płatności.</div>
                    <button
                        type="button"
                        className="btn btn-default"
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
            sectionTitle="Płatności"
            breadcrumbLabel="Moment Pay"
            navItems={[...paymentNavItems]}
        >
            <div className="settings-payment-page">
                <PanelActionBar
                    className="mt-0 border-top-0 pt-0"
                    primary={
                        <button
                            type="button"
                            className={`btn ${isEnabled ? 'btn-default' : 'btn-primary'}`}
                            disabled={updatePaymentConfiguration.isPending}
                            onClick={() =>
                                void saveConfiguration({
                                    acceptOnlinePayments: !isEnabled,
                                })
                            }
                        >
                            {updatePaymentConfiguration.isPending
                                ? 'zapisywanie...'
                                : isEnabled
                                  ? 'wyłącz Moment Pay'
                                  : 'aktywuj Moment Pay'}
                        </button>
                    }
                />

                <section
                    className="settings-payment-page__blank d-flex flex-column align-items-center"
                    aria-label="Moment Pay activation"
                >
                    <div
                        className="settings-payment-page__art d-flex align-items-center justify-content-center"
                        aria-hidden="true"
                    >
                        <div className="settings-payment-page__art-shadow" />
                        <div className="settings-payment-page__art-badge">
                            m
                        </div>
                    </div>

                    <h2 className="settings-payment-page__title text-center">
                        Moment Pay
                    </h2>

                    <p className="settings-payment-page__description text-center">
                        Aktywuj system płatności online Moment Pay, aby
                        zmniejszyć ilość zapomnianych wizyt i usprawnić proces
                        rezerwacji usług. Dzięki niemu zyskasz możliwość
                        przyjmowania przedpłat w procesie rezerwacji przez
                        portal Moment.pl, a także umożliwisz klientom opłacenie
                        przedpłat dla wizyt dodanych przez Ciebie w kalendarzu,
                        w dogodnym dla nich czasie i miejscu. Co więcej, Moment
                        Pay pozwoli Ci zaoferować klientom dodatkowe metody
                        płatności, a co za tym idzie, zwiększyć ich komfort.
                    </p>

                    <button
                        type="button"
                        className="settings-payment-page__learn-more"
                        onClick={() =>
                            setLearnMoreVisible((current) => !current)
                        }
                    >
                        Dowiedz się więcej
                    </button>
                </section>

                <div
                    className={`settings-payment-page__notice ${isEnabled ? 'settings-payment-page__notice--success' : ''}`}
                    role="status"
                >
                    {isEnabled
                        ? 'Moment Pay jest aktywny i zapisuje ustawienia przez backend salonbw.'
                        : 'Moment Pay jest obecnie wyłączony.'}
                </div>

                {learnMoreVisible ? (
                    <div
                        className="settings-payment-page__notice"
                        role="status"
                    >
                        Aktywacja wykorzystuje istniejący backendowy endpoint
                        ustawień płatności. Po włączeniu możesz od razu zapisać
                        ustawienia przedpłat poniżej.
                    </div>
                ) : null}

                <section className="settings-payment-page__card">
                    <div className="settings-payment-page__card-title">
                        Ustawienia przedpłat
                    </div>
                    <label className="settings-payment-page__toggle">
                        <input
                            type="checkbox"
                            checked={requirePrepayment}
                            disabled={
                                !isEnabled ||
                                updatePaymentConfiguration.isPending
                            }
                            onChange={(event) =>
                                setRequirePrepayment(event.target.checked)
                            }
                        />
                        <span>Wymagaj przedpłaty dla rezerwacji online</span>
                    </label>

                    <div className="settings-payment-page__subcopy">
                        Wybierz część wartości wizyty, którą klient ma opłacić z
                        góry.
                    </div>

                    <div className="settings-payment-page__percentages">
                        {PREPAYMENT_OPTIONS.map((value) => (
                            <button
                                key={value}
                                type="button"
                                className={`settings-payment-page__percentage ${prepaymentPercentage === value ? 'settings-payment-page__percentage--active' : ''}`}
                                disabled={
                                    !isEnabled ||
                                    !requirePrepayment ||
                                    updatePaymentConfiguration.isPending
                                }
                                onClick={() => setPrepaymentPercentage(value)}
                            >
                                {value}%
                            </button>
                        ))}
                    </div>

                    <div className="settings-payment-page__summary">
                        {isEnabled && requirePrepayment
                            ? `Aktywna przedpłata: ${prepaymentPercentage}%`
                            : 'Przedpłaty są wyłączone.'}
                    </div>

                    <div className="settings-payment-page__actions">
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={
                                !isEnabled ||
                                updatePaymentConfiguration.isPending
                            }
                            onClick={() =>
                                void saveConfiguration({
                                    requirePrepayment,
                                    prepaymentPercentage,
                                })
                            }
                        >
                            zapisz ustawienia
                        </button>
                    </div>
                </section>

                {notice ? (
                    <div
                        className="settings-payment-page__notice"
                        role="status"
                    >
                        {notice}
                    </div>
                ) : null}
            </div>
        </SettingsDetailLayout>
    );
}
