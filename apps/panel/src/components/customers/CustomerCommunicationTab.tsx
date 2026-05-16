'use client';

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

    return (
        <div className="customer-tab-content customer-communication-tab">
            <div className="customer-communication-section">
                <div className="customer-communication-header">
                    <div className="customer-communication-title">
                        Informacje kontaktowe
                    </div>
                    <div className="customer-communication-actions">
                        <Link
                            href={`/customers/${customer.id}/edit`}
                            className="btn btn-default btn-xs"
                        >
                            Edytuj
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
                                <th>Typ wiadomości</th>
                                <th className="col-center">SMS</th>
                                <th className="col-center">Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.key}>
                                    <td className="col-type">{r.label}</td>
                                    <td className="col-center">
                                        {customer.smsConsent ? (
                                            <i
                                                className="fa fa-check customer-communication-check customer-communication-check--ok"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <span className="customer-communication-check customer-communication-check--empty" />
                                        )}
                                    </td>
                                    <td className="col-center">
                                        {customer.emailConsent ? (
                                            <i
                                                className="fa fa-check customer-communication-check customer-communication-check--ok"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <span className="customer-communication-check customer-communication-check--empty" />
                                        )}
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
                    <div className="customer-communication-consent">
                        <div className="customer-communication-consent__icon">
                            {customer.gdprConsent ? (
                                <i
                                    className="fa fa-check customer-communication-consent__ok"
                                    aria-hidden="true"
                                />
                            ) : (
                                <i
                                    className="fa fa-times customer-communication-consent__no"
                                    aria-hidden="true"
                                />
                            )}
                        </div>
                        <div className="customer-communication-consent__text">
                            Administratorem Pani/a danych osobowych jest: Salon
                            Fryzjerski Black&White Aleksandra Bodora z siedzibą
                            Kopernika 13, 41-922 Radzionków, PL, NIP:
                            6262231181, e-mail: kontakt@salon-bw.pl.
                            <div className="mt-6">
                                1. Administrator przetwarza dane osobowe w celu:
                                realizacji umowy (wykonania usługi).
                            </div>
                        </div>
                    </div>

                    <div className="customer-communication-consent">
                        <div className="customer-communication-consent__icon">
                            {customer.smsConsent || customer.emailConsent ? (
                                <i
                                    className="fa fa-check customer-communication-consent__ok"
                                    aria-hidden="true"
                                />
                            ) : (
                                <i
                                    className="fa fa-times customer-communication-consent__no"
                                    aria-hidden="true"
                                />
                            )}
                        </div>
                        <div className="customer-communication-consent__text">
                            Wyrażam zgodę na przetwarzanie danych osobowych
                            przez Salon Fryzjerski Black&White Aleksandra Bodora
                            z siedzibą Kopernika 13, 41-922 Radzionków, PL, NIP:
                            6262231181, w celu przesyłania informacji handlowych
                            na mój adres e-mail oraz numer telefonu podany
                            powyżej w formularzu kontaktowym.
                        </div>
                    </div>
                </div>
            </div>

            <div className="customer-communication-section mt-20">
                <div className="customer-communication-title">
                    Historia zmian zgód
                </div>
                <table className="customer-communication-table customer-communication-history-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Zgoda</th>
                            <th>Zmiana</th>
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
                        className={`btn btn-xs ${historyChannel === 'sms' ? 'btn-primary' : 'btn-default'}`}
                        onClick={() => setHistoryChannel('sms')}
                    >
                        SMS
                    </button>
                    <button
                        type="button"
                        className={`btn btn-xs ${historyChannel === 'email' ? 'btn-primary' : 'btn-default'}`}
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
                                    <th>Data</th>
                                    <th>Status</th>
                                    <th>Wiadomość</th>
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
                                <th>Data</th>
                                <th>Status</th>
                                <th>Temat</th>
                                <th>Odbiorca</th>
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
