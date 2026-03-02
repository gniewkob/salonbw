'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerGroups, useCustomers } from '@/hooks/useCustomers';
import { useEmailMutations } from '@/hooks/useEmails';
import { useMessageTemplates, useSmsMutations } from '@/hooks/useSms';
import type { MessageChannel } from '@/types';

export default function MassCommunicationPage() {
    const { role } = useAuth();
    const { data: groups = [] } = useCustomerGroups();
    const { data: customersData } = useCustomers({ limit: 1000 });
    const { data: templates = [] } = useMessageTemplates();
    const { sendBulkSms } = useSmsMutations();
    const { sendBulkEmail } = useEmailMutations();

    const customers = useMemo(
        () => customersData?.items ?? [],
        [customersData?.items],
    );

    const [step, setStep] = useState<'recipients' | 'message' | 'preview'>(
        'recipients',
    );
    const [channel, setChannel] = useState<MessageChannel>('sms');

    // Recipients selection
    const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
    const [includeAll, setIncludeAll] = useState(false);

    // Message
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
        null,
    );
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState<{
        success: number;
        failed: number;
        total: number;
    } | null>(null);

    const filteredTemplates = useMemo(
        () =>
            templates.filter(
                (t) => t.channel === channel && t.isActive !== false,
            ),
        [templates, channel],
    );

    // Calculate recipients with contact info filtering
    const { recipientCount, recipientContacts } = useMemo(() => {
        let selectedCustomers = customers;

        if (!includeAll && selectedGroupIds.length > 0) {
            selectedCustomers = customers.filter((c) =>
                c.groups?.some((g) => selectedGroupIds.includes(g.id)),
            );
        }

        const contacts = selectedCustomers
            .map((c) => (channel === 'sms' ? c.phone : c.email))
            .filter(
                (contact): contact is string => !!contact && contact.length > 0,
            );

        return {
            recipientCount: contacts.length,
            recipientContacts: contacts,
        };
    }, [includeAll, selectedGroupIds, customers, channel]);

    const handleTemplateSelect = (templateId: number) => {
        setSelectedTemplateId(templateId);
        const template = templates.find((t) => t.id === templateId);
        if (template) {
            setContent(template.content);
            if (template.subject) setSubject(template.subject);
        }
    };

    const handleSend = async () => {
        if (recipientContacts.length === 0) return;

        setIsSending(true);
        try {
            if (channel === 'email') {
                await sendBulkEmail.mutateAsync({
                    recipients: recipientContacts,
                    subject,
                    template: content,
                });
                setSendResult({
                    success: recipientContacts.length,
                    failed: 0,
                    total: recipientContacts.length,
                });
            } else {
                const result = await sendBulkSms.mutateAsync({
                    recipients: recipientContacts,
                    content,
                    templateId: selectedTemplateId ?? undefined,
                });
                setSendResult(result);
            }
            setStep('preview');
        } catch (error) {
            console.error('Failed to send:', error);
            alert('Wystąpił błąd podczas wysyłania');
        }
        setIsSending(false);
    };

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:communication">
            <VersumShell role={role}>
                <div className="versum-page">
                    <ul className="breadcrumb">
                        <li>
                            <Link href="/communication">Łączność</Link>
                        </li>
                        <li>Wyślij wiadomość masową</li>
                    </ul>

                    {/* Step indicator */}
                    <div className="versum-steps">
                        <div
                            className={`versum-step ${step === 'recipients' ? 'active' : ''}`}
                        >
                            <span className="versum-step__number">1</span>
                            <span className="versum-step__label">Odbiorcy</span>
                        </div>
                        <div className="versum-step__divider"></div>
                        <div
                            className={`versum-step ${step === 'message' ? 'active' : ''}`}
                        >
                            <span className="versum-step__number">2</span>
                            <span className="versum-step__label">Treść</span>
                        </div>
                        <div className="versum-step__divider"></div>
                        <div
                            className={`versum-step ${step === 'preview' ? 'active' : ''}`}
                        >
                            <span className="versum-step__number">3</span>
                            <span className="versum-step__label">
                                Podsumowanie
                            </span>
                        </div>
                    </div>

                    {/* Step 1: Recipients */}
                    {step === 'recipients' && (
                        <div className="versum-mass-communication">
                            <div className="versum-mass-communication__section">
                                <h3>Kanał komunikacji</h3>
                                <div className="versum-channel-selector">
                                    <label
                                        className={`versum-channel ${channel === 'sms' ? 'active' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            value="sms"
                                            checked={channel === 'sms'}
                                            onChange={() => {
                                                setChannel('sms');
                                                setSelectedTemplateId(null);
                                                setContent('');
                                            }}
                                        />
                                        <span className="versum-channel__icon">
                                            📱
                                        </span>
                                        <span>SMS</span>
                                    </label>
                                    <label
                                        className={`versum-channel ${channel === 'email' ? 'active' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            value="email"
                                            checked={channel === 'email'}
                                            onChange={() => {
                                                setChannel('email');
                                                setSelectedTemplateId(null);
                                                setContent('');
                                            }}
                                        />
                                        <span className="versum-channel__icon">
                                            ✉️
                                        </span>
                                        <span>Email</span>
                                    </label>
                                </div>
                            </div>

                            <div className="versum-mass-communication__section">
                                <h3>Wybierz odbiorców</h3>

                                <label className="versum-checkbox-row">
                                    <input
                                        type="checkbox"
                                        checked={includeAll}
                                        onChange={(e) => {
                                            setIncludeAll(e.target.checked);
                                            setSelectedGroupIds([]);
                                        }}
                                    />
                                    <span>
                                        Wszyscy klienci ({customers.length})
                                    </span>
                                </label>

                                {!includeAll && (
                                    <div className="versum-mass-communication__subsection">
                                        <h4>Grupy klientów</h4>
                                        {groups.length === 0 ? (
                                            <p className="versum-muted">
                                                Brak zdefiniowanych grup
                                            </p>
                                        ) : (
                                            groups.map((group) => (
                                                <label
                                                    key={group.id}
                                                    className="versum-checkbox-row"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGroupIds.includes(
                                                            group.id,
                                                        )}
                                                        onChange={(e) => {
                                                            if (
                                                                e.target.checked
                                                            ) {
                                                                setSelectedGroupIds(
                                                                    [
                                                                        ...selectedGroupIds,
                                                                        group.id,
                                                                    ],
                                                                );
                                                            } else {
                                                                setSelectedGroupIds(
                                                                    selectedGroupIds.filter(
                                                                        (id) =>
                                                                            id !==
                                                                            group.id,
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <span
                                                        className="versum-group-dot"
                                                        {...{
                                                            style: {
                                                                backgroundColor:
                                                                    group.color ||
                                                                    '#999',
                                                            },
                                                        }}
                                                    />
                                                    <span>
                                                        {group.name} (
                                                        {group.memberCount || 0}
                                                        )
                                                    </span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="versum-mass-communication__footer">
                                <span className="versum-recipient-count">
                                    Wybrano odbiorców:{' '}
                                    <strong>{recipientCount}</strong>
                                    {recipientCount < customers.length && (
                                        <span className="versum-muted">
                                            {' '}
                                            (z {customers.length} klientów)
                                        </span>
                                    )}
                                </span>
                                <button
                                    type="button"
                                    className="versum-btn versum-btn--primary"
                                    disabled={recipientCount === 0}
                                    onClick={() => setStep('message')}
                                >
                                    Dalej
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Message */}
                    {step === 'message' && (
                        <div className="versum-mass-communication">
                            <div className="versum-mass-communication__section">
                                <h3>Wybierz szablon</h3>
                                {filteredTemplates.length === 0 ? (
                                    <p className="versum-muted">
                                        Brak szablonów dla wybranego kanału
                                    </p>
                                ) : (
                                    <div className="versum-template-list">
                                        {filteredTemplates.map((template) => (
                                            <div
                                                key={template.id}
                                                className={`versum-template-item ${selectedTemplateId === template.id ? 'active' : ''}`}
                                                onClick={() =>
                                                    handleTemplateSelect(
                                                        template.id,
                                                    )
                                                }
                                            >
                                                <span className="versum-template-item__name">
                                                    {template.name}
                                                </span>
                                                <span className="versum-template-item__preview">
                                                    {template.content.slice(
                                                        0,
                                                        60,
                                                    )}
                                                    {template.content.length >
                                                    60
                                                        ? '...'
                                                        : ''}
                                                </span>
                                                {template.type && (
                                                    <span className="versum-badge versum-badge--sm">
                                                        {template.type}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="versum-mass-communication__section">
                                <h3>Treść wiadomości</h3>

                                {channel === 'email' && (
                                    <div className="versum-form-group">
                                        <label>Temat</label>
                                        <input
                                            type="text"
                                            className="versum-input"
                                            value={subject}
                                            onChange={(e) =>
                                                setSubject(e.target.value)
                                            }
                                            placeholder="Wpisz temat wiadomości"
                                        />
                                    </div>
                                )}

                                <div className="versum-form-group">
                                    <label>Treść</label>
                                    <textarea
                                        className="versum-textarea"
                                        value={content}
                                        onChange={(e) => {
                                            setContent(e.target.value);
                                            if (selectedTemplateId)
                                                setSelectedTemplateId(null);
                                        }}
                                        rows={6}
                                        placeholder="Wpisz treść wiadomości..."
                                    />
                                    <span className="versum-char-count">
                                        {content.length} znaków
                                        {channel === 'sms' && (
                                            <>
                                                ,{' '}
                                                {Math.ceil(
                                                    content.length / 160,
                                                )}{' '}
                                                SMS
                                            </>
                                        )}
                                    </span>
                                </div>

                                <div className="versum-variables-help">
                                    <h4>Dostępne zmienne:</h4>
                                    <code>{'{{client_name}}'}</code>
                                    <code>{'{{salon_name}}'}</code>
                                    <code>{'{{salon_phone}}'}</code>
                                    <code>{'{{date}}'}</code>
                                    <code>{'{{time}}'}</code>
                                </div>
                            </div>

                            <div className="versum-mass-communication__footer">
                                <button
                                    type="button"
                                    className="versum-btn versum-btn--light"
                                    onClick={() => setStep('recipients')}
                                >
                                    Wstecz
                                </button>
                                <button
                                    type="button"
                                    className="versum-btn versum-btn--primary"
                                    disabled={
                                        !content.trim() ||
                                        (channel === 'email' &&
                                            !subject.trim()) ||
                                        isSending
                                    }
                                    onClick={() => void handleSend()}
                                >
                                    {isSending
                                        ? 'Wysyłanie...'
                                        : `Wyślij do ${recipientCount} odbiorców`}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Preview/Result */}
                    {step === 'preview' && sendResult && (
                        <div className="versum-mass-communication versum-mass-communication--success">
                            <div className="versum-send-result">
                                <div className="versum-send-result__icon">
                                    ✓
                                </div>
                                <h3>Wiadomość została wysłana</h3>

                                <div className="versum-send-result__stats">
                                    <div className="versum-stat versum-stat--success">
                                        <span className="versum-stat__value">
                                            {sendResult.success}
                                        </span>
                                        <span className="versum-stat__label">
                                            Wysłanych
                                        </span>
                                    </div>
                                    {sendResult.failed > 0 && (
                                        <div className="versum-stat versum-stat--error">
                                            <span className="versum-stat__value">
                                                {sendResult.failed}
                                            </span>
                                            <span className="versum-stat__label">
                                                Nieudanych
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className="versum-btn versum-btn--primary"
                                    onClick={() => {
                                        setStep('recipients');
                                        setSendResult(null);
                                        setContent('');
                                        setSubject('');
                                        setSelectedTemplateId(null);
                                        setSelectedGroupIds([]);
                                        setIncludeAll(false);
                                    }}
                                >
                                    Wyślij kolejną wiadomość
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
