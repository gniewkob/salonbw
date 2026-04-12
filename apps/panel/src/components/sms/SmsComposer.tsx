'use client';

import { useState } from 'react';
import type { MessageTemplate } from '@/types';

interface Props {
    templates: MessageTemplate[];
    onSend: (data: {
        recipient: string;
        content: string;
        templateId?: number;
    }) => Promise<void>;
    sending?: boolean;
}

export default function SmsComposer({ templates, onSend, sending }: Props) {
    const [recipient, setRecipient] = useState('');
    const [content, setContent] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
        null,
    );

    const handleTemplateSelect = (templateId: number | null) => {
        setSelectedTemplateId(templateId);
        if (templateId) {
            const template = templates.find((t) => t.id === templateId);
            if (template) {
                setContent(template.content);
            }
        }
    };

    const handleSend = async () => {
        if (!recipient || !content) return;

        await onSend({
            recipient,
            content,
            templateId: selectedTemplateId ?? undefined,
        });

        // Clear form after sending
        setRecipient('');
        setContent('');
        setSelectedTemplateId(null);
    };

    const charCount = content.length;
    const smsCount = Math.ceil(charCount / 160) || 1;

    return (
        <div className="bg-white rounded-3 shadow p-4">
            <h3 className="fs-5 fw-semibold text-dark mb-3">
                Wyślij wiadomość SMS
            </h3>

            <div className="gap-2">
                {/* Recipient */}
                <div>
                    <label className="d-block small fw-medium text-body mb-1">
                        Numer telefonu
                    </label>
                    <input
                        type="tel"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="+48 123 456 789"
                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                    />
                </div>

                {/* Template selector */}
                {templates.length > 0 && (
                    <div>
                        <label className="d-block small fw-medium text-body mb-1">
                            Użyj szablonu (opcjonalnie)
                        </label>
                        <select
                            value={selectedTemplateId ?? ''}
                            onChange={(e) =>
                                handleTemplateSelect(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                        >
                            <option value="">-- Bez szablonu --</option>
                            {templates.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Content */}
                <div>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                        <label className="d-block small fw-medium text-body">
                            Treść wiadomości
                        </label>
                        <span className="small text-muted">
                            {charCount} znaków ({smsCount} SMS)
                        </span>
                    </div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                        placeholder="Wpisz treść wiadomości..."
                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus: resize-none"
                    />
                    <p className="mt-1 small text-muted">
                        Zmienne typu {'{'}
                        {'{'} customer_name {'}'}
                        {'}'} zostaną automatycznie zastąpione danymi klienta.
                    </p>
                </div>

                {/* Send button */}
                <button
                    type="button"
                    onClick={() => {
                        void handleSend();
                    }}
                    disabled={sending || !recipient || !content}
                    className="w-100 px-3 py-2 bg-primary bg-opacity-10 text-white rounded-3 fw-medium bg-opacity-10 disabled: d-flex align-items-center justify-content-center gap-2"
                >
                    {sending ? (
                        <>
                            <div className="rounded-circle h-4 w-4 border border-2 border-white border-top-transparent"></div>
                            Wysyłanie...
                        </>
                    ) : (
                        <>
                            <svg
                                className="w-4 h-4"
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
                            Wyślij SMS
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
