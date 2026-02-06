'use client';

import { Customer } from '@/types';

interface Props {
    customer: Customer;
    onUpdate?: (data: Partial<Customer>) => Promise<void> | void;
}

export default function CustomerConsentsTab({ customer, onUpdate }: Props) {
    const handleConsentChange = (field: keyof Customer, value: boolean) => {
        if (onUpdate) {
            const updateData: Partial<Customer> = { [field]: value };

            // If enabling GDPR consent, also set the consent date
            if (field === 'gdprConsent' && value) {
                updateData.gdprConsentDate = new Date().toISOString();
            }

            void onUpdate(updateData);
        }
    };

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="row">
            <div className="col-sm-12">
                <div className="versum-widget">
                    <div className="versum-widget__header">
                        <span>Zgody i preferencje</span>
                    </div>
                    <div className="versum-widget__content">
                        {/* GDPR Consent */}
                        <div className="versum-panel-sub">
                            <div className="row">
                                <div className="col-sm-1">
                                    <input
                                        id="consent-gdpr"
                                        type="checkbox"
                                        className="versum-checkbox-large"
                                        checked={customer.gdprConsent}
                                        onChange={(e) =>
                                            handleConsentChange(
                                                'gdprConsent',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                </div>
                                <div className="col-sm-11">
                                    <label
                                        htmlFor="consent-gdpr"
                                        className="versum-panel-sub__title block"
                                    >
                                        Ochrona danych osobowych (RODO)
                                    </label>
                                    <p className="versum-panel-sub__description">
                                        Wyrażam zgodę na przetwarzanie danych
                                        osobowych w celach związanych z
                                        realizacją usług salonu zgodnie z RODO.
                                    </p>
                                    {customer.gdprConsentDate && (
                                        <div className="versum-panel-sub__meta">
                                            Data wyrażenia zgody:{' '}
                                            {formatDate(
                                                customer.gdprConsentDate,
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Marketing Consents */}
                        <div className="versum-panel-sub">
                            <div className="row mb-15">
                                <div className="col-sm-1">
                                    <input
                                        id="consent-sms"
                                        type="checkbox"
                                        className="versum-checkbox-large"
                                        checked={customer.smsConsent}
                                        onChange={(e) =>
                                            handleConsentChange(
                                                'smsConsent',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                </div>
                                <div className="col-sm-11">
                                    <label
                                        htmlFor="consent-sms"
                                        className="versum-panel-sub__title block"
                                    >
                                        Zgoda na powiadomienia SMS
                                    </label>
                                    <p className="versum-panel-sub__description">
                                        Wyrażam zgodę na otrzymywanie wiadomości
                                        SMS z przypomnieniami o wizytach oraz
                                        ofertami promocyjnymi.
                                    </p>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-1">
                                    <input
                                        id="consent-email"
                                        type="checkbox"
                                        className="versum-checkbox-large"
                                        checked={customer.emailConsent}
                                        onChange={(e) =>
                                            handleConsentChange(
                                                'emailConsent',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                </div>
                                <div className="col-sm-11">
                                    <label
                                        htmlFor="consent-email"
                                        className="versum-panel-sub__title block"
                                    >
                                        Zgoda na newsletter e-mail
                                    </label>
                                    <p className="versum-panel-sub__description">
                                        Wyrażam zgodę na otrzymywanie wiadomości
                                        e-mail z informacjami o nowościach,
                                        promocjach i newsletterach.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Privacy Information Alert */}
                        <div className="versum-alert versum-alert-info">
                            <div className="bold mb-5">
                                Informacja o przetwarzaniu danych
                            </div>
                            <p className="m-0">
                                Administratorem danych osobowych jest właściciel
                                salonu. Dane przetwarzane są w celu realizacji
                                usług oraz, za zgodą, w celach marketingowych.
                                Klient ma prawo do: dostępu do swoich danych,
                                ich sprostowania, usunięcia, ograniczenia
                                przetwarzania, przenoszenia oraz wniesienia
                                sprzeciwu wobec przetwarzania.
                            </p>
                        </div>

                        {/* History Table */}
                        <div className="mt-30">
                            <div className="versum-section-title">
                                Historia zmian zgód
                            </div>
                            <table className="versum-table fz-12">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Zgoda</th>
                                        <th>Zmiana</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customer.gdprConsentDate ? (
                                        <tr>
                                            <td>
                                                {formatDate(
                                                    customer.gdprConsentDate,
                                                )}
                                            </td>
                                            <td>RODO</td>
                                            <td>
                                                <span className="success bold">
                                                    Wyrażono zgodę
                                                </span>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="text-center text-muted"
                                            >
                                                Brak zapisanej historii
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
