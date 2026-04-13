'use client';

import Link from 'next/link';
import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import {
    NewsletterEditorModal,
    NewslettersList,
} from '@/components/newsletters';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import {
    useNewsletterMutations,
    useNewsletterRecipients,
    useNewsletters,
    useNewsletterStats,
} from '@/hooks/useNewsletters';
import type { CreateNewsletterRequest, Newsletter } from '@/types';

export default function MessagesPage() {
    const { role } = useAuth();
    const { data: newsletters = [], isLoading, refetch } = useNewsletters();
    const { data: stats } = useNewsletterStats();
    const {
        updateNewsletter,
        duplicateNewsletter,
        deleteNewsletter,
        sendNewsletter,
        cancelNewsletter,
    } = useNewsletterMutations();

    const [editingNewsletter, setEditingNewsletter] =
        useState<Newsletter | null>(null);
    const [showRecipientsForId, setShowRecipientsForId] = useState<
        number | null
    >(null);

    const recipientsQuery = useNewsletterRecipients(
        showRecipientsForId,
        undefined,
        !!showRecipientsForId,
    );

    if (!role) return null;

    const handleEdit = (newsletter: Newsletter) => {
        setEditingNewsletter(newsletter);
    };

    const handleSave = async (data: CreateNewsletterRequest) => {
        if (!editingNewsletter) return;
        await updateNewsletter.mutateAsync({
            id: editingNewsletter.id,
            ...data,
        });
        setEditingNewsletter(null);
        await refetch();
    };

    const handleDuplicate = async (id: number) => {
        await duplicateNewsletter.mutateAsync(id);
        await refetch();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Czy na pewno chcesz usunąć ten newsletter?')) {
            return;
        }
        await deleteNewsletter.mutateAsync(id);
        await refetch();
    };

    const handleSend = async (id: number) => {
        await sendNewsletter.mutateAsync({ id });
        await refetch();
    };

    const handleCancel = async (id: number) => {
        await cancelNewsletter.mutateAsync(id);
        await refetch();
    };

    const handleViewRecipients = async (id: number) => {
        setShowRecipientsForId(id);
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:communication">
            <SalonShell role={role}>
                <div className="salonbw-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_communication"
                        items={[
                            { label: 'Komunikacja', href: '/communication' },
                            { label: 'Wiadomości' },
                        ]}
                    />

                    <div className="salonbw-page__toolbar">
                        <Link
                            href="/newsletters/new"
                            className="salonbw-btn salonbw-btn--primary"
                        >
                            + nowy newsletter
                        </Link>
                    </div>

                    <div className="salonbw-mass-communication">
                        <div className="salonbw-mass-communication__section">
                            <h3>
                                Historia wysłanych wiadomości i newsletterów
                            </h3>
                            <div className="salonbw-send-result__stats">
                                <div className="salonbw-stat">
                                    <span className="salonbw-stat__value">
                                        {stats?.totalNewsletters ?? '-'}
                                    </span>
                                    <span className="salonbw-stat__label">
                                        Wszystkich newsletterów
                                    </span>
                                </div>
                                <div className="salonbw-stat salonbw-stat--success">
                                    <span className="salonbw-stat__value">
                                        {stats?.sentNewsletters ?? '-'}
                                    </span>
                                    <span className="salonbw-stat__label">
                                        Wysłanych
                                    </span>
                                </div>
                                <div className="salonbw-stat">
                                    <span className="salonbw-stat__value">
                                        {stats?.draftNewsletters ?? '-'}
                                    </span>
                                    <span className="salonbw-stat__label">
                                        Szkiców
                                    </span>
                                </div>
                                <div className="salonbw-stat">
                                    <span className="salonbw-stat__value">
                                        {stats?.totalRecipients ?? '-'}
                                    </span>
                                    <span className="salonbw-stat__label">
                                        Łącznie odbiorców
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="salonbw-mass-communication__section">
                            <NewslettersList
                                newsletters={newsletters}
                                loading={isLoading}
                                onEdit={handleEdit}
                                onDuplicate={handleDuplicate}
                                onDelete={handleDelete}
                                onSend={handleSend}
                                onCancel={handleCancel}
                                onViewRecipients={handleViewRecipients}
                            />
                        </div>
                    </div>

                    <NewsletterEditorModal
                        isOpen={!!editingNewsletter}
                        newsletter={editingNewsletter}
                        onClose={() => setEditingNewsletter(null)}
                        onSave={handleSave}
                    />

                    {showRecipientsForId ? (
                        <div
                            className="salonbw-modal-overlay"
                            onClick={(event) => {
                                if (event.target === event.currentTarget) {
                                    setShowRecipientsForId(null);
                                }
                            }}
                        >
                            <div className="salonbw-modal communication-preview-modal">
                                <div className="salonbw-modal__header">
                                    <h3>Odbiorcy newslettera</h3>
                                    <button
                                        type="button"
                                        className="salonbw-modal__close"
                                        onClick={() =>
                                            setShowRecipientsForId(null)
                                        }
                                        aria-label="Zamknij listę odbiorców"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="communication-preview-modal__meta">
                                    {recipientsQuery.isLoading ? (
                                        <div>Ładowanie odbiorców...</div>
                                    ) : recipientsQuery.data?.length ? (
                                        <div className="salonbw-table-wrap">
                                            <table className="salonbw-table">
                                                <thead>
                                                    <tr>
                                                        <th>Odbiorca</th>
                                                        <th>Email</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recipientsQuery.data.map(
                                                        (recipient) => (
                                                            <tr
                                                                key={
                                                                    recipient.id
                                                                }
                                                            >
                                                                <td>
                                                                    {recipient.recipientName ||
                                                                        '-'}
                                                                </td>
                                                                <td>
                                                                    {
                                                                        recipient.recipientEmail
                                                                    }
                                                                </td>
                                                                <td>
                                                                    {
                                                                        recipient.status
                                                                    }
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div>
                                            Brak odbiorców dla tej wysyłki.
                                        </div>
                                    )}
                                </div>
                                <div className="salonbw-modal__footer">
                                    <button
                                        type="button"
                                        className="button button-blue"
                                        onClick={() =>
                                            setShowRecipientsForId(null)
                                        }
                                    >
                                        zamknij
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
