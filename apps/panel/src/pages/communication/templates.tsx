import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
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
    const toast = useToast();
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
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

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
        } catch {
            toast.error('Wystąpił błąd podczas zapisywania szablonu');
        }

        setIsSubmitting(false);
    };

    const handleDelete = (id: number) => {
        setConfirmDeleteId(id);
    };

    const doDelete = (id: number) => {
        void deleteTemplate
            .mutateAsync(id)
            .then(() => refetch())
            .catch(() => {
                toast.error('Wystąpił błąd podczas usuwania szablonu');
            });
    };

    const getTypeLabel = (type: TemplateType) =>
        TEMPLATE_TYPES.find((t) => t.value === type)?.label || type;

    const getChannelLabel = (channel: MessageChannel) =>
        CHANNELS.find((c) => c.value === channel)?.label || channel;

    const getChannelIcon = (channel: MessageChannel) =>
        CHANNELS.find((c) => c.value === channel)?.icon || '📄';

    return (
        <RouteGuard roles={['admin']} permission="nav:communication">
            <SalonShell role={role}>
                <div className="salonbw-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_communication"
                        items={[
                            { label: 'Łączność', href: '/communication' },
                            { label: 'Szablony wiadomości' },
                        ]}
                    />

                    <div className="salonbw-page__toolbar">
                        <label className="form-label" htmlFor="filter-channel">
                            Kanał:
                        </label>
                        <select
                            id="filter-channel"
                            className="form-select"
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
                        <label className="form-label" htmlFor="filter-type">
                            Typ:
                        </label>
                        <select
                            id="filter-type"
                            className="form-select"
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
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={openAddModal}
                        >
                            + Nowy szablon
                        </button>
                    </div>

                    {loading ? (
                        <div className="salonbw-loading">
                            Ładowanie szablonów...
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="salonbw-empty">
                            {templates.length === 0
                                ? 'Brak szablonów. Kliknij "Nowy szablon" aby dodać.'
                                : 'Brak szablonów pasujących do filtrów.'}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-bordered table-sm">
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
                                                    <div className="text-muted small">
                                                        {template.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {getTypeLabel(template.type)}
                                            </td>
                                            <td>
                                                <span className="badge text-bg-info">
                                                    {getChannelIcon(
                                                        template.channel,
                                                    )}{' '}
                                                    {getChannelLabel(
                                                        template.channel,
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="salonbw-template-preview">
                                                    {template.subject && (
                                                        <div className="text-muted">
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
                                                    <span className="badge text-bg-success">
                                                        Aktywny
                                                    </span>
                                                ) : (
                                                    <span className="badge text-bg-secondary">
                                                        Nieaktywny
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2 align-items-center">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary btn-sm"
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
                                                        className="btn btn-danger btn-sm"
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
                            className="salonbw-modal-overlay"
                            onClick={(e) => {
                                if (e.target === e.currentTarget)
                                    setIsModalOpen(false);
                            }}
                        >
                            <div className="salonbw-modal">
                                <div className="salonbw-modal__header">
                                    <h3>
                                        {editingTemplate
                                            ? 'Edytuj szablon'
                                            : 'Nowy szablon'}
                                    </h3>
                                    <button
                                        type="button"
                                        className="salonbw-modal__close"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        ×
                                    </button>
                                </div>
                                <form onSubmit={(e) => void handleSubmit(e)}>
                                    <div className="salonbw-modal__body">
                                        <div className="mb-3">
                                            <label htmlFor="modal-name">
                                                Nazwa *
                                            </label>
                                            <input
                                                id="modal-name"
                                                type="text"
                                                className="form-control"
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

                                        <div className="d-flex gap-2 flex-wrap">
                                            <div className="mb-3">
                                                <label htmlFor="modal-type">
                                                    Typ *
                                                </label>
                                                <select
                                                    id="modal-type"
                                                    className="form-select"
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

                                            <div className="mb-3">
                                                <label htmlFor="modal-channel">
                                                    Kanał *
                                                </label>
                                                <select
                                                    id="modal-channel"
                                                    className="form-select"
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
                                            <div className="mb-3">
                                                <label htmlFor="modal-subject">
                                                    Temat
                                                </label>
                                                <input
                                                    id="modal-subject"
                                                    type="text"
                                                    className="form-control"
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

                                        <div className="mb-3">
                                            <label htmlFor="modal-content">
                                                Treść *
                                            </label>
                                            <textarea
                                                id="modal-content"
                                                className="form-control"
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
                                            <span className="form-text text-muted">
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

                                        <div className="form-text text-muted small">
                                            <h4>Dostępne zmienne:</h4>
                                            <code>{'{{client_name}}'}</code>
                                            <code>{'{{service_name}}'}</code>
                                            <code>{'{{date}}'}</code>
                                            <code>{'{{time}}'}</code>
                                            <code>{'{{employee_name}}'}</code>
                                            <code>{'{{salon_name}}'}</code>
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="modal-description">
                                                Opis (opcjonalny)
                                            </label>
                                            <input
                                                id="modal-description"
                                                type="text"
                                                className="form-control"
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

                                        <label className="d-flex align-items-center gap-2 mb-2">
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
                                    <div className="salonbw-modal__footer">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() =>
                                                setIsModalOpen(false)
                                            }
                                        >
                                            Anuluj
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
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
                <ConfirmModal
                    open={confirmDeleteId !== null}
                    title="Usuń szablon"
                    message="Czy na pewno chcesz usunąć ten szablon? Operacja jest nieodwracalna."
                    confirmLabel="Usuń"
                    confirmVariant="danger"
                    onConfirm={() => {
                        if (confirmDeleteId === null) return;
                        const id = confirmDeleteId;
                        setConfirmDeleteId(null);
                        doDelete(id);
                    }}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            </SalonShell>
        </RouteGuard>
    );
}
