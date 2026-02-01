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
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Wyślij wiadomość SMS
            </h3>

            <div className="space-y-4">
                {/* Recipient */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numer telefonu
                    </label>
                    <input
                        type="tel"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="+48 123 456 789"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>

                {/* Template selector */}
                {templates.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Treść wiadomości
                        </label>
                        <span className="text-xs text-gray-500">
                            {charCount} znaków ({smsCount} SMS)
                        </span>
                    </div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                        placeholder="Wpisz treść wiadomości..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Zmienne typu {'{'}
                        {'{'} client_name {'}'}
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
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {sending ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
