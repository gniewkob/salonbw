'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import RouteGuard from '@/components/RouteGuard';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';
import {
    useMessageTemplates,
    useSmsHistory,
    useSmsHistoryItem,
    useSmsMutations,
} from '@/hooks/useSms';
import {
    useEmailHistory,
    useEmailHistoryItem,
    useEmailMutations,
} from '@/hooks/useEmails';
import type { EmailLog, SmsLog } from '@/types';

function formatDateTime(value?: string | null) {
    if (!value) return '-';
    try {
        return format(new Date(value), 'd MMM, HH:mm');
    } catch {
        return '-';
    }
}

function communicationStatusLabel(
    kind: 'sms' | 'email',
    status?: string | null,
) {
    const normalized = (status ?? '').toLowerCase();
    if (kind === 'email') {
        if (normalized === 'sent') return 'Email wysłany';
        if (normalized === 'pending') return 'Email oczekujący';
        if (normalized === 'failed') return 'Email błąd';
        return 'Email';
    }
    if (normalized === 'delivered') return 'SMS Premium';
    if (normalized === 'sent') return 'SMS Standard';
    if (normalized === 'pending') return 'SMS Oczekujący';
    if (normalized === 'failed') return 'SMS Błąd';
    return 'SMS';
}

function getCommunicationHref(id: number, kind: 'sms' | 'email') {
    return {
        pathname: '/communication/[id]',
        query: { id: String(id), kind },
    } as const;
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
    const smsThread = useSmsHistory({
        page: 1,
        limit: 50,
        channel: 'sms',
        appointmentId: smsItem.data?.appointmentId ?? undefined,
        recipientId:
            smsItem.data?.appointmentId || !smsItem.data?.recipientId
                ? undefined
                : smsItem.data.recipientId,
        enabled:
            !!smsItem.data &&
            ((smsItem.data.appointmentId ?? null) !== null ||
                (smsItem.data.recipientId ?? null) !== null),
    });
    const emailThread = useEmailHistory({
        page: 1,
        limit: 50,
        recipientId: emailItem.data?.recipientId ?? undefined,
        enabled: !!emailItem.data?.recipientId,
    });
    const { sendSms } = useSmsMutations();
    const { sendEmailAuth } = useEmailMutations();

    const [replyMode, setReplyMode] = useState<'new' | 'template'>('new');
    const [replyText, setReplyText] = useState('');
    const [replySubject, setReplySubject] = useState('');
    const [booksyPrompt, setBooksyPrompt] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [replyVisible, setReplyVisible] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewMode, setPreviewMode] = useState<'template' | 'draft'>(
        'draft',
    );

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
    const isAmbiguousWithoutKind = !hasExplicitKind && !!sms && !!email;
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
    const smsThreadItems = useMemo(() => {
        if (activeKind !== 'sms' || !sms) {
            return [] as SmsLog[];
        }

        const byId = new Map<number, SmsLog>();
        for (const item of smsThread.data.items) {
            byId.set(item.id, item);
        }
        byId.set(sms.id, sms);

        return Array.from(byId.values()).sort((left, right) => {
            const leftValue = new Date(
                left.sentAt ?? left.createdAt ?? 0,
            ).getTime();
            const rightValue = new Date(
                right.sentAt ?? right.createdAt ?? 0,
            ).getTime();
            return leftValue - rightValue;
        });
    }, [activeKind, sms, smsThread.data.items]);
    const emailThreadItems = useMemo(() => {
        if (activeKind !== 'email' || !email) {
            return [] as EmailLog[];
        }

        const byId = new Map<number, EmailLog>();
        for (const item of emailThread.data.items) {
            byId.set(item.id, {
                id: item.id,
                recipient: item.to,
                subject: item.subject,
                status: item.status,
                sentAt: item.sentAt ?? item.createdAt,
                createdAt: item.createdAt,
                template: item.template,
                errorMessage: item.errorMessage,
                recipientId: item.recipientId,
            });
        }
        byId.set(email.id, email);

        return Array.from(byId.values()).sort((left, right) => {
            const leftValue = new Date(
                left.sentAt ?? left.createdAt ?? 0,
            ).getTime();
            const rightValue = new Date(
                right.sentAt ?? right.createdAt ?? 0,
            ).getTime();
            return leftValue - rightValue;
        });
    }, [activeKind, email, emailThread.data.items]);

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
                    templateId:
                        replyMode === 'template' && selectedTemplate
                            ? selectedTemplate.id
                            : undefined,
                    recipientId: sms?.recipientId,
                    appointmentId: sms?.appointmentId,
                });
                await Promise.all([smsItem.refetch(), smsThread.refetch()]);
            } else {
                await sendEmailAuth.mutateAsync({
                    to: recipientContact,
                    subject:
                        replySubject.trim() || email?.subject || 'Odpowiedź',
                    template: replyText.trim(),
                    recipientId: email?.recipientId ?? undefined,
                });
                await Promise.all([emailItem.refetch(), emailThread.refetch()]);
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

    const handlePreviewTemplate = () => {
        if (!selectedTemplate) return;
        setPreviewMode('template');
        setPreviewVisible(true);
    };

    const handlePreviewDraft = () => {
        if (!replyText.trim()) return;
        setPreviewMode('draft');
        setPreviewVisible(true);
    };

    const previewContent =
        previewMode === 'template'
            ? (selectedTemplate?.content ?? '')
            : replyText.trim();
    const previewSubject =
        activeKind === 'email'
            ? previewMode === 'template'
                ? selectedTemplate?.subject || defaultReplySubject
                : replySubject.trim() || defaultReplySubject
            : '';
    const previewHeading =
        previewMode === 'template' ? 'Podgląd szablonu' : 'Podgląd wiadomości';

    const handleModifySelectedTemplate = () => {
        if (!selectedTemplate) {
            return;
        }

        setReplyMode('new');
        setReplyText(selectedTemplate.content);
        if (activeKind === 'email') {
            setReplySubject(selectedTemplate.subject || defaultReplySubject);
        }
    };

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:communication">
            <SalonBWShell role={role}>
                <div className="salonbw-page communication-detail-page">
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
                    ) : isAmbiguousWithoutKind ? (
                        <div className="products-empty">
                            Ten identyfikator istnieje zarówno w historii SMS,
                            jak i email. Wybierz właściwy typ wiadomości:
                            <div className="mt-m">
                                <Link
                                    className="button"
                                    href={getCommunicationHref(id!, 'sms')}
                                >
                                    otwórz jako SMS
                                </Link>
                                <Link
                                    className="button ml-s"
                                    href={getCommunicationHref(id!, 'email')}
                                >
                                    otwórz jako email
                                </Link>
                            </div>
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
                                {activeKind === 'sms' &&
                                smsThreadItems.length > 0 ? (
                                    smsThreadItems.map((item) => {
                                        const isCustomerMessage =
                                            !item.sentBy?.id &&
                                            (item.recipientId ?? null) !==
                                                (sms?.recipientId ?? null);
                                        return (
                                            <div
                                                key={item.id}
                                                className={`message ${
                                                    isCustomerMessage
                                                        ? 'customer'
                                                        : 'salon'
                                                }`}
                                            >
                                                <div className="header">
                                                    <strong>
                                                        {formatDateTime(
                                                            item.sentAt ||
                                                                item.createdAt ||
                                                                null,
                                                        )}
                                                    </strong>{' '}
                                                    (
                                                    {communicationStatusLabel(
                                                        'sms',
                                                        item.status,
                                                    )}
                                                    ) |{' '}
                                                    {isCustomerMessage
                                                        ? 'Nadawca:'
                                                        : 'Odbiorca:'}{' '}
                                                    <strong>
                                                        {isCustomerMessage ? (
                                                            recipientName
                                                        ) : detail.recipientUser
                                                              ?.id ? (
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
                                                        onClick={
                                                            handleShowReply
                                                        }
                                                    >
                                                        {isCustomerMessage
                                                            ? item.recipient
                                                            : recipientContact}
                                                    </button>
                                                    )
                                                </div>
                                                <div className="text">
                                                    {item.content}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : activeKind === 'email' &&
                                  emailThreadItems.length > 0 ? (
                                    emailThreadItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="message salon"
                                        >
                                            <div className="header">
                                                <strong>
                                                    {formatDateTime(
                                                        item.sentAt ||
                                                            item.createdAt ||
                                                            null,
                                                    )}
                                                </strong>{' '}
                                                (
                                                {communicationStatusLabel(
                                                    'email',
                                                    item.status,
                                                )}
                                                ) | Odbiorca:{' '}
                                                <strong>
                                                    {detail.recipientUser
                                                        ?.id ? (
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
                                                {item.template || item.subject}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="message salon">
                                        <div className="header">
                                            <strong>
                                                {formatDateTime(
                                                    detail.sentAt ||
                                                        detail.createdAt ||
                                                        null,
                                                )}
                                            </strong>{' '}
                                            (
                                            {communicationStatusLabel(
                                                activeKind,
                                                detail.status,
                                            )}
                                            ) | Odbiorca:{' '}
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
                                                : email?.template ||
                                                  email?.subject}
                                        </div>
                                    </div>
                                )}

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
                                                    <div className="communication-template-actions">
                                                        <button
                                                            type="button"
                                                            className="button button-link"
                                                            onClick={
                                                                handlePreviewTemplate
                                                            }
                                                            disabled={
                                                                !selectedTemplate
                                                            }
                                                        >
                                                            Podgląd
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="button"
                                                            onClick={
                                                                handleModifySelectedTemplate
                                                            }
                                                            disabled={
                                                                !selectedTemplate
                                                            }
                                                        >
                                                            Zmień treść
                                                            wybranego szablonu
                                                        </button>
                                                    </div>
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
                                                    <button
                                                        type="button"
                                                        className="button button-link"
                                                        onClick={
                                                            handlePreviewDraft
                                                        }
                                                        disabled={
                                                            !replyText.trim()
                                                        }
                                                    >
                                                        Podgląd
                                                    </button>
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
                {previewVisible ? (
                    <div
                        className="salonbw-modal-overlay"
                        onClick={(event) => {
                            if (event.target === event.currentTarget) {
                                setPreviewVisible(false);
                            }
                        }}
                    >
                        <div className="salonbw-modal communication-preview-modal">
                            <div className="salonbw-modal__header">
                                <h3>{previewHeading}</h3>
                                <button
                                    type="button"
                                    className="salonbw-modal__close"
                                    onClick={() => setPreviewVisible(false)}
                                    aria-label="Zamknij podgląd wiadomości"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="communication-preview-modal__meta">
                                <div>
                                    <strong>Odbiorca:</strong> {recipientName}{' '}
                                    {recipientContact
                                        ? `(${recipientContact})`
                                        : ''}
                                </div>
                                <div>
                                    <strong>Kanał:</strong>{' '}
                                    {activeKind === 'sms' ? 'SMS' : 'E-mail'}
                                </div>
                                {previewMode === 'template' &&
                                selectedTemplate ? (
                                    <div>
                                        <strong>Szablon:</strong>{' '}
                                        {selectedTemplate.name}
                                    </div>
                                ) : null}
                            </div>
                            {activeKind === 'email' ? (
                                <div className="communication-preview-email">
                                    <div className="communication-preview-email__subject">
                                        Temat: {previewSubject}
                                    </div>
                                    <div className="communication-preview-email__body">
                                        {previewContent}
                                    </div>
                                </div>
                            ) : (
                                <div className="communication-preview-sms">
                                    {previewContent}
                                </div>
                            )}
                            <div className="salonbw-modal__footer">
                                <button
                                    type="button"
                                    className="button button-blue"
                                    onClick={() => setPreviewVisible(false)}
                                >
                                    zamknij
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </SalonBWShell>
        </RouteGuard>
    );
}
