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
    { key: 'customer_name', label: 'Imię klienta' },
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
                <h2 className="fs-5 fw-semibold text-dark mb-4">
                    {template ? 'Edytuj szablon' : 'Nowy szablon'}
                </h2>

                <div className="gap-2">
                    {/* Name */}
                    <div>
                        <label className="d-block small fw-medium text-body mb-1">
                            Nazwa szablonu
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                            required
                        />
                    </div>

                    {/* Type & Channel */}
                    <div className="-cols-2 gap-3">
                        <div>
                            <label className="d-block small fw-medium text-body mb-1">
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
                                className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                            >
                                {TEMPLATE_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="d-block small fw-medium text-body mb-1">
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
                                className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
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
                            <label className="d-block small fw-medium text-body mb-1">
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
                                className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                            <label className="d-block small fw-medium text-body">
                                Treść wiadomości
                            </label>
                            {form.channel === 'sms' && (
                                <span className="small text-muted">
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
                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus: resize-none"
                            required
                        />
                    </div>

                    {/* Variables */}
                    <div>
                        <label className="d-block small fw-medium text-body mb-2">
                            Dostępne zmienne
                        </label>
                        <div className="d-flex flex-wrap gap-2">
                            {AVAILABLE_VARIABLES.map((v) => (
                                <button
                                    key={v.key}
                                    type="button"
                                    onClick={() => insertVariable(v.key)}
                                    className="px-2 py-1 bg-light text-body small rounded bg-opacity-25"
                                    title={`Wstaw {{${v.key}}}`}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="d-block small fw-medium text-body mb-1">
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
                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                        />
                    </div>

                    {/* Active */}
                    <label className="d-flex align-items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) =>
                                setForm({ ...form, isActive: e.target.checked })
                            }
                            className="w-4 h-4 text-primary rounded focus:"
                        />
                        <span className="small text-body">Szablon aktywny</span>
                    </label>
                </div>

                <div className="mt-4 d-flex justify-content-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-2 text-body bg-light rounded-3 bg-opacity-25"
                    >
                        Anuluj
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-3 py-2 bg-primary bg-opacity-10 text-white rounded-3 bg-opacity-10"
                    >
                        {saving ? 'Zapisywanie...' : 'Zapisz'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
