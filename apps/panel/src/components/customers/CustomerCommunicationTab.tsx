'use client';

import Link from 'next/link';
import { useMemo } from 'react';
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
                        <div className="customer-communication-contact__value">
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
                        <div className="customer-communication-contact__value">
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
        </div>
    );
}
