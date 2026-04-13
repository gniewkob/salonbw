'use client';

import { useState, useEffect } from 'react';
import type {
    AutomaticMessageRule,
    AutomaticMessageTrigger,
    AutomaticMessageChannel,
    CreateAutomaticMessageRuleRequest,
} from '@/types';
import {
    AutomaticMessageTrigger as TriggerEnum,
    AutomaticMessageChannel as ChannelEnum,
} from '@/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateAutomaticMessageRuleRequest) => Promise<void>;
    rule?: AutomaticMessageRule | null;
    loading?: boolean;
}

const TRIGGER_OPTIONS: {
    value: AutomaticMessageTrigger;
    label: string;
    description: string;
}[] = [
    {
        value: TriggerEnum.AppointmentReminder,
        label: 'Przypomnienie o wizycie',
        description: 'Wysyłane X godzin przed wizytą',
    },
    {
        value: TriggerEnum.AppointmentConfirmation,
        label: 'Potwierdzenie rezerwacji',
        description: 'Wysyłane natychmiast po zarezerwowaniu',
    },
    {
        value: TriggerEnum.FollowUp,
        label: 'Wiadomość po wizycie',
        description: 'Wysyłane X godzin po zakończeniu wizyty',
    },
    {
        value: TriggerEnum.Birthday,
        label: 'Życzenia urodzinowe',
        description: 'Wysyłane w dniu urodzin klienta',
    },
    {
        value: TriggerEnum.ReviewRequest,
        label: 'Prośba o opinię',
        description: 'Wysyłane X godzin po wizycie',
    },
    {
        value: TriggerEnum.InactiveCustomer,
        label: 'Reaktywacja nieaktywnych',
        description: 'Wysyłane po X dniach bez wizyty',
    },
];

const CHANNEL_OPTIONS: { value: AutomaticMessageChannel; label: string }[] = [
    { value: ChannelEnum.Sms, label: 'SMS' },
    { value: ChannelEnum.Email, label: 'E-mail' },
    { value: ChannelEnum.Whatsapp, label: 'WhatsApp' },
];

const DEFAULT_VARIABLES = [
    { key: 'customer_name', desc: 'Pełne imię i nazwisko klienta' },
    { key: 'customer_first_name', desc: 'Imię klienta' },
    { key: 'service_name', desc: 'Nazwa usługi' },
    { key: 'employee_name', desc: 'Imię pracownika' },
    { key: 'date', desc: 'Data wizyty (dd.MM.yyyy)' },
    { key: 'time', desc: 'Godzina wizyty (HH:mm)' },
    { key: 'salon_name', desc: 'Nazwa salonu' },
];

export default function AutomaticRuleModal({
    isOpen,
    onClose,
    onSave,
    rule,
    loading,
}: Props) {
    const [formData, setFormData] = useState<CreateAutomaticMessageRuleRequest>(
        {
            name: '',
            description: '',
            trigger: TriggerEnum.AppointmentReminder,
            channel: ChannelEnum.Sms,
            offsetHours: -24,
            inactivityDays: 60,
            sendWindowStart: '09:00:00',
            sendWindowEnd: '20:00:00',
            content: '',
            requireSmsConsent: false,
            isActive: false,
        },
    );

    useEffect(() => {
        if (rule) {
            setFormData({
                name: rule.name,
                description: rule.description ?? '',
                trigger: rule.trigger,
                channel: rule.channel,
                offsetHours: rule.offsetHours,
                inactivityDays: rule.inactivityDays ?? 60,
                sendWindowStart: rule.sendWindowStart,
                sendWindowEnd: rule.sendWindowEnd,
                templateId: rule.templateId ?? undefined,
                content: rule.content ?? '',
                serviceIds: rule.serviceIds ?? undefined,
                employeeIds: rule.employeeIds ?? undefined,
                requireSmsConsent: rule.requireSmsConsent,
                requireEmailConsent: rule.requireEmailConsent,
                isActive: rule.isActive,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                trigger: TriggerEnum.AppointmentReminder,
                channel: ChannelEnum.Sms,
                offsetHours: -24,
                inactivityDays: 60,
                sendWindowStart: '09:00:00',
                sendWindowEnd: '20:00:00',
                content: '',
                requireSmsConsent: false,
                isActive: false,
            });
        }
    }, [rule, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
        onClose();
    };

    const insertVariable = (key: string) => {
        setFormData((prev) => ({
            ...prev,
            content: (prev.content ?? '') + `{{${key}}}`,
        }));
    };

    const needsOffset =
        formData.trigger === TriggerEnum.AppointmentReminder ||
        formData.trigger === TriggerEnum.FollowUp ||
        formData.trigger === TriggerEnum.ReviewRequest;

    const needsInactivityDays = formData.trigger === TriggerEnum.InactiveCustomer;

    if (!isOpen) return null;

    return (
        <div className="position-fixed top-0 start-0 bottom-0 end-0 overflow-y-auto">
            <div className="d-flex min-h-100 align-items-center justify-content-center p-3">
                <div
                    className="position-fixed top-0 start-0 bottom-0 end-0 bg-dark/30"
                    onClick={onClose}
                ></div>

                <div className="position-relative w-100 bg-white rounded-4 shadow-lg">
                    <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
                        <h2 className="fs-5 fw-semibold text-dark">
                            {rule
                                ? 'Edytuj regułę'
                                : 'Nowa reguła automatyczna'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-secondary rounded-3"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <form
                        onSubmit={(event) => {
                            void handleSubmit(event);
                        }}
                    >
                        <div className="p-3 gap-2 max-h-[60vh] overflow-y-auto">
                            {/* Basic Info */}
                            <div className="-cols-2 gap-3">
                                <div>
                                    <label className="d-block small fw-medium text-body mb-1">
                                        Nazwa reguły *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="d-block small fw-medium text-body mb-1">
                                        Typ wyzwalacza *
                                    </label>
                                    <select
                                        value={formData.trigger}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                trigger: e.target
                                                    .value as AutomaticMessageTrigger,
                                            }))
                                        }
                                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                    >
                                        {TRIGGER_OPTIONS.map((opt) => (
                                            <option
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="d-block small fw-medium text-body mb-1">
                                    Opis (opcjonalny)
                                </label>
                                <input
                                    type="text"
                                    value={formData.description ?? ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                    placeholder="Krótki opis reguły..."
                                />
                            </div>

                            {/* Timing */}
                            <div className="-cols-3 gap-3">
                                <div>
                                    <label className="d-block small fw-medium text-body mb-1">
                                        Kanał
                                    </label>
                                    <select
                                        value={formData.channel}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                channel: e.target
                                                    .value as AutomaticMessageChannel,
                                            }))
                                        }
                                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                    >
                                        {CHANNEL_OPTIONS.map((opt) => (
                                            <option
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {needsOffset && (
                                    <div>
                                        <label className="d-block small fw-medium text-body mb-1">
                                            Godziny przed/po
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.offsetHours}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    offsetHours: parseInt(
                                                        e.target.value,
                                                        10,
                                                    ),
                                                }))
                                            }
                                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                            min={-168}
                                            max={168}
                                        />
                                        <p className="small text-muted mt-1">
                                            Ujemne = przed, dodatnie = po
                                        </p>
                                    </div>
                                )}

                                {needsInactivityDays && (
                                    <div>
                                        <label className="d-block small fw-medium text-body mb-1">
                                            Dni nieaktywności
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.inactivityDays}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    inactivityDays: parseInt(
                                                        e.target.value,
                                                        10,
                                                    ),
                                                }))
                                            }
                                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                            min={1}
                                            max={365}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Send Window */}
                            <div className="-cols-2 gap-3">
                                <div>
                                    <label className="d-block small fw-medium text-body mb-1">
                                        Okno wysyłki od
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.sendWindowStart?.slice(
                                            0,
                                            5,
                                        )}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                sendWindowStart:
                                                    e.target.value + ':00',
                                            }))
                                        }
                                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                    />
                                </div>
                                <div>
                                    <label className="d-block small fw-medium text-body mb-1">
                                        Okno wysyłki do
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.sendWindowEnd?.slice(
                                            0,
                                            5,
                                        )}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                sendWindowEnd:
                                                    e.target.value + ':00',
                                            }))
                                        }
                                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                    />
                                </div>
                            </div>

                            {/* Message Content */}
                            <div>
                                <label className="d-block small fw-medium text-body mb-1">
                                    Treść wiadomości *
                                </label>
                                <textarea
                                    value={formData.content ?? ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            content: e.target.value,
                                        }))
                                    }
                                    className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                    rows={4}
                                    required
                                    placeholder="Wpisz treść wiadomości..."
                                />
                                <div className="mt-2">
                                    <p className="small text-muted mb-1">
                                        Dostępne zmienne (kliknij, aby wstawić):
                                    </p>
                                    <div className="d-flex flex-wrap gap-1">
                                        {DEFAULT_VARIABLES.map((v) => (
                                            <button
                                                key={v.key}
                                                type="button"
                                                onClick={() =>
                                                    insertVariable(v.key)
                                                }
                                                className="px-2 py-0.5 small bg-light bg-opacity-25 rounded text-body"
                                                title={v.desc}
                                            >
                                                {`{{${v.key}}}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="d-flex flex-wrap gap-3">
                                <label className="d-flex align-items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.requireSmsConsent}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                requireSmsConsent:
                                                    e.target.checked,
                                            }))
                                        }
                                        className="w-4 h-4 text-primary border-secondary border-opacity-50 rounded focus:"
                                    />
                                    <span className="small text-body">
                                        Wymagaj zgody SMS
                                    </span>
                                </label>
                                <label className="d-flex align-items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                isActive: e.target.checked,
                                            }))
                                        }
                                        className="w-4 h-4 text-primary border-secondary border-opacity-50 rounded focus:"
                                    />
                                    <span className="small text-body">
                                        Aktywna
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end gap-2 p-3 border-top bg-light">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-2 text-body rounded-3"
                            >
                                Anuluj
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-3 py-2 bg-primary bg-opacity-10 text-white rounded-3 bg-opacity-10"
                            >
                                {loading
                                    ? 'Zapisywanie...'
                                    : rule
                                      ? 'Zapisz zmiany'
                                      : 'Utwórz regułę'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
