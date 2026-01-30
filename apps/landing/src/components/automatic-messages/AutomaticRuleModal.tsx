'use client';

import { useState, useEffect } from 'react';
import type {
    AutomaticMessageRule,
    AutomaticMessageTrigger,
    AutomaticMessageChannel,
    CreateAutomaticMessageRuleRequest,
} from '@/types';
import { AutomaticMessageTrigger as TriggerEnum, AutomaticMessageChannel as ChannelEnum } from '@/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateAutomaticMessageRuleRequest) => Promise<void>;
    rule?: AutomaticMessageRule | null;
    loading?: boolean;
}

const TRIGGER_OPTIONS: { value: AutomaticMessageTrigger; label: string; description: string }[] = [
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
        value: TriggerEnum.InactiveClient,
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
    { key: 'client_name', desc: 'Pełne imię i nazwisko klienta' },
    { key: 'client_first_name', desc: 'Imię klienta' },
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
    const [formData, setFormData] = useState<CreateAutomaticMessageRuleRequest>({
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

    const needsInactivityDays = formData.trigger === TriggerEnum.InactiveClient;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="fixed inset-0 bg-black/30"
                    onClick={onClose}
                ></div>

                <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {rule ? 'Edytuj regułę' : 'Nowa reguła automatyczna'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
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

                    <form onSubmit={handleSubmit}>
                        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Typ wyzwalacza *
                                    </label>
                                    <select
                                        value={formData.trigger}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                trigger: e.target.value as AutomaticMessageTrigger,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        {TRIGGER_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Krótki opis reguły..."
                                />
                            </div>

                            {/* Timing */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kanał
                                    </label>
                                    <select
                                        value={formData.channel}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                channel: e.target.value as AutomaticMessageChannel,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        {CHANNEL_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {needsOffset && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Godziny przed/po
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.offsetHours}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    offsetHours: parseInt(e.target.value, 10),
                                                }))
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            min={-168}
                                            max={168}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Ujemne = przed, dodatnie = po
                                        </p>
                                    </div>
                                )}

                                {needsInactivityDays && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Dni nieaktywności
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.inactivityDays}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    inactivityDays: parseInt(e.target.value, 10),
                                                }))
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            min={1}
                                            max={365}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Send Window */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Okno wysyłki od
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.sendWindowStart?.slice(0, 5)}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                sendWindowStart: e.target.value + ':00',
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Okno wysyłki do
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.sendWindowEnd?.slice(0, 5)}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                sendWindowEnd: e.target.value + ':00',
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Message Content */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    rows={4}
                                    required
                                    placeholder="Wpisz treść wiadomości..."
                                />
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">
                                        Dostępne zmienne (kliknij, aby wstawić):
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {DEFAULT_VARIABLES.map((v) => (
                                            <button
                                                key={v.key}
                                                type="button"
                                                onClick={() => insertVariable(v.key)}
                                                className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                                                title={v.desc}
                                            >
                                                {`{{${v.key}}}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.requireSmsConsent}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                requireSmsConsent: e.target.checked,
                                            }))
                                        }
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                        Wymagaj zgody SMS
                                    </span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                isActive: e.target.checked,
                                            }))
                                        }
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                        Aktywna
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Anuluj
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Zapisywanie...' : rule ? 'Zapisz zmiany' : 'Utwórz regułę'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
