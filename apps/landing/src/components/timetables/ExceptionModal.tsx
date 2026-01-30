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

const EXCEPTION_TYPES: { value: ExceptionType; label: string; color: string }[] = [
    { value: 'day_off', label: 'Dzień wolny', color: 'bg-gray-100 text-gray-700' },
    { value: 'vacation', label: 'Urlop', color: 'bg-blue-100 text-blue-700' },
    { value: 'sick_leave', label: 'Zwolnienie lekarskie', color: 'bg-red-100 text-red-700' },
    { value: 'training', label: 'Szkolenie', color: 'bg-purple-100 text-purple-700' },
    { value: 'custom_hours', label: 'Zmienione godziny', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'other', label: 'Inne', color: 'bg-gray-100 text-gray-600' },
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
            <form onSubmit={handleSubmit} className="w-[480px]">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    {exception ? 'Edytuj wyjątek' : 'Dodaj wyjątek'}
                </h2>

                <div className="space-y-4">
                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data
                        </label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Typ
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {EXCEPTION_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, type: type.value })}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                        form.type === type.value
                                            ? `${type.color} ring-2 ring-offset-1 ring-primary-500`
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tytuł (opcjonalnie)
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="np. Wizyta u lekarza"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* Custom hours toggle (only for custom_hours type) */}
                    {form.type === 'custom_hours' && (
                        <div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.isAllDay}
                                    onChange={(e) =>
                                        setForm({ ...form, isAllDay: e.target.checked })
                                    }
                                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">Cały dzień wolny</span>
                            </label>
                        </div>
                    )}

                    {/* Custom hours */}
                    {showCustomHours && (
                        <div className="flex items-center gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Od
                                </label>
                                <input
                                    type="time"
                                    value={form.customStartTime}
                                    onChange={(e) =>
                                        setForm({ ...form, customStartTime: e.target.value })
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Do
                                </label>
                                <input
                                    type="time"
                                    value={form.customEndTime}
                                    onChange={(e) =>
                                        setForm({ ...form, customEndTime: e.target.value })
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Powód (opcjonalnie)
                        </label>
                        <textarea
                            value={form.reason}
                            onChange={(e) => setForm({ ...form, reason: e.target.value })}
                            rows={2}
                            placeholder="Dodatkowe informacje..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        />
                    </div>
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
