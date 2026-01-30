'use client';

import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Newsletter, NewsletterStatus } from '@/types';

interface Props {
    newsletters: Newsletter[];
    loading?: boolean;
    onEdit: (newsletter: Newsletter) => void;
    onDuplicate: (id: number) => void;
    onDelete: (id: number) => void;
    onSend: (id: number) => void;
    onCancel: (id: number) => void;
    onViewRecipients: (id: number) => void;
}

const STATUS_LABELS: Record<NewsletterStatus, string> = {
    draft: 'Szkic',
    scheduled: 'Zaplanowany',
    sending: 'Wysyłanie',
    sent: 'Wysłany',
    partial_failure: 'Częściowy błąd',
    failed: 'Błąd',
    cancelled: 'Anulowany',
};

const STATUS_COLORS: Record<NewsletterStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    sending: 'bg-yellow-100 text-yellow-700',
    sent: 'bg-green-100 text-green-700',
    partial_failure: 'bg-orange-100 text-orange-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-200 text-gray-600',
};

export default function NewslettersList({
    newsletters,
    loading,
    onEdit,
    onDuplicate,
    onDelete,
    onSend,
    onCancel,
    onViewRecipients,
}: Props) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Ładowanie newsletterów...</span>
            </div>
        );
    }

    if (newsletters.length === 0) {
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
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                </svg>
                <p className="font-medium">Brak newsletterów</p>
                <p className="text-sm mt-1">
                    Utwórz pierwszy newsletter, aby rozpocząć wysyłkę
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {newsletters.map((newsletter) => (
                <div
                    key={newsletter.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-gray-900">
                                    {newsletter.name}
                                </h3>
                                <span
                                    className={`px-2 py-0.5 text-xs rounded-full ${
                                        STATUS_COLORS[newsletter.status]
                                    }`}
                                >
                                    {STATUS_LABELS[newsletter.status]}
                                </span>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                                    {newsletter.channel === 'email' ? 'Email' : 'SMS'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{newsletter.subject}</p>
                            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                                {newsletter.status === 'sent' ||
                                newsletter.status === 'partial_failure' ? (
                                    <>
                                        <span>
                                            Wysłano: {newsletter.sentCount}/{newsletter.totalRecipients}
                                        </span>
                                        <span>Dostarczono: {newsletter.deliveredCount}</span>
                                        <span>Otwarto: {newsletter.openedCount}</span>
                                        {newsletter.sentAt && (
                                            <span>
                                                Data:{' '}
                                                {format(
                                                    parseISO(newsletter.sentAt),
                                                    'd MMM yyyy, HH:mm',
                                                    { locale: pl },
                                                )}
                                            </span>
                                        )}
                                    </>
                                ) : newsletter.status === 'scheduled' && newsletter.scheduledAt ? (
                                    <span>
                                        Zaplanowano:{' '}
                                        {format(
                                            parseISO(newsletter.scheduledAt),
                                            'd MMM yyyy, HH:mm',
                                            { locale: pl },
                                        )}
                                    </span>
                                ) : (
                                    <span>
                                        Utworzono:{' '}
                                        {format(
                                            parseISO(newsletter.createdAt),
                                            'd MMM yyyy, HH:mm',
                                            { locale: pl },
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {newsletter.status === 'draft' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => onSend(newsletter.id)}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Wyślij"
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
                                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onEdit(newsletter)}
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
                                </>
                            )}
                            {(newsletter.status === 'scheduled' ||
                                newsletter.status === 'sending') && (
                                <button
                                    type="button"
                                    onClick={() => onCancel(newsletter.id)}
                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                    title="Anuluj"
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
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            )}
                            {newsletter.status !== 'draft' && (
                                <button
                                    type="button"
                                    onClick={() => onViewRecipients(newsletter.id)}
                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    title="Odbiorcy"
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
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => onDuplicate(newsletter.id)}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Duplikuj"
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
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                            </button>
                            {newsletter.status === 'draft' && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(newsletter.id)}
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
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
