'use client';

import { useState } from 'react';
import type { Customer } from '@/types';
import CustomerConsentsTab from './CustomerConsentsTab';
import { useSmsHistory } from '@/hooks/useSms';
import { useEmailHistory } from '@/hooks/useEmails';

type Props = {
    customer: Customer;
    onUpdate: (data: Partial<Customer>) => Promise<void>;
};

function formatDateTime(value?: string | null) {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString('pl-PL');
    } catch {
        return '-';
    }
}

export default function CustomerCommunicationTab({
    customer,
    onUpdate,
}: Props) {
    const [active, setActive] = useState<'sms' | 'email'>('sms');

    const [smsPage, setSmsPage] = useState(1);
    const [emailPage, setEmailPage] = useState(1);

    const sms = useSmsHistory({
        recipientId: customer.id,
        page: smsPage,
        limit: 20,
        channel: 'sms',
    });

    const emails = useEmailHistory({
        recipientId: customer.id,
        page: emailPage,
        limit: 20,
    });

    return (
        <div className="customer-tab-content customer-communication-tab">
            <CustomerConsentsTab customer={customer} onUpdate={onUpdate} />

            <div className="versum-widget mt-20">
                <div className="versum-widget__header flex-between">
                    <span>Historia komunikacji</span>
                    <div className="btn-group">
                        <button
                            type="button"
                            className={`btn btn-xs ${active === 'sms' ? 'btn-primary' : 'btn-default'}`}
                            onClick={() => setActive('sms')}
                        >
                            SMS
                        </button>
                        <button
                            type="button"
                            className={`btn btn-xs ${active === 'email' ? 'btn-primary' : 'btn-default'}`}
                            onClick={() => setActive('email')}
                        >
                            Email
                        </button>
                    </div>
                </div>

                <div className="versum-widget__content">
                    {active === 'sms' && (
                        <>
                            {sms.loading ? (
                                <div className="text-muted">
                                    Ładowanie SMS...
                                </div>
                            ) : sms.data.items.length === 0 ? (
                                <div className="customer-empty-state">
                                    Brak wysłanych SMS do tego klienta.
                                </div>
                            ) : (
                                <table className="customers-history-table table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Status</th>
                                            <th>Treść</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sms.data.items.map((row) => (
                                            <tr key={row.id}>
                                                <td>
                                                    {formatDateTime(
                                                        row.sentAt ||
                                                            row.createdAt,
                                                    )}
                                                </td>
                                                <td>{row.status}</td>
                                                <td>
                                                    <div className="bold">
                                                        {row.subject ||
                                                            'Wiadomość'}
                                                    </div>
                                                    <div className="customer-stats-subtitle">
                                                        {row.content}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {sms.data.total > sms.data.limit && (
                                <div className="versum-pagination-footer">
                                    <div>
                                        Strona {sms.data.page} z{' '}
                                        {Math.max(
                                            1,
                                            Math.ceil(
                                                sms.data.total / sms.data.limit,
                                            ),
                                        )}
                                    </div>
                                    <div className="btn-group">
                                        <button
                                            className="btn btn-default btn-xs"
                                            disabled={smsPage <= 1}
                                            onClick={() =>
                                                setSmsPage((p) =>
                                                    Math.max(1, p - 1),
                                                )
                                            }
                                        >
                                            Poprzednia
                                        </button>
                                        <button
                                            className="btn btn-default btn-xs"
                                            disabled={
                                                smsPage * sms.data.limit >=
                                                sms.data.total
                                            }
                                            onClick={() =>
                                                setSmsPage((p) => p + 1)
                                            }
                                        >
                                            Następna
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {active === 'email' && (
                        <>
                            {emails.loading ? (
                                <div className="text-muted">
                                    Ładowanie emaili...
                                </div>
                            ) : emails.data.items.length === 0 ? (
                                <div className="customer-empty-state">
                                    Brak wysłanych emaili do tego klienta.
                                </div>
                            ) : (
                                <table className="customers-history-table table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Status</th>
                                            <th>Temat</th>
                                            <th>Do</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {emails.data.items.map((row) => (
                                            <tr key={row.id}>
                                                <td>
                                                    {formatDateTime(
                                                        row.sentAt ||
                                                            row.createdAt,
                                                    )}
                                                </td>
                                                <td>{row.status}</td>
                                                <td>{row.subject}</td>
                                                <td>{row.to}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {emails.data.total > emails.data.limit && (
                                <div className="versum-pagination-footer">
                                    <div>
                                        Strona {emails.data.page} z{' '}
                                        {Math.max(
                                            1,
                                            Math.ceil(
                                                emails.data.total /
                                                    emails.data.limit,
                                            ),
                                        )}
                                    </div>
                                    <div className="btn-group">
                                        <button
                                            className="btn btn-default btn-xs"
                                            disabled={emailPage <= 1}
                                            onClick={() =>
                                                setEmailPage((p) =>
                                                    Math.max(1, p - 1),
                                                )
                                            }
                                        >
                                            Poprzednia
                                        </button>
                                        <button
                                            className="btn btn-default btn-xs"
                                            disabled={
                                                emailPage * emails.data.limit >=
                                                emails.data.total
                                            }
                                            onClick={() =>
                                                setEmailPage((p) => p + 1)
                                            }
                                        >
                                            Następna
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
