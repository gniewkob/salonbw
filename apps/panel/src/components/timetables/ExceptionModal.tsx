'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import type { TimetableException, ExceptionType } from '@/types';

interface Props {
    isOpen: boolean;
    exception: TimetableException | null;
    onClose: () => void;
    onSave: (data: ExceptionFormData) => Promise<void>;
}

export interface ExceptionFormData {
    date: string;
    type: ExceptionType;
    title?: string;
    reason?: string;
    customStartTime?: string;
    customEndTime?: string;
    isAllDay: boolean;
}

const EXCEPTION_TYPES: {
    value: ExceptionType;
    label: string;
    color: string;
}[] = [
    {
        value: 'day_off',
        label: 'Dzień wolny',
        color: 'bg-secondary bg-opacity-10 text-body',
    },
    { value: 'vacation', label: 'Urlop', color: 'bg-blue-100 text-blue-700' },
    {
        value: 'sick_leave',
        label: 'Zwolnienie lekarskie',
        color: 'bg-red-100 text-red-700',
    },
    {
        value: 'training',
        label: 'Szkolenie',
        color: 'bg-purple-100 text-purple-700',
    },
    {
        value: 'custom_hours',
        label: 'Zmienione godziny',
        color: 'bg-yellow-100 text-yellow-700',
    },
    {
        value: 'other',
        label: 'Inne',
        color: 'bg-secondary bg-opacity-10 text-muted',
    },
];

export default function ExceptionModal({
    isOpen,
    exception,
    onClose,
    onSave,
}: Props) {
    const [form, setForm] = useState<ExceptionFormData>({
        date: new Date().toISOString().split('T')[0],
        type: 'day_off',
        title: '',
        reason: '',
        customStartTime: '09:00',
        customEndTime: '17:00',
        isAllDay: true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (exception) {
            setForm({
                date: exception.date.split('T')[0],
                type: exception.type,
                title: exception.title || '',
                reason: exception.reason || '',
                customStartTime: exception.customStartTime || '09:00',
                customEndTime: exception.customEndTime || '17:00',
                isAllDay: exception.isAllDay,
            });
        } else {
            setForm({
                date: new Date().toISOString().split('T')[0],
                type: 'day_off',
                title: '',
                reason: '',
                customStartTime: '09:00',
                customEndTime: '17:00',
                isAllDay: true,
            });
        }
    }, [exception, isOpen]);

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

    const showCustomHours = form.type === 'custom_hours' && !form.isAllDay;

    return (
        <Modal open={isOpen} onClose={onClose}>
            <form
                onSubmit={(event) => {
                    void handleSubmit(event);
                }}
                className="w-[480px]"
            >
                <h2 className="fs-5 fw-semibold text-dark mb-4">
                    {exception ? 'Edytuj wyjątek' : 'Dodaj wyjątek'}
                </h2>

                <div className="gap-2">
                    {/* Date */}
                    <div>
                        <label className="d-block small fw-medium text-body mb-1">
                            Data
                        </label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) =>
                                setForm({ ...form, date: e.target.value })
                            }
                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                            required
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="d-block small fw-medium text-body mb-2">
                            Typ
                        </label>
                        <div className="-cols-3 gap-2">
                            {EXCEPTION_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() =>
                                        setForm({ ...form, type: type.value })
                                    }
                                    className={`px-3 py-2 rounded-3 small fw-medium  ${
                                        form.type === type.value
                                            ? `${type.color} ring-2 ring-offset-1 ring-primary-500`
                                            : 'bg-light text-muted '
                                    }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="d-block small fw-medium text-body mb-1">
                            Tytuł (opcjonalnie)
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) =>
                                setForm({ ...form, title: e.target.value })
                            }
                            placeholder="np. Wizyta u lekarza"
                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                        />
                    </div>

                    {/* Custom hours toggle (only for custom_hours type) */}
                    {form.type === 'custom_hours' && (
                        <div>
                            <label className="d-flex align-items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.isAllDay}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            isAllDay: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 text-primary rounded focus:"
                                />
                                <span className="small text-body">
                                    Cały dzień wolny
                                </span>
                            </label>
                        </div>
                    )}

                    {/* Custom hours */}
                    {showCustomHours && (
                        <div className="d-flex align-items-center gap-3">
                            <div>
                                <label className="d-block small fw-medium text-body mb-1">
                                    Od
                                </label>
                                <input
                                    type="time"
                                    value={form.customStartTime}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            customStartTime: e.target.value,
                                        })
                                    }
                                    className="px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                />
                            </div>
                            <div>
                                <label className="d-block small fw-medium text-body mb-1">
                                    Do
                                </label>
                                <input
                                    type="time"
                                    value={form.customEndTime}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            customEndTime: e.target.value,
                                        })
                                    }
                                    className="px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                />
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="d-block small fw-medium text-body mb-1">
                            Powód (opcjonalnie)
                        </label>
                        <textarea
                            value={form.reason}
                            onChange={(e) =>
                                setForm({ ...form, reason: e.target.value })
                            }
                            rows={2}
                            placeholder="Dodatkowe informacje..."
                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus: resize-none"
                        />
                    </div>
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
