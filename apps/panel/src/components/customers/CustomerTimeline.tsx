'use client';

import Link from 'next/link';
import { useCustomerTimeline } from '@/hooks/useCustomerTimeline';

interface CustomerTimelineProps {
    customerId: number;
    limit?: number;
}

function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('pl-PL', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function formatCurrency(value: number | undefined) {
    if (typeof value !== 'number') return null;
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
    }).format(value);
}

function labelForType(type: 'appointment' | 'sale' | 'note') {
    if (type === 'appointment') return 'Wizyta';
    if (type === 'sale') return 'Sprzedaż';
    return 'Notatka';
}

export default function CustomerTimeline({
    customerId,
    limit = 20,
}: CustomerTimelineProps) {
    const { items, isLoading, isError } = useCustomerTimeline(customerId, {
        limit,
    });

    if (isLoading) {
        return <div className="text-muted small">Ładowanie timeline...</div>;
    }

    if (isError) {
        return (
            <div className="text-danger small">
                Nie udało się załadować timeline klienta.
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-muted small">
                Brak historii klienta do wyświetlenia.
            </div>
        );
    }

    return (
        <div className="d-flex flex-column gap-2">
            {items.map((item) => (
                <div
                    key={`${item.type}-${item.id}`}
                    className="border rounded p-2 bg-white"
                >
                    <div className="d-flex justify-content-between align-items-start gap-2">
                        <div>
                            <div className="small text-muted">
                                {labelForType(item.type)}
                            </div>
                            <div className="fw-semibold">
                                {'href' in item && item.href ? (
                                    <Link href={item.href} className="link-more">
                                        {item.title}
                                    </Link>
                                ) : (
                                    item.title
                                )}
                            </div>
                            {'subtitle' in item && item.subtitle ? (
                                <div className="small text-muted">
                                    {item.subtitle}
                                </div>
                            ) : null}
                            {item.type === 'note' ? (
                                <div className="small mt-1">
                                    {item.isPinned ? 'Przypięta: ' : ''}
                                    {item.content}
                                </div>
                            ) : null}
                        </div>
                        <div className="text-end">
                            <div className="small text-muted">
                                {formatDateTime(item.date)}
                            </div>
                            {item.type === 'appointment' && item.status ? (
                                <div className="small">{item.status}</div>
                            ) : null}
                            {'amount' in item && formatCurrency(item.amount) ? (
                                <div className="small fw-semibold">
                                    {formatCurrency(item.amount)}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
