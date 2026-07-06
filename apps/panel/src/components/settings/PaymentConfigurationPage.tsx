import { useEffect, useState } from 'react';
import SettingsDetailLayout from '@/components/settings/SettingsDetailLayout';
import {
    usePaymentConfigurationSettings,
    useSettingsMutations,
} from '@/hooks/useSettings';

const paymentNavItems = [
    {
        label: 'Płatności online',
        iconClass: 'sprite-settings_product_purchase_prices',
        href: '/settings/payment-configuration',
        active: true,
    },
] as const;

const PREPAYMENT_OPTIONS = [10, 20, 30, 50, 100] as const;

export default function PaymentConfigurationPage() {
    const { data, isLoading, error, refetch } =
        usePaymentConfigurationSettings();
    const { updatePaymentConfiguration } = useSettingsMutations();
    const [notice, setNotice] = useState<string | null>(null);
    const [requirePrepayment, setRequirePrepayment] = useState(false);
    const [prepaymentPercentage, setPrepaymentPercentage] = useState(100);

    useEffect(() => {
        if (!data) return;
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
                breadcrumbLabel="Płatności online"
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
                breadcrumbLabel="Płatności online"
                navItems={[...paymentNavItems]}
            >
                <div className="settings-detail-state settings-detail-state--error">
                    <div>Nie udało się pobrać ustawień płatności.</div>
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
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
            breadcrumbLabel="Płatności online"
            navItems={[...paymentNavItems]}
        >
            <div style={{ maxWidth: 720 }}>
                <h2 className="fs-4 fw-bold mb-1">Płatności online</h2>
                <p className="text-muted">Przedpłaty przy rezerwacji online.</p>

                <div className="alert alert-warning" role="status">
                    <strong>
                        Pobieranie płatności online wymaga integracji z
                        operatorem płatności.
                    </strong>{' '}
                    Ta integracja nie jest jeszcze podłączona. Poniższe
                    ustawienia przedpłat zapisują się i zadziałają, gdy operator
                    zostanie skonfigurowany.
                </div>

                <div className="bg-white rounded-4 border shadow-sm p-4">
                    <div className="form-check form-switch mb-3">
                        <input
                            id="accept-online"
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            checked={isEnabled}
                            disabled={updatePaymentConfiguration.isPending}
                            onChange={() =>
                                void saveConfiguration({
                                    acceptOnlinePayments: !isEnabled,
                                })
                            }
                        />
                        <label
                            className="form-check-label fw-medium"
                            htmlFor="accept-online"
                        >
                            Włącz przedpłaty online
                        </label>
                    </div>

                    <div className="form-check mb-2">
                        <input
                            id="require-prepayment"
                            className="form-check-input"
                            type="checkbox"
                            checked={requirePrepayment}
                            disabled={
                                !isEnabled ||
                                updatePaymentConfiguration.isPending
                            }
                            onChange={(e) =>
                                setRequirePrepayment(e.target.checked)
                            }
                        />
                        <label
                            className="form-check-label"
                            htmlFor="require-prepayment"
                        >
                            Wymagaj przedpłaty dla rezerwacji online
                        </label>
                    </div>

                    <p className="text-muted small mb-2">
                        Część wartości wizyty, którą klient opłaca z góry:
                    </p>
                    <div className="btn-group mb-3" role="group">
                        {PREPAYMENT_OPTIONS.map((value) => (
                            <button
                                key={value}
                                type="button"
                                className={`btn btn-sm ${prepaymentPercentage === value ? 'btn-dark' : 'btn-outline-secondary'}`}
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

                    <div className="text-muted small mb-3">
                        {isEnabled && requirePrepayment
                            ? `Aktywna przedpłata: ${prepaymentPercentage}%`
                            : 'Przedpłaty są wyłączone.'}
                    </div>

                    <button
                        type="button"
                        className="btn btn-dark"
                        disabled={
                            !isEnabled || updatePaymentConfiguration.isPending
                        }
                        onClick={() =>
                            void saveConfiguration({
                                requirePrepayment,
                                prepaymentPercentage,
                            })
                        }
                    >
                        {updatePaymentConfiguration.isPending
                            ? 'zapisywanie...'
                            : 'Zapisz ustawienia'}
                    </button>
                </div>

                {notice ? (
                    <div className="alert alert-info mt-3" role="status">
                        {notice}
                    </div>
                ) : null}
            </div>
        </SettingsDetailLayout>
    );
}
