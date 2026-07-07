import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useEmailHistory } from '@/hooks/useEmails';
import { useSmsHistory } from '@/hooks/useSms';
import type { Customer } from '@/types';

type Props = {
    customer: Customer;
};

type MessageTypeRow = {
    key:
        | 'notifications'
        | 'mass_message'
        | 'birthday_wishes'
        | 'marketing_automation'
        | 'opinions_after_visits';
    label: string;
};

type ConsentItem = {
    key: string;
    label: string;
    checked: boolean;
    date?: string;
    description: string;
};

function StatusBadge({ enabled }: { enabled: boolean }) {
    return (
        <span
            className={`customer-communication-status ${
                enabled
                    ? 'customer-communication-status--ok'
                    : 'customer-communication-status--off'
            }`}
        >
            {enabled ? 'tak' : 'nie'}
        </span>
    );
}

export default function CustomerCommunicationTab({ customer }: Props) {
    const [historyChannel, setHistoryChannel] = useState<'sms' | 'email'>(
        'sms',
    );
    const smsHistory = useSmsHistory({
        recipientId: customer.id,
        page: 1,
        limit: 20,
    });
    const emailHistory = useEmailHistory({
        recipientId: customer.id,
        page: 1,
        limit: 20,
    });

    const rows: MessageTypeRow[] = useMemo(
        () => [
            { key: 'notifications', label: 'Powiadomienia' },
            { key: 'mass_message', label: 'Wiadomość masowa' },
            {
                key: 'birthday_wishes',
                label: 'Życzenia urodzinowe, imieninowe',
            },
            { key: 'marketing_automation', label: 'Marketing automatyczny' },
            { key: 'opinions_after_visits', label: 'Opinie po wizytach' },
        ],
        [],
    );

    const mapStatus = (value?: string | null) => {
        const status = (value || '').toLowerCase();
        if (status === 'sent' || status === 'delivered') return 'wysłano';
        if (status === 'failed' || status === 'rejected') return 'błąd';
        if (status === 'pending') return 'oczekuje';
        return status || '-';
    };

    const fmtDateTime = (value?: string | null) => {
        if (!value) return '-';
        return new Date(value).toLocaleString('pl-PL');
    };

    const historyLoading =
        historyChannel === 'sms' ? smsHistory.loading : emailHistory.loading;
    const historyError =
        historyChannel === 'sms' ? smsHistory.error : emailHistory.error;
    const smsItems = Array.isArray(smsHistory.data?.items)
        ? smsHistory.data.items
        : [];
    const emailItems = Array.isArray(emailHistory.data?.items)
        ? emailHistory.data.items
        : [];
    const notifyPanel = customer.notifyPanel ?? true;
    const smsConsent = Boolean(customer.smsConsent);
    const whatsappConsent = Boolean(customer.whatsappConsent);
    const emailConsent = Boolean(customer.emailConsent);
    const gdprConsent = Boolean(customer.gdprConsent);
    const termsConsent = Boolean(customer.termsConsent);
    const consentItems: ConsentItem[] = [
        {
            key: 'gdpr',
            label: 'Przetwarzanie danych osobowych (RODO)',
            checked: gdprConsent,
            date: customer.gdprConsentDate,
            description:
                'Zgoda wymagana do obsługi konta klienta i realizacji usług.',
        },
        {
            key: 'terms',
            label: 'Akceptacja regulaminu salonu',
            checked: termsConsent,
            date: customer.termsConsentDate,
            description:
                'Potwierdzenie zapoznania się z zasadami rezerwacji i świadczenia usług.',
        },
        {
            key: 'sms',
            label: 'Marketing SMS',
            checked: smsConsent,
            description:
                'Zgoda na otrzymywanie informacji marketingowych drogą SMS.',
        },
        {
            key: 'whatsapp',
            label: 'Marketing WhatsApp',
            checked: whatsappConsent,
            description:
                'Zgoda na otrzymywanie informacji marketingowych przez WhatsApp.',
        },
        {
            key: 'email',
            label: 'Marketing email',
            checked: emailConsent,
            description:
                'Zgoda na otrzymywanie informacji marketingowych drogą e-mail.',
        },
    ];

    return (
        <div className="customer-tab-content customer-communication-tab">
            <div className="customer-communication-section">
                <div className="customer-communication-header">
                    <div className="customer-communication-title">
                        Informacje kontaktowe
                    </div>
                    <div className="customer-communication-actions">
                        <Link
                            href={`/customers/${customer.id}/edit#customer-form-advanced`}
                            className="btn btn-outline-secondary btn-sm"
                        >
                            Edytuj zgody
                        </Link>
                    </div>
                </div>

                <div className="customer-communication-contact">
                    <div className="customer-communication-contact__row">
                        <div className="customer-communication-contact__label">
                            Imię i nazwisko
                        </div>
                        <div className="customer-communication-contact__value">
                            {customer.fullName || customer.name}
                        </div>
                    </div>
                    <div className="customer-communication-contact__row">
                        <div className="customer-communication-contact__label">
                            Email
                        </div>
                        <div className="customer-communication-contact__value with-icon">
                            <i
                                className="glyphicon glyphicon-envelope"
                                aria-hidden="true"
                            />
                            {customer.email ? (
                                <a href={`mailto:${customer.email}`}>
                                    {customer.email}
                                </a>
                            ) : (
                                <span className="text-muted">nie podano</span>
                            )}
                        </div>
                    </div>
                    <div className="customer-communication-contact__row">
                        <div className="customer-communication-contact__label">
                            Telefon
                        </div>
                        <div className="customer-communication-contact__value with-icon">
                            <i
                                className="glyphicon glyphicon-earphone"
                                aria-hidden="true"
                            />
                            {customer.phone ? (
                                <a href={`tel:${customer.phone}`}>
                                    {customer.phone}
                                </a>
                            ) : (
                                <span className="text-muted">nie podano</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="customer-communication-section mt-20">
                <div className="customer-communication-title">
                    Ustawienia kanałów komunikacji
                </div>

                <div className="customer-communication-channels">
                    <table className="customer-communication-table">
                        <thead>
                            <tr>
                                <th scope="col">Typ wiadomości</th>
                                <th scope="col" className="col-center">
                                    Panel
                                </th>
                                <th scope="col" className="col-center">
                                    SMS
                                </th>
                                <th scope="col" className="col-center">
                                    WhatsApp
                                </th>
                                <th scope="col" className="col-center">
                                    Email
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.key}>
                                    <td className="col-type">{r.label}</td>
                                    <td className="col-center">
                                        <StatusBadge enabled={notifyPanel} />
                                    </td>
                                    <td className="col-center">
                                        <StatusBadge enabled={smsConsent} />
                                    </td>
                                    <td className="col-center">
                                        <StatusBadge
                                            enabled={whatsappConsent}
                                        />
                                    </td>
                                    <td className="col-center">
                                        <StatusBadge enabled={emailConsent} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="customer-communication-section mt-20">
                <div className="customer-communication-title">
                    Zgody udzielone przez klienta
                </div>

                <div className="customer-communication-consents">
                    {consentItems.map((item) => (
                        <div
                            className="customer-communication-consent"
                            key={item.key}
                        >
                            <div className="customer-communication-consent__icon">
                                <StatusBadge enabled={item.checked} />
                            </div>
                            <div className="customer-communication-consent__text">
                                <strong>{item.label}</strong>
                                <p>{item.description}</p>
                                {item.date ? (
                                    <small>
                                        Data zgody: {fmtDateTime(item.date)}
                                    </small>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="customer-communication-section mt-20">
                <div className="customer-communication-title">
                    Historia zmian zgód
                </div>
                <table className="customer-communication-table customer-communication-history-table">
                    <thead>
                        <tr>
                            <th scope="col">Data</th>
                            <th scope="col">Zgoda</th>
                            <th scope="col">Zmiana</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td
                                colSpan={3}
                                className="customer-communication-table__empty"
                            >
                                Brak zapisanej historii
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="customer-communication-section mt-20">
                <div className="customer-communication-title">
                    Historia komunikacji
                </div>
                <div className="customer-communication-history-switcher">
                    <button
                        type="button"
                        className={`btn btn-sm ${historyChannel === 'sms' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setHistoryChannel('sms')}
                    >
                        SMS
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm ${historyChannel === 'email' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setHistoryChannel('email')}
                    >
                        Email
                    </button>
                </div>

                {historyLoading ? (
                    <div className="customer-empty-state">
                        Ładowanie historii...
                    </div>
                ) : historyError ? (
                    <div className="customer-inline-error">
                        Nie udało się załadować historii komunikacji.
                    </div>
                ) : historyChannel === 'sms' ? (
                    smsItems.length === 0 ? (
                        <div className="customer-empty-state">
                            Brak wysłanych SMS do tego klienta.
                        </div>
                    ) : (
                        <table className="customer-communication-table customer-communication-history-table">
                            <thead>
                                <tr>
                                    <th scope="col">Data</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Wiadomość</th>
                                </tr>
                            </thead>
                            <tbody>
                                {smsItems.map((item) => (
                                    <tr key={`sms-${item.id}`}>
                                        <td>
                                            {fmtDateTime(
                                                item.sentAt || item.createdAt,
                                            )}
                                        </td>
                                        <td>{mapStatus(item.status)}</td>
                                        <td className="ellipsis-cell">
                                            {item.content || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : emailItems.length === 0 ? (
                    <div className="customer-empty-state">
                        Brak wysłanych emaili do tego klienta.
                    </div>
                ) : (
                    <table className="customer-communication-table customer-communication-history-table">
                        <thead>
                            <tr>
                                <th scope="col">Data</th>
                                <th scope="col">Status</th>
                                <th scope="col">Temat</th>
                                <th scope="col">Odbiorca</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emailItems.map((item) => (
                                <tr key={`email-${item.id}`}>
                                    <td>
                                        {fmtDateTime(
                                            item.sentAt || item.createdAt,
                                        )}
                                    </td>
                                    <td>{mapStatus(item.status)}</td>
                                    <td className="ellipsis-cell">
                                        {item.subject || '-'}
                                    </td>
                                    <td>{item.to || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
