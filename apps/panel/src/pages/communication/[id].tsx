'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import {
    useMessageTemplates,
    useSmsHistoryItem,
    useSmsMutations,
} from '@/hooks/useSms';
import { useEmailHistoryItem, useEmailMutations } from '@/hooks/useEmails';

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

    const hasExplicitKind = kind === 'sms' || kind === 'email';
    const smsItem = useSmsHistoryItem(kind === 'email' ? null : id);
    const emailItem = useEmailHistoryItem(kind === 'sms' ? null : id);
    const { sendSms } = useSmsMutations();
    const { sendEmailAuth } = useEmailMutations();

    const [replyMode, setReplyMode] = useState<'new' | 'template'>('new');
    const [replyText, setReplyText] = useState('');
    const [replySubject, setReplySubject] = useState('');
    const [booksyPrompt, setBooksyPrompt] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [replyVisible, setReplyVisible] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    const sms = smsItem.data;
    const email = emailItem.data;
    const activeKind = hasExplicitKind
        ? kind
        : sms
          ? 'sms'
          : email
            ? 'email'
            : 'sms';
    const loading = hasExplicitKind
        ? activeKind === 'sms'
            ? smsItem.loading
            : emailItem.loading
        : smsItem.loading || emailItem.loading;
    const detail = activeKind === 'sms' ? sms : email;
    const templates = useMessageTemplates({
        channel: activeKind,
        isActive: true,
        enabled: !!id,
    });
    const selectedTemplate = useMemo(
        () =>
            templates.data.find(
                (template) => String(template.id) === selectedTemplateId,
            ) ?? null,
        [selectedTemplateId, templates.data],
    );

    const recipientName =
        activeKind === 'sms'
            ? (sms?.recipientUser?.name ?? sms?.recipient ?? '')
            : (email?.recipientUser?.name ?? email?.recipient ?? '');
    const recipientContact =
        activeKind === 'sms'
            ? (sms?.recipient ?? '')
            : (email?.recipient ?? '');
    const defaultReplySubject = email?.subject
        ? `Re: ${email.subject}`
        : 'Odpowiedź';

    useEffect(() => {
        if (activeKind === 'email') {
            setReplySubject(defaultReplySubject);
        } else {
            setReplySubject('');
        }
    }, [activeKind, defaultReplySubject]);

    useEffect(() => {
        if (replyMode !== 'template') return;
        if (!selectedTemplate) {
            setReplyText('');
            if (activeKind === 'email') {
                setReplySubject(defaultReplySubject);
            }
            return;
        }

        setReplyText(selectedTemplate.content);
        if (activeKind === 'email') {
            setReplySubject(selectedTemplate.subject || defaultReplySubject);
        }
    }, [activeKind, defaultReplySubject, replyMode, selectedTemplate]);

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
                    subject:
                        replySubject.trim() || email?.subject || 'Odpowiedź',
                    template: replyText.trim(),
                    recipientId: email?.recipientId ?? undefined,
                });
                await emailItem.refetch();
            }
            setReplyText('');
            if (activeKind === 'email') {
                setReplySubject(defaultReplySubject);
            }
            setSelectedTemplateId('');
            setReplyMode('new');
            setReplyVisible(false);
        } catch (error) {
            console.error('Failed to send reply:', error);
            alert('Wystąpił błąd podczas wysyłania wiadomości');
        } finally {
            setIsSending(false);
        }
    };

    const handleShowReply = () => {
        setReplyVisible(true);
    };

    if (!role) return null;

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
                                            {detail.recipientUser?.id ? (
                                                <Link
                                                    href={`/customers/${detail.recipientUser.id}`}
                                                >
                                                    {recipientName}
                                                </Link>
                                            ) : (
                                                recipientName
                                            )}
                                        </strong>{' '}
                                        (
                                        <button
                                            type="button"
                                            className="communication-inline-link"
                                            onClick={handleShowReply}
                                        >
                                            {recipientContact}
                                        </button>
                                        )
                                    </div>
                                    <div className="text">
                                        {activeKind === 'sms'
                                            ? sms?.content
                                            : email?.template || email?.subject}
                                    </div>
                                </div>

                                {activeKind === 'sms' &&
                                (sms?.deliveredAt || sms?.errorMessage) ? (
                                    <div className="communication-detail-status">
                                        {sms?.deliveredAt ? (
                                            <div>
                                                Dostarczono:{' '}
                                                <strong>
                                                    {formatDateTime(
                                                        sms.deliveredAt,
                                                    )}
                                                </strong>
                                            </div>
                                        ) : null}
                                        {sms?.errorMessage ? (
                                            <div>
                                                Błąd dostarczenia:{' '}
                                                <strong>
                                                    {sms.errorMessage}
                                                </strong>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>

                            <hr />

                            {replyVisible ? (
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
                                                                replyMode ===
                                                                'new'
                                                            }
                                                            onChange={() =>
                                                                setReplyMode(
                                                                    'new',
                                                                )
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
                                        {replyMode === 'template' ? (
                                            <li className="control-group">
                                                <label
                                                    className="control-label"
                                                    htmlFor="reply-template"
                                                >
                                                    Istniejący szablon
                                                </label>
                                                <div className="controls">
                                                    <select
                                                        id="reply-template"
                                                        className="form-control communication-reply-select"
                                                        value={
                                                            selectedTemplateId
                                                        }
                                                        onChange={(event) =>
                                                            setSelectedTemplateId(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            wybierz szablon
                                                        </option>
                                                        {templates.data.map(
                                                            (template) => (
                                                                <option
                                                                    key={
                                                                        template.id
                                                                    }
                                                                    value={
                                                                        template.id
                                                                    }
                                                                >
                                                                    {
                                                                        template.name
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                            </li>
                                        ) : null}
                                        {activeKind === 'email' ? (
                                            <li className="control-group">
                                                <label
                                                    className="control-label"
                                                    htmlFor="reply-subject"
                                                >
                                                    Tytuł wiadomości
                                                </label>
                                                <div className="controls">
                                                    <input
                                                        id="reply-subject"
                                                        type="text"
                                                        className="form-control communication-reply-input"
                                                        value={replySubject}
                                                        onChange={(event) =>
                                                            setReplySubject(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </li>
                                        ) : null}
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
                                                        {replyText.length}{' '}
                                                        (liczba wiadomości SMS:{' '}
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
                                                        Dodaj zachętę do
                                                        umówienia się na wizytę
                                                        przez aplikację Booksy
                                                    </span>
                                                </label>
                                            </li>
                                        ) : null}
                                    </ol>

                                    <button
                                        type="button"
                                        className="button button-blue"
                                        disabled={
                                            isSending ||
                                            !replyText.trim() ||
                                            (activeKind === 'email' &&
                                                !replySubject.trim())
                                        }
                                        onClick={() => void handleSendReply()}
                                    >
                                        wyślij wiadomość
                                    </button>
                                </div>
                            ) : (
                                <div className="buttons_bottom">
                                    <div className="l">
                                        <button
                                            type="button"
                                            className="button button-blue"
                                            onClick={handleShowReply}
                                        >
                                            Wyślij odpowiedź do: {recipientName}{' '}
                                            (
                                            {activeKind === 'sms'
                                                ? 'SMS'
                                                : 'email'}
                                            )
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
