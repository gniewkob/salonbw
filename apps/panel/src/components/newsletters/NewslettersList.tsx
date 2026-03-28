'use client';

import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Newsletter, NewsletterStatus } from '@/types';

interface Props {
    newsletters: Newsletter[];
    loading?: boolean;
    onEdit: (newsletter: Newsletter) => void;
    onDuplicate: (id: number) => Promise<void> | void;
    onDelete: (id: number) => Promise<void> | void;
    onSend: (id: number) => Promise<void> | void;
    onCancel: (id: number) => Promise<void> | void;
    onViewRecipients: (id: number) => Promise<void> | void;
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
    draft: 'bg-secondary bg-opacity-10 text-body',
    scheduled: 'bg-blue-100 text-blue-700',
    sending: 'bg-yellow-100 text-yellow-700',
    sent: 'bg-green-100 text-green-700',
    partial_failure: 'bg-orange-100 text-orange-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-secondary bg-opacity-25 text-muted',
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
            <div className="d-flex align-items-center justify-content-center py-5">
                <div className="rounded-circle h-6 w-6 border-bottom-2 border-primary"></div>
                <span className="ms-2 text-muted">
                    Ładowanie newsletterów...
                </span>
            </div>
        );
    }

    if (newsletters.length === 0) {
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
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                </svg>
                <p className="fw-medium">Brak newsletterów</p>
                <p className="small mt-1">
                    Utwórz pierwszy newsletter, aby rozpocząć wysyłkę
                </p>
            </div>
        );
    }

    return (
        <div className="gap-2">
            {newsletters.map((newsletter) => (
                <div
                    key={newsletter.id}
                    className="bg-white border border-secondary border-opacity-25 rounded-3 p-3 -shadow"
                >
                    <div className="d-flex align-items-start justify-content-between">
                        <div className="flex-fill">
                            <div className="d-flex align-items-center gap-2">
                                <h3 className="fw-semibold text-dark">
                                    {newsletter.name}
                                </h3>
                                <span
                                    className={`px-2 py-0.5 small rounded-circle ${
                                        STATUS_COLORS[newsletter.status]
                                    }`}
                                >
                                    {STATUS_LABELS[newsletter.status]}
                                </span>
                                <span className="px-2 py-0.5 small rounded-circle bg-light text-muted">
                                    {newsletter.channel === 'email'
                                        ? 'Email'
                                        : 'SMS'}
                                </span>
                            </div>
                            <p className="small text-muted mt-1">
                                {newsletter.subject}
                            </p>
                            <div className="d-flex flex-wrap gap-3 mt-2 small text-muted">
                                {newsletter.status === 'sent' ||
                                newsletter.status === 'partial_failure' ? (
                                    <>
                                        <span>
                                            Wysłano: {newsletter.sentCount}/
                                            {newsletter.totalRecipients}
                                        </span>
                                        <span>
                                            Dostarczono:{' '}
                                            {newsletter.deliveredCount}
                                        </span>
                                        <span>
                                            Otwarto: {newsletter.openedCount}
                                        </span>
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
                                ) : newsletter.status === 'scheduled' &&
                                  newsletter.scheduledAt ? (
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
                        <div className="d-flex align-items-center gap-1">
                            {newsletter.status === 'draft' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            void onSend(newsletter.id);
                                        }}
                                        className="p-2 text-success bg-opacity-10 rounded-3"
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
                                </>
                            )}
                            {(newsletter.status === 'scheduled' ||
                                newsletter.status === 'sending') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        void onCancel(newsletter.id);
                                    }}
                                    className="p-2 text-warning bg-opacity-10 rounded-3"
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
                                    onClick={() => {
                                        void onViewRecipients(newsletter.id);
                                    }}
                                    className="p-2 text-secondary bg-opacity-10 rounded-3"
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
                                onClick={() => {
                                    void onDuplicate(newsletter.id);
                                }}
                                className="p-2 text-secondary bg-opacity-10 rounded-3"
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
                                    onClick={() => {
                                        void onDelete(newsletter.id);
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
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
