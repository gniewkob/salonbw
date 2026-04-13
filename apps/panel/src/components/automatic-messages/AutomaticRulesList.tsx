'use client';

import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { AutomaticMessageRule, AutomaticMessageTrigger } from '@/types';

interface Props {
    rules: AutomaticMessageRule[];
    loading?: boolean;
    onEdit: (rule: AutomaticMessageRule) => void;
    onToggle: (id: number) => Promise<void> | void;
    onDelete: (id: number) => Promise<void> | void;
    onProcess: (id: number) => Promise<void> | void;
}

const TRIGGER_LABELS: Record<AutomaticMessageTrigger, string> = {
    appointment_reminder: 'Przypomnienie o wizycie',
    appointment_confirmation: 'Potwierdzenie rezerwacji',
    appointment_cancellation: 'Anulowanie wizyty',
    follow_up: 'Wiadomość po wizycie',
    birthday: 'Życzenia urodzinowe',
    inactive_client: 'Reaktywacja klienta',
    new_client: 'Nowy klient',
    review_request: 'Prośba o opinię',
};

const TRIGGER_COLORS: Record<AutomaticMessageTrigger, string> = {
    appointment_reminder: 'bg-blue-100 text-blue-700',
    appointment_confirmation: 'bg-green-100 text-green-700',
    appointment_cancellation: 'bg-red-100 text-red-700',
    follow_up: 'bg-purple-100 text-purple-700',
    birthday: 'bg-pink-100 text-pink-700',
    inactive_client: 'bg-orange-100 text-orange-700',
    new_client: 'bg-teal-100 text-teal-700',
    review_request: 'bg-yellow-100 text-yellow-700',
};

export default function AutomaticRulesList({
    rules,
    loading,
    onEdit,
    onToggle,
    onDelete,
    onProcess,
}: Props) {
    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center py-5">
                <div className="rounded-circle h-6 w-6 border-bottom-2 border-primary"></div>
                <span className="ms-2 text-muted">Ładowanie reguł...</span>
            </div>
        );
    }

    if (rules.length === 0) {
        return (
            <div className="text-center py-5 text-muted">
                <svg
                    className="mx-auto h-12 w-12 text-secondary mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                <p className="fw-medium">Brak skonfigurowanych reguł</p>
                <p className="small mt-1">
                    Utwórz regułę, aby automatycznie wysyłać wiadomości
                </p>
            </div>
        );
    }

    return (
        <div className="gap-2">
            {rules.map((rule) => (
                <div
                    key={rule.id}
                    className={`border rounded-3 p-3 ${
                        rule.isActive
                            ? 'bg-white border-secondary border-opacity-25'
                            : 'bg-light border-secondary border-opacity-25 opacity-70'
                    }`}
                >
                    <div className="d-flex align-items-start justify-content-between">
                        <div className="flex-fill">
                            <div className="d-flex align-items-center gap-2">
                                <h3 className="fw-medium text-dark">
                                    {rule.name}
                                </h3>
                                <span
                                    className={`px-2 py-0.5 small rounded-circle ${
                                        TRIGGER_COLORS[rule.trigger]
                                    }`}
                                >
                                    {TRIGGER_LABELS[rule.trigger]}
                                </span>
                                {!rule.isActive && (
                                    <span className="px-2 py-0.5 small rounded-circle bg-secondary bg-opacity-25 text-muted">
                                        Nieaktywna
                                    </span>
                                )}
                            </div>
                            {rule.description && (
                                <p className="small text-muted mt-1">
                                    {rule.description}
                                </p>
                            )}
                            <div className="d-flex flex-wrap gap-3 mt-2 small text-muted">
                                {rule.offsetHours !== 0 && (
                                    <span>
                                        {rule.offsetHours < 0
                                            ? `${Math.abs(rule.offsetHours)}h przed`
                                            : `${rule.offsetHours}h po`}
                                    </span>
                                )}
                                {rule.inactivityDays && (
                                    <span>
                                        Po {rule.inactivityDays} dniach
                                        nieaktywności
                                    </span>
                                )}
                                <span>
                                    Okno: {rule.sendWindowStart.slice(0, 5)} -{' '}
                                    {rule.sendWindowEnd.slice(0, 5)}
                                </span>
                                <span>Wysłano: {rule.sentCount}</span>
                                {rule.lastSentAt && (
                                    <span>
                                        Ostatnio:{' '}
                                        {format(
                                            parseISO(rule.lastSentAt),
                                            'd MMM yyyy, HH:mm',
                                            { locale: pl },
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    void onProcess(rule.id);
                                }}
                                className="p-2 text-secondary bg-opacity-10 rounded-3"
                                title="Uruchom teraz"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    void onToggle(rule.id);
                                }}
                                className={`p-2 rounded-3 ${
                                    rule.isActive
                                        ? 'text-success bg-opacity-10'
                                        : 'text-secondary '
                                }`}
                                title={rule.isActive ? 'Wyłącz' : 'Włącz'}
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    {rule.isActive ? (
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    ) : (
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    )}
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => onEdit(rule)}
                                className="p-2 text-secondary bg-opacity-10 rounded-3"
                                title="Edytuj"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    void onDelete(rule.id);
                                }}
                                className="p-2 text-secondary bg-opacity-10 rounded-3"
                                title="Usuń"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
