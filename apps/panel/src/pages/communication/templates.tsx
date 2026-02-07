'use client';

import { useState } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageTemplates, useSmsMutations } from '@/hooks/useSms';
import type { TemplateType, MessageChannel } from '@/types';

const TEMPLATE_TYPES: { value: TemplateType; label: string }[] = [
    { value: 'appointment_reminder', label: 'Przypomnienie o wizycie' },
    { value: 'appointment_confirmation', label: 'Potwierdzenie wizyty' },
    { value: 'appointment_cancellation', label: 'Anulowanie wizyty' },
    { value: 'birthday_wish', label: 'Życzenia urodzinowe' },
    { value: 'follow_up', label: 'Wiadomość powitalna' },
    { value: 'marketing', label: 'Marketingowa' },
    { value: 'custom', label: 'Własna' },
];

const CHANNELS: { value: MessageChannel; label: string; icon: string }[] = [
    { value: 'sms', label: 'SMS', icon: '📱' },
    { value: 'email', label: 'Email', icon: '✉️' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
];

interface TemplateFormData {
    name: string;
    type: TemplateType;
    channel: MessageChannel;
    content: string;
    subject?: string;
    description?: string;
    isActive: boolean;
}

const DEFAULT_FORM_DATA: TemplateFormData = {
    name: '',
    type: 'custom',
    channel: 'sms',
    content: '',
    subject: '',
    description: '',
    isActive: true,
};

export default function TemplatesPage() {
    const { role } = useAuth();
    const { data: templates, loading, refetch } = useMessageTemplates();
    const { createTemplate, updateTemplate, deleteTemplate } =
        useSmsMutations();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<
        (typeof templates)[0] | null
    >(null);
    const [formData, setFormData] =
        useState<TemplateFormData>(DEFAULT_FORM_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterChannel, setFilterChannel] = useState<MessageChannel | ''>('');
    const [filterType, setFilterType] = useState<TemplateType | ''>('');

    const filteredTemplates = templates.filter((t) => {
        if (filterChannel && t.channel !== filterChannel) return false;
        if (filterType && t.type !== filterType) return false;
        return true;
    });

    const openAddModal = () => {
        setEditingTemplate(null);
        setFormData(DEFAULT_FORM_DATA);
        setIsModalOpen(true);
    };

    const openEditModal = (template: (typeof templates)[0]) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            type: template.type,
            channel: template.channel,
            content: template.content,
            subject: template.subject || '',
            description: template.description || '',
            isActive: template.isActive,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingTemplate) {
                await updateTemplate.mutateAsync({
                    id: editingTemplate.id,
                    ...formData,
                });
            } else {
                await createTemplate.mutateAsync(formData);
            }
            setIsModalOpen(false);
            void refetch();
        } catch (error) {
            console.error('Failed to save template:', error);
            alert('Wystąpił błąd podczas zapisywania szablonu');
        }

        setIsSubmitting(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Czy na pewno chcesz usunąć ten szablon?')) return;

        try {
            await deleteTemplate.mutateAsync(id);
            void refetch();
        } catch (error) {
            console.error('Failed to delete template:', error);
            alert('Wystąpił błąd podczas usuwania szablonu');
        }
    };

    const getTypeLabel = (type: TemplateType) =>
        TEMPLATE_TYPES.find((t) => t.value === type)?.label || type;

    const getChannelLabel = (channel: MessageChannel) =>
        CHANNELS.find((c) => c.value === channel)?.label || channel;

    const getChannelIcon = (channel: MessageChannel) =>
        CHANNELS.find((c) => c.value === channel)?.icon || '📄';

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:communication">
            <VersumShell role={role}>
                <div className="versum-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">
                            Łączność / Szablony wiadomości
                        </h1>
                        <div className="flex gap-2">
                            <Link
                                href="/communication"
                                className="versum-btn versum-btn--light"
                            >
                                ← Powrót
                            </Link>
                            <button
                                type="button"
                                className="versum-btn versum-btn--primary"
                                onClick={openAddModal}
                            >
                                + Nowy szablon
                            </button>
                        </div>
                    </header>

                    {/* Filters */}
                    <div className="versum-page__toolbar">
                        <label className="versum-label">
                            Kanał:
                            <select
                                className="versum-select ml-2"
                                value={filterChannel}
                                onChange={(e) =>
                                    setFilterChannel(
                                        e.target.value as MessageChannel | '',
                                    )
                                }
                            >
                                <option value="">Wszystkie</option>
                                {CHANNELS.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.icon} {c.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="versum-label ml-4">
                            Typ:
                            <select
                                className="versum-select ml-2"
                                value={filterType}
                                onChange={(e) =>
                                    setFilterType(
                                        e.target.value as TemplateType | '',
                                    )
                                }
                            >
                                <option value="">Wszystkie</option>
                                {TEMPLATE_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {loading ? (
                        <div className="versum-loading">
                            Ładowanie szablonów...
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="versum-empty">
                            {templates.length === 0
                                ? 'Brak szablonów. Kliknij "Nowy szablon" aby dodać.'
                                : 'Brak szablonów pasujących do filtrów.'}
                        </div>
                    ) : (
                        <div className="versum-table-wrap">
                            <table className="versum-table">
                                <thead>
                                    <tr>
                                        <th>Nazwa</th>
                                        <th>Typ</th>
                                        <th>Kanał</th>
                                        <th>Treść</th>
                                        <th>Status</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTemplates.map((template) => (
                                        <tr key={template.id}>
                                            <td>
                                                <strong>{template.name}</strong>
                                                {template.description && (
                                                    <div className="versum-muted text-xs">
                                                        {template.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {getTypeLabel(template.type)}
                                            </td>
                                            <td>
                                                <span className="versum-badge">
                                                    {getChannelIcon(
                                                        template.channel,
                                                    )}{' '}
                                                    {getChannelLabel(
                                                        template.channel,
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="versum-template-preview">
                                                    {template.subject && (
                                                        <div className="text-xs font-medium mb-1">
                                                            Temat:{' '}
                                                            {template.subject}
                                                        </div>
                                                    )}
                                                    {template.content.slice(
                                                        0,
                                                        60,
                                                    )}
                                                    {template.content.length >
                                                    60
                                                        ? '...'
                                                        : ''}
                                                </div>
                                            </td>
                                            <td>
                                                {template.isActive ? (
                                                    <span className="versum-badge versum-badge--success">
                                                        Aktywny
                                                    </span>
                                                ) : (
                                                    <span className="versum-badge versum-badge--inactive">
                                                        Nieaktywny
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="versum-actions">
                                                    <button
                                                        type="button"
                                                        className="versum-btn versum-btn--sm versum-btn--light"
                                                        onClick={() =>
                                                            openEditModal(
                                                                template,
                                                            )
                                                        }
                                                    >
                                                        Edytuj
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="versum-btn versum-btn--sm versum-btn--danger"
                                                        onClick={() =>
                                                            void handleDelete(
                                                                template.id,
                                                            )
                                                        }
                                                    >
                                                        Usuń
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Modal */}
                    {isModalOpen && (
                        <div
                            className="versum-modal-overlay"
                            onClick={(e) => {
                                if (e.target === e.currentTarget)
                                    setIsModalOpen(false);
                            }}
                        >
                            <div className="versum-modal">
                                <div className="versum-modal__header">
                                    <h3>
                                        {editingTemplate
                                            ? 'Edytuj szablon'
                                            : 'Nowy szablon'}
                                    </h3>
                                    <button
                                        type="button"
                                        className="versum-modal__close"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        ×
                                    </button>
                                </div>
                                <form onSubmit={(e) => void handleSubmit(e)}>
                                    <div className="versum-modal__body">
                                        <div className="versum-form-group">
                                            <label>Nazwa *</label>
                                            <input
                                                type="text"
                                                className="versum-input"
                                                value={formData.name}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        name: e.target.value,
                                                    })
                                                }
                                                required
                                                maxLength={100}
                                            />
                                        </div>

                                        <div className="versum-form-row">
                                            <div className="versum-form-group">
                                                <label>Typ *</label>
                                                <select
                                                    className="versum-select"
                                                    value={formData.type}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            type: e.target
                                                                .value as TemplateType,
                                                        })
                                                    }
                                                >
                                                    {TEMPLATE_TYPES.map((t) => (
                                                        <option
                                                            key={t.value}
                                                            value={t.value}
                                                        >
                                                            {t.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="versum-form-group">
                                                <label>Kanał *</label>
                                                <select
                                                    className="versum-select"
                                                    value={formData.channel}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            channel: e.target
                                                                .value as MessageChannel,
                                                        })
                                                    }
                                                >
                                                    {CHANNELS.map((c) => (
                                                        <option
                                                            key={c.value}
                                                            value={c.value}
                                                        >
                                                            {c.icon} {c.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {formData.channel === 'email' && (
                                            <div className="versum-form-group">
                                                <label>Temat</label>
                                                <input
                                                    type="text"
                                                    className="versum-input"
                                                    value={formData.subject}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            subject:
                                                                e.target.value,
                                                        })
                                                    }
                                                    maxLength={200}
                                                />
                                            </div>
                                        )}

                                        <div className="versum-form-group">
                                            <label>Treść *</label>
                                            <textarea
                                                className="versum-textarea"
                                                value={formData.content}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        content: e.target.value,
                                                    })
                                                }
                                                rows={6}
                                                required
                                            />
                                            <span className="versum-char-count">
                                                {formData.content.length} znaków
                                                {formData.channel === 'sms' && (
                                                    <>
                                                        ,{' '}
                                                        {Math.ceil(
                                                            formData.content
                                                                .length / 160,
                                                        )}{' '}
                                                        SMS
                                                    </>
                                                )}
                                            </span>
                                        </div>

                                        <div className="versum-variables-help">
                                            <h4>Dostępne zmienne:</h4>
                                            <code>{'{{client_name}}'}</code>
                                            <code>{'{{service_name}}'}</code>
                                            <code>{'{{date}}'}</code>
                                            <code>{'{{time}}'}</code>
                                            <code>{'{{employee_name}}'}</code>
                                            <code>{'{{salon_name}}'}</code>
                                        </div>

                                        <div className="versum-form-group">
                                            <label>Opis (opcjonalny)</label>
                                            <input
                                                type="text"
                                                className="versum-input"
                                                value={formData.description}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        description:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="Krótki opis przeznaczenia szablonu"
                                            />
                                        </div>

                                        <label className="versum-checkbox-row">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        isActive:
                                                            e.target.checked,
                                                    })
                                                }
                                            />
                                            <span>Szablon aktywny</span>
                                        </label>
                                    </div>
                                    <div className="versum-modal__footer">
                                        <button
                                            type="button"
                                            className="versum-btn versum-btn--light"
                                            onClick={() =>
                                                setIsModalOpen(false)
                                            }
                                        >
                                            Anuluj
                                        </button>
                                        <button
                                            type="submit"
                                            className="versum-btn versum-btn--primary"
                                            disabled={
                                                !formData.name.trim() ||
                                                !formData.content.trim() ||
                                                isSubmitting
                                            }
                                        >
                                            {isSubmitting
                                                ? 'Zapisywanie...'
                                                : editingTemplate
                                                  ? 'Zapisz zmiany'
                                                  : 'Utwórz szablon'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
