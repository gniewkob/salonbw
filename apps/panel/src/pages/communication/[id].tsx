'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import { useEmailHistoryItem, useEmailMutations } from '@/hooks/useEmails';
import { useSmsHistoryItem, useSmsMutations } from '@/hooks/useSms';

function formatDateTime(value?: string | null) {
    if (!value) return '-';
    try {
        return format(new Date(value), 'd MMM, HH:mm');
    } catch {
        return '-';
    }
}

function messageLabel(status?: string) {
    const normalized = (status ?? '').toLowerCase();
    if (normalized === 'delivered') return 'SMS Premium';
    if (normalized === 'sent') return 'SMS Standard';
    if (normalized === 'pending') return 'SMS Oczekujący';
    if (normalized === 'failed') return 'SMS Błąd';
    return 'SMS';
}

export default function CommunicationDetailPage() {
    const { role } = useAuth();
    const router = useRouter();
    const rawId = Array.isArray(router.query.id)
        ? router.query.id[0]
        : router.query.id;
    const kind = Array.isArray(router.query.kind)
        ? router.query.kind[0]
        : router.query.kind;
    const id = rawId ? Number(rawId) : null;

    const smsItem = useSmsHistoryItem(kind === 'email' ? null : id);
    const emailItem = useEmailHistoryItem(kind === 'sms' ? null : id);
    const { sendSms } = useSmsMutations();
    const { sendEmailAuth } = useEmailMutations();

    const [replyMode, setReplyMode] = useState<'new' | 'template'>('new');
    const [replyText, setReplyText] = useState('');
    const [booksyPrompt, setBooksyPrompt] = useState(false);
    const [isSending, setIsSending] = useState(false);

    if (!role) return null;

    const sms = smsItem.data;
    const email = emailItem.data;
    const activeKind =
        kind === 'sms' || (kind !== 'email' && sms) ? 'sms' : 'email';
    const loading =
        activeKind === 'sms'
            ? smsItem.loading
            : activeKind === 'email'
              ? emailItem.loading
              : smsItem.loading || emailItem.loading;
    const detail = activeKind === 'sms' ? sms : email;

    const recipientName =
        activeKind === 'sms'
            ? (sms?.recipientUser?.name ?? sms?.recipient ?? '')
            : (email?.recipientUser?.name ?? email?.recipient ?? '');
    const recipientContact =
        activeKind === 'sms'
            ? (sms?.recipient ?? '')
            : (email?.recipient ?? '');

    const handleSendReply = async () => {
        if (!detail || !replyText.trim()) return;

        setIsSending(true);
        try {
            if (activeKind === 'sms') {
                await sendSms.mutateAsync({
                    recipient: recipientContact,
                    content: replyText.trim(),
                    recipientId: sms?.recipientId,
                    appointmentId: sms?.appointmentId,
                });
                await smsItem.refetch();
            } else {
                await sendEmailAuth.mutateAsync({
                    to: recipientContact,
                    subject: email?.subject || 'Odpowiedź',
                    template: replyText.trim(),
                    recipientId: email?.recipientId ?? undefined,
                });
                await emailItem.refetch();
            }
            setReplyText('');
        } catch (error) {
            console.error('Failed to send reply:', error);
            alert('Wystąpił błąd podczas wysyłania wiadomości');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:communication">
            <VersumShell role={role}>
                <div className="versum-page communication-detail-page">
                    <div className="breadcrumbs" e2e-breadcrumbs="">
                        <ul>
                            <li>
                                <div className="icon sprite-breadcrumbs_communication_set" />
                                <Link href="/communication">Łączność</Link>
                            </li>
                            <li>
                                <span> / </span>
                                {activeKind === 'sms'
                                    ? 'Wiadomość SMS'
                                    : 'Wiadomość email'}
                            </li>
                        </ul>
                    </div>

                    {loading ? (
                        <div className="products-empty">
                            Ładowanie wiadomości...
                        </div>
                    ) : !detail ? (
                        <div className="products-empty">
                            Nie znaleziono wiadomości.
                        </div>
                    ) : (
                        <div className="communication-detail-layout">
                            <div className="row mb-l">
                                <div className="col-xs-12 text-right">
                                    <button
                                        type="button"
                                        className="button button-dropdown"
                                        disabled
                                    >
                                        operacje
                                    </button>
                                </div>
                            </div>

                            {activeKind === 'sms' && sms?.appointment ? (
                                <div className="communication-reminder-card">
                                    <div>Przypomnienie o wizycie</div>
                                    <div>
                                        Data wizyty:{' '}
                                        {formatDateTime(
                                            sms.appointment.startTime,
                                        )}
                                    </div>
                                    <ul>
                                        <li>
                                            {sms.appointment.service?.name ||
                                                'Usługa'}{' '}
                                            -{' '}
                                            {sms.appointment.employee?.name ||
                                                'Pracownik'}
                                        </li>
                                    </ul>
                                    <br />
                                    <Link
                                        className="button"
                                        href={`/calendar?event=${sms.appointment.id}`}
                                    >
                                        Pokaż wizytę w kalendarzu
                                    </Link>
                                </div>
                            ) : null}

                            <div className="sms_thread">
                                <div className="message salon">
                                    <div className="header">
                                        <strong>
                                            {formatDateTime(
                                                detail.sentAt ||
                                                    detail.createdAt ||
                                                    null,
                                            )}
                                        </strong>{' '}
                                        ({messageLabel(detail.status)}) |{' '}
                                        {activeKind === 'sms'
                                            ? 'Odbiorca:'
                                            : 'Odbiorca:'}{' '}
                                        <strong>
                                            {sms?.recipientUser?.id ? (
                                                <Link
                                                    href={`/customers/${sms.recipientUser.id}`}
                                                >
                                                    {recipientName}
                                                </Link>
                                            ) : (
                                                recipientName
                                            )}
                                        </strong>{' '}
                                        (
                                        <a href={`tel:${recipientContact}`}>
                                            {recipientContact}
                                        </a>
                                        )
                                    </div>
                                    <div className="text">
                                        {activeKind === 'sms'
                                            ? sms?.content
                                            : email?.template || email?.subject}
                                    </div>
                                </div>

                                {activeKind === 'sms' &&
                                sms?.status === 'delivered' ? (
                                    <div className="customer message">
                                        <div className="header">
                                            <strong>
                                                {formatDateTime(
                                                    sms.deliveredAt ||
                                                        sms.sentAt ||
                                                        null,
                                                )}
                                            </strong>{' '}
                                            (SMS Premium) |
                                            <br />
                                            Nadawca: {recipientName} (
                                            <a href={`tel:${recipientContact}`}>
                                                {recipientContact}
                                            </a>
                                            )
                                        </div>
                                        <div className="text">Dostarczono</div>
                                    </div>
                                ) : null}
                            </div>

                            <hr />

                            <div id="reply_form">
                                <ol className="communication-reply-list">
                                    <li className="control-group">
                                        <label className="control-label">
                                            Dane odbiorcy
                                        </label>
                                        <div className="controls">
                                            {recipientName}
                                        </div>
                                    </li>
                                    <li className="control-group">
                                        <label className="control-label">
                                            Szablon
                                        </label>
                                        <div className="controls">
                                            <div className="radio-inline">
                                                <label className="auto-width">
                                                    <input
                                                        className="mr-s"
                                                        type="radio"
                                                        checked={
                                                            replyMode === 'new'
                                                        }
                                                        onChange={() =>
                                                            setReplyMode('new')
                                                        }
                                                    />
                                                    Podaj treść
                                                </label>
                                            </div>
                                            <div className="radio-inline">
                                                <label className="auto-width">
                                                    <input
                                                        className="mr-s"
                                                        type="radio"
                                                        checked={
                                                            replyMode ===
                                                            'template'
                                                        }
                                                        onChange={() =>
                                                            setReplyMode(
                                                                'template',
                                                            )
                                                        }
                                                    />
                                                    Użyj szablonu
                                                </label>
                                            </div>
                                        </div>
                                    </li>
                                    <li className="control-group">
                                        <label
                                            className="control-label"
                                            htmlFor="reply-content"
                                        >
                                            Treść wiadomości
                                        </label>
                                        <div className="controls">
                                            <textarea
                                                id="reply-content"
                                                className="form-control communication-reply-textarea"
                                                value={replyText}
                                                onChange={(event) =>
                                                    setReplyText(
                                                        event.target.value,
                                                    )
                                                }
                                                rows={6}
                                            />
                                            <div className="communication-reply-meta">
                                                <div>
                                                    Liczba znaków:{' '}
                                                    {replyText.length} (liczba
                                                    wiadomości SMS:{' '}
                                                    {replyText.length === 0
                                                        ? 0
                                                        : Math.ceil(
                                                              replyText.length /
                                                                  160,
                                                          )}
                                                    )
                                                </div>
                                                <p>
                                                    Pamiętaj o podaniu nazwy
                                                    firmy oraz numeru
                                                    kontaktowego
                                                </p>
                                                <Link href="/communication/templates">
                                                    Podgląd
                                                </Link>
                                            </div>
                                        </div>
                                    </li>
                                    {activeKind === 'sms' ? (
                                        <li className="control-group">
                                            <label className="communication-booksy-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={booksyPrompt}
                                                    onChange={(event) =>
                                                        setBooksyPrompt(
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                />
                                                <span>
                                                    Dodaj zachętę do umówienia
                                                    się na wizytę przez
                                                    aplikację Booksy
                                                </span>
                                            </label>
                                        </li>
                                    ) : null}
                                </ol>

                                <button
                                    type="button"
                                    className="button button-blue"
                                    disabled={isSending || !replyText.trim()}
                                    onClick={() => void handleSendReply()}
                                >
                                    wyślij wiadomość
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
