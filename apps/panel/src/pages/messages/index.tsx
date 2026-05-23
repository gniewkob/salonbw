'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useNewsletters, useNewsletterMutations } from '@/hooks/useNewsletters';
import NewsletterEditorModal from '@/components/newsletters/NewsletterEditorModal';
import type {
    Newsletter,
    NewsletterStatus,
    CreateNewsletterRequest,
} from '@/types';

const STATUS_LABELS: Record<NewsletterStatus, string> = {
    draft: 'Szkic',
    scheduled: 'Zaplanowany',
    sending: 'Wysyłanie',
    sent: 'Wysłany',
    partial_failure: 'Częściowy błąd',
    failed: 'Błąd',
    cancelled: 'Anulowany',
};

const STATUS_CLASS: Record<NewsletterStatus, string> = {
    draft: 'badge badge-salon-inactive',
    scheduled: 'badge badge-salon',
    sending: 'badge badge-salon-warning',
    sent: 'badge badge-salon-success',
    partial_failure: 'badge badge-salon-warning',
    failed: 'badge badge-salon-error',
    cancelled: 'badge badge-salon-inactive',
};

const CHANNEL_LABELS: Record<string, string> = {
    email: 'Email',
    sms: 'SMS',
};

export default function MessagesPage() {
    const { role } = useAuth();
    const router = useRouter();
    const { data: newsletters, isLoading, error } = useNewsletters();
    const {
        createNewsletter,
        updateNewsletter,
        deleteNewsletter,
        duplicateNewsletter,
        sendNewsletter,
        cancelNewsletter,
    } = useNewsletterMutations();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingNewsletter, setEditingNewsletter] =
        useState<Newsletter | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Auto-open create modal when navigated with ?new=1
    useEffect(() => {
        if (router.query.new === '1') {
            setEditingNewsletter(null);
            setModalOpen(true);
            void router.replace('/messages', undefined, { shallow: true });
        }
    }, [router.query.new, router]);

    const handleNewNewsletter = () => {
        setEditingNewsletter(null);
        setModalOpen(true);
    };

    const handleEdit = (newsletter: Newsletter) => {
        setEditingNewsletter(newsletter);
        setModalOpen(true);
    };

    const handleSave = async (data: CreateNewsletterRequest) => {
        if (editingNewsletter) {
            await updateNewsletter.mutateAsync({
                id: editingNewsletter.id,
                ...data,
            });
        } else {
            await createNewsletter.mutateAsync(data);
        }
    };

    const handleSend = async (id: number) => {
        setActionError(null);
        try {
            await sendNewsletter.mutateAsync({ id });
        } catch (err) {
            setActionError(
                err instanceof Error ? err.message : 'Nie udało się wysłać.',
            );
        }
    };

    const handleCancel = async (id: number) => {
        setActionError(null);
        try {
            await cancelNewsletter.mutateAsync(id);
        } catch (err) {
            setActionError(
                err instanceof Error ? err.message : 'Nie udało się anulować.',
            );
        }
    };

    const handleDuplicate = async (id: number) => {
        setActionError(null);
        try {
            await duplicateNewsletter.mutateAsync(id);
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się duplikować.',
            );
        }
    };

    const handleDelete = async (id: number) => {
        setActionError(null);
        try {
            await deleteNewsletter.mutateAsync(id);
        } finally {
            setConfirmDeleteId(null);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!role) return null;

    return (
        <SalonShell role={role}>
            <SalonBreadcrumbs
                iconClass="sprite-breadcrumbs_communication"
                items={[
                    { label: 'Komunikacja', href: '/communication' },
                    { label: 'Wiadomości' },
                ]}
            />
            <div>
                <div className="actions">
                    <button
                        type="button"
                        className="button button-blue pull-right"
                        onClick={handleNewNewsletter}
                    >
                        + nowy newsletter
                    </button>
                </div>
                <h2>Wiadomości</h2>

                {actionError && (
                    <div className="alert alert-danger mt-2">{actionError}</div>
                )}

                {isLoading ? (
                    <p className="salonbw-muted p-20">Ładowanie...</p>
                ) : error ? (
                    <div className="alert alert-danger">
                        Błąd ładowania wiadomości
                    </div>
                ) : (
                    <div className="column_row data_table">
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>
                                    <div>Nazwa</div>
                                </th>
                                <th>
                                    <div>Kanał</div>
                                </th>
                                <th>
                                    <div>Data wysyłki</div>
                                </th>
                                <th>
                                    <div>Odbiorcy</div>
                                </th>
                                <th>
                                    <div>Status</div>
                                </th>
                                <th>
                                    <div>Akcje</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!newsletters || newsletters.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        style={{ textAlign: 'center' }}
                                    >
                                        Brak newsletterów
                                    </td>
                                </tr>
                            ) : (
                                newsletters.map((nl) => (
                                    <tr key={nl.id}>
                                        <td>
                                            <strong>{nl.name}</strong>
                                            <div>{nl.subject}</div>
                                        </td>
                                        <td>
                                            {CHANNEL_LABELS[nl.channel] ??
                                                nl.channel}
                                        </td>
                                        <td>
                                            {nl.sentAt
                                                ? formatDate(nl.sentAt)
                                                : nl.scheduledAt
                                                  ? `plan: ${formatDate(nl.scheduledAt)}`
                                                  : '—'}
                                        </td>
                                        <td>
                                            {nl.totalRecipients > 0 ? (
                                                <span>
                                                    {nl.sentCount}/
                                                    {nl.totalRecipients}
                                                </span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={
                                                    STATUS_CLASS[nl.status]
                                                }
                                            >
                                                {STATUS_LABELS[nl.status]}
                                            </span>
                                        </td>
                                        <td>
                                            <div>
                                                {nl.status === 'draft' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="button button-link"
                                                            onClick={() =>
                                                                handleEdit(nl)
                                                            }
                                                        >
                                                            Edytuj
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="button button-blue"
                                                            onClick={() => {
                                                                void handleSend(
                                                                    nl.id,
                                                                );
                                                            }}
                                                        >
                                                            Wyślij
                                                        </button>
                                                    </>
                                                )}
                                                {nl.status === 'scheduled' && (
                                                    <button
                                                        type="button"
                                                        className="button button-link"
                                                        onClick={() => {
                                                            void handleCancel(
                                                                nl.id,
                                                            );
                                                        }}
                                                    >
                                                        Anuluj
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="button button-link"
                                                    onClick={() => {
                                                        void handleDuplicate(
                                                            nl.id,
                                                        );
                                                    }}
                                                >
                                                    Duplikuj
                                                </button>
                                                {nl.status === 'draft' && (
                                                    <>
                                                        {confirmDeleteId ===
                                                        nl.id ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="button button-link"
                                                                    onClick={() => {
                                                                        void handleDelete(
                                                                            nl.id,
                                                                        );
                                                                    }}
                                                                >
                                                                    Potwierdź
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="button button-link"
                                                                    onClick={() =>
                                                                        setConfirmDeleteId(
                                                                            null,
                                                                        )
                                                                    }
                                                                >
                                                                    Anuluj
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="button button-link"
                                                                onClick={() =>
                                                                    setConfirmDeleteId(
                                                                        nl.id,
                                                                    )
                                                                }
                                                            >
                                                                Usuń
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>

            <NewsletterEditorModal
                isOpen={modalOpen}
                newsletter={editingNewsletter}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
            />
        </SalonShell>
    );
}
