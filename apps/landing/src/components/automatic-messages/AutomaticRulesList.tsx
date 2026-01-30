'use client';

import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { AutomaticMessageRule, AutomaticMessageTrigger } from '@/types';

interface Props {
    rules: AutomaticMessageRule[];
    loading?: boolean;
    onEdit: (rule: AutomaticMessageRule) => void;
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
    onProcess: (id: number) => void;
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
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Ładowanie reguł...</span>
            </div>
        );
    }

    if (rules.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
                <p className="font-medium">Brak skonfigurowanych reguł</p>
                <p className="text-sm mt-1">
                    Utwórz regułę, aby automatycznie wysyłać wiadomości
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {rules.map((rule) => (
                <div
                    key={rule.id}
                    className={`border rounded-lg p-4 ${
                        rule.isActive
                            ? 'bg-white border-gray-200'
                            : 'bg-gray-50 border-gray-200 opacity-70'
                    }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h3 className="font-medium text-gray-900">
                                    {rule.name}
                                </h3>
                                <span
                                    className={`px-2 py-0.5 text-xs rounded-full ${
                                        TRIGGER_COLORS[rule.trigger]
                                    }`}
                                >
                                    {TRIGGER_LABELS[rule.trigger]}
                                </span>
                                {!rule.isActive && (
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
                                        Nieaktywna
                                    </span>
                                )}
                            </div>
                            {rule.description && (
                                <p className="text-sm text-gray-500 mt-1">
                                    {rule.description}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                                {rule.offsetHours !== 0 && (
                                    <span>
                                        {rule.offsetHours < 0
                                            ? `${Math.abs(rule.offsetHours)}h przed`
                                            : `${rule.offsetHours}h po`}
                                    </span>
                                )}
                                {rule.inactivityDays && (
                                    <span>
                                        Po {rule.inactivityDays} dniach nieaktywności
                                    </span>
                                )}
                                <span>
                                    Okno: {rule.sendWindowStart.slice(0, 5)} -{' '}
                                    {rule.sendWindowEnd.slice(0, 5)}
                                </span>
                                <span>
                                    Wysłano: {rule.sentCount}
                                </span>
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
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => onProcess(rule.id)}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
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
                                onClick={() => onToggle(rule.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                    rule.isActive
                                        ? 'text-green-600 hover:bg-green-50'
                                        : 'text-gray-400 hover:bg-gray-100'
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
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
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
                                onClick={() => onDelete(rule.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
