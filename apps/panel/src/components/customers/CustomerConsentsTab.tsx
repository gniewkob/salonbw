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
                        <div
                            className="versum-panel-sub"
                            style={{ marginBottom: '20px', padding: '15px' }}
                        >
                            <div className="row">
                                <div className="col-sm-1">
                                    <input
                                        type="checkbox"
                                        checked={customer.gdprConsent}
                                        onChange={(e) =>
                                            handleConsentChange(
                                                'gdprConsent',
                                                e.target.checked,
                                            )
                                        }
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                        }}
                                    />
                                </div>
                                <div className="col-sm-11">
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            fontSize: '13px',
                                            color: '#333',
                                        }}
                                    >
                                        Ochrona danych osobowych (RODO)
                                    </div>
                                    <p
                                        className="text-muted"
                                        style={{
                                            fontSize: '12px',
                                            margin: '5px 0',
                                        }}
                                    >
                                        Wyrażam zgodę na przetwarzanie danych
                                        osobowych w celach związanych z
                                        realizacją usług salonu zgodnie z RODO.
                                    </p>
                                    {customer.gdprConsentDate && (
                                        <div
                                            style={{
                                                fontSize: '11px',
                                                color: '#999',
                                            }}
                                        >
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
                        <div
                            className="versum-panel-sub"
                            style={{ marginBottom: '20px', padding: '15px' }}
                        >
                            <div
                                className="row"
                                style={{ marginBottom: '15px' }}
                            >
                                <div className="col-sm-1">
                                    <input
                                        type="checkbox"
                                        checked={customer.smsConsent}
                                        onChange={(e) =>
                                            handleConsentChange(
                                                'smsConsent',
                                                e.target.checked,
                                            )
                                        }
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                        }}
                                    />
                                </div>
                                <div className="col-sm-11">
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            fontSize: '13px',
                                            color: '#333',
                                        }}
                                    >
                                        Zgoda na powiadomienia SMS
                                    </div>
                                    <p
                                        className="text-muted"
                                        style={{
                                            fontSize: '12px',
                                            margin: '5px 0',
                                        }}
                                    >
                                        Wyrażam zgodę na otrzymywanie wiadomości
                                        SMS z przypomnieniami o wizytach oraz
                                        ofertami promocyjnymi.
                                    </p>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-1">
                                    <input
                                        type="checkbox"
                                        checked={customer.emailConsent}
                                        onChange={(e) =>
                                            handleConsentChange(
                                                'emailConsent',
                                                e.target.checked,
                                            )
                                        }
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                        }}
                                    />
                                </div>
                                <div className="col-sm-11">
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            fontSize: '13px',
                                            color: '#333',
                                        }}
                                    >
                                        Zgoda na newsletter e-mail
                                    </div>
                                    <p
                                        className="text-muted"
                                        style={{
                                            fontSize: '12px',
                                            margin: '5px 0',
                                        }}
                                    >
                                        Wyrażam zgodę na otrzymywanie wiadomości
                                        e-mail z informacjami o nowościach,
                                        promocjach i newsletterach.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Privacy Information Alert */}
                        <div
                            className="alert alert-info"
                            style={{
                                fontSize: '12px',
                                border: '1px solid #bce8f1',
                                background: '#d9edf7',
                                color: '#31708f',
                                borderRadius: '4px',
                                padding: '15px',
                            }}
                        >
                            <div
                                style={{ fontWeight: 600, marginBottom: '5px' }}
                            >
                                Informacja o przetwarzaniu danych
                            </div>
                            <p style={{ margin: 0 }}>
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
                        <div style={{ marginTop: '30px' }}>
                            <div
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    color: '#999',
                                    marginBottom: '10px',
                                }}
                            >
                                Historia zmian zgód
                            </div>
                            <table
                                className="versum-table"
                                style={{ fontSize: '12px' }}
                            >
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
                                                <span
                                                    style={{
                                                        color: '#5cb85c',
                                                        fontWeight: 600,
                                                    }}
                                                >
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
