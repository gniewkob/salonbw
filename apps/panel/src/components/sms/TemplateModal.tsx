'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import type { MessageTemplate, TemplateType, MessageChannel } from '@/types';

interface Props {
    isOpen: boolean;
    template: MessageTemplate | null;
    onClose: () => void;
    onSave: (data: TemplateFormData) => Promise<void>;
}

export interface TemplateFormData {
    name: string;
    type: TemplateType;
    channel: MessageChannel;
    content: string;
    subject?: string;
    description?: string;
    isActive: boolean;
}

const TEMPLATE_TYPES: { value: TemplateType; label: string }[] = [
    { value: 'appointment_reminder', label: 'Przypomnienie o wizycie' },
    { value: 'appointment_confirmation', label: 'Potwierdzenie wizyty' },
    { value: 'appointment_cancellation', label: 'Anulowanie wizyty' },
    { value: 'birthday_wish', label: 'Życzenia urodzinowe' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'custom', label: 'Własny' },
];

const CHANNELS: { value: MessageChannel; label: string }[] = [
    { value: 'sms', label: 'SMS' },
    { value: 'email', label: 'E-mail' },
    { value: 'whatsapp', label: 'WhatsApp' },
];

const AVAILABLE_VARIABLES = [
    { key: 'client_name', label: 'Imię klienta' },
    { key: 'service_name', label: 'Nazwa usługi' },
    { key: 'date', label: 'Data wizyty' },
    { key: 'time', label: 'Godzina wizyty' },
    { key: 'employee_name', label: 'Imię pracownika' },
    { key: 'salon_name', label: 'Nazwa salonu' },
    { key: 'salon_phone', label: 'Telefon salonu' },
];

export default function TemplateModal({
    isOpen,
    template,
    onClose,
    onSave,
}: Props) {
    const [form, setForm] = useState<TemplateFormData>({
        name: '',
        type: 'custom',
        channel: 'sms',
        content: '',
        subject: '',
        description: '',
        isActive: true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (template) {
            setForm({
                name: template.name,
                type: template.type,
                channel: template.channel,
                content: template.content,
                subject: template.subject || '',
                description: template.description || '',
                isActive: template.isActive,
            });
        } else {
            setForm({
                name: '',
                type: 'custom',
                channel: 'sms',
                content: '',
                subject: '',
                description: '',
                isActive: true,
            });
        }
    }, [template, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(form);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const insertVariable = (key: string) => {
        const variable = `{{${key}}}`;
        setForm((prev) => ({
            ...prev,
            content: prev.content + variable,
        }));
    };

    const charCount = form.content.length;
    const smsCount = Math.ceil(charCount / 160) || 1;

    return (
        <Modal open={isOpen} onClose={onClose}>
            <form
                onSubmit={(event) => {
                    void handleSubmit(event);
                }}
                className="w-[560px]"
            >
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    {template ? 'Edytuj szablon' : 'Nowy szablon'}
                </h2>

                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nazwa szablonu
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                        />
                    </div>

                    {/* Type & Channel */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Typ
                            </label>
                            <select
                                value={form.type}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        type: e.target.value as TemplateType,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                {TEMPLATE_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kanał
                            </label>
                            <select
                                value={form.channel}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        channel: e.target
                                            .value as MessageChannel,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                {CHANNELS.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Subject (for email) */}
                    {form.channel === 'email' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Temat
                            </label>
                            <input
                                type="text"
                                value={form.subject}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        subject: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Treść wiadomości
                            </label>
                            {form.channel === 'sms' && (
                                <span className="text-xs text-gray-500">
                                    {charCount} znaków ({smsCount} SMS)
                                </span>
                            )}
                        </div>
                        <textarea
                            value={form.content}
                            onChange={(e) =>
                                setForm({ ...form, content: e.target.value })
                            }
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                            required
                        />
                    </div>

                    {/* Variables */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dostępne zmienne
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_VARIABLES.map((v) => (
                                <button
                                    key={v.key}
                                    type="button"
                                    onClick={() => insertVariable(v.key)}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                                    title={`Wstaw {{${v.key}}}`}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Opis (opcjonalnie)
                        </label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    description: e.target.value,
                                })
                            }
                            placeholder="Krótki opis szablonu..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* Active */}
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) =>
                                setForm({ ...form, isActive: e.target.checked })
                            }
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">
                            Szablon aktywny
                        </span>
                    </label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Anuluj
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Zapisywanie...' : 'Zapisz'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
