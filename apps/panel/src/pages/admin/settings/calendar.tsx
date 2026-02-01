'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendarSettings, useSettingsMutations } from '@/hooks/useSettings';
import type { UpdateCalendarSettingsRequest } from '@/types';

type Tab = 'display' | 'booking' | 'reminders' | 'cancellation';

export default function CalendarSettingsPage() {
    const { user } = useAuth();
    const { data: settings, isLoading } = useCalendarSettings();
    const { updateCalendarSettings } = useSettingsMutations();

    const [activeTab, setActiveTab] = useState<Tab>('display');
    const [formData, setFormData] = useState<UpdateCalendarSettingsRequest>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (settings) {
            setFormData({
                defaultView: settings.defaultView,
                timeSlotDuration: settings.timeSlotDuration,
                defaultStartTime: settings.defaultStartTime,
                defaultEndTime: settings.defaultEndTime,
                showWeekends: settings.showWeekends,
                weekStartsOn: settings.weekStartsOn,
                showEmployeePhotos: settings.showEmployeePhotos,
                showServiceColors: settings.showServiceColors,
                compactView: settings.compactView,
                allowOverlappingAppointments:
                    settings.allowOverlappingAppointments,
                minAppointmentDuration: settings.minAppointmentDuration,
                maxAppointmentDuration: settings.maxAppointmentDuration,
                bufferTimeBefore: settings.bufferTimeBefore,
                bufferTimeAfter: settings.bufferTimeAfter,
                minBookingAdvanceHours: settings.minBookingAdvanceHours,
                maxBookingAdvanceDays: settings.maxBookingAdvanceDays,
                allowSameDayBooking: settings.allowSameDayBooking,
                cancellationDeadlineHours: settings.cancellationDeadlineHours,
                allowClientReschedule: settings.allowClientReschedule,
                rescheduleDeadlineHours: settings.rescheduleDeadlineHours,
                reminderEnabled: settings.reminderEnabled,
                reminderHoursBefore: settings.reminderHoursBefore,
                secondReminderEnabled: settings.secondReminderEnabled,
                secondReminderHoursBefore: settings.secondReminderHoursBefore,
                autoMarkNoshowAfterMinutes: settings.autoMarkNoshowAfterMinutes,
                noshowPenaltyEnabled: settings.noshowPenaltyEnabled,
            });
        }
    }, [settings]);

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Brak dostępu</p>
            </div>
        );
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === 'checkbox'
                    ? (e.target as HTMLInputElement).checked
                    : type === 'number'
                      ? parseInt(value, 10) || 0
                      : value,
        }));
        setSaved(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateCalendarSettings.mutateAsync(formData);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: 'display', label: 'Wyświetlanie' },
        { key: 'booking', label: 'Rezerwacje' },
        { key: 'reminders', label: 'Przypomnienia' },
        { key: 'cancellation', label: 'Anulowanie' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Ustawienia kalendarza
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Skonfiguruj wygląd i zachowanie kalendarza
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                        <span className="ml-3 text-gray-600">
                            Ładowanie ustawień...
                        </span>
                    </div>
                ) : (
                    <form
                        onSubmit={(event) => {
                            void handleSubmit(event);
                        }}
                    >
                        {/* Tabs */}
                        <div className="border-b border-gray-200 mb-6">
                            <nav className="-mb-px flex gap-4">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                            activeTab === tab.key
                                                ? 'border-primary-500 text-primary-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            {activeTab === 'display' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Domyślny widok
                                            </label>
                                            <select
                                                name="defaultView"
                                                value={
                                                    formData.defaultView ??
                                                    'day'
                                                }
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value="day">
                                                    Dzień
                                                </option>
                                                <option value="week">
                                                    Tydzień
                                                </option>
                                                <option value="month">
                                                    Miesiąc
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Interwał czasowy (minuty)
                                            </label>
                                            <select
                                                name="timeSlotDuration"
                                                value={
                                                    formData.timeSlotDuration ??
                                                    15
                                                }
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value={15}>
                                                    15 minut
                                                </option>
                                                <option value={30}>
                                                    30 minut
                                                </option>
                                                <option value={60}>
                                                    60 minut
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tydzień zaczyna się
                                            </label>
                                            <select
                                                name="weekStartsOn"
                                                value={
                                                    formData.weekStartsOn ?? 1
                                                }
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value={0}>
                                                    Niedziela
                                                </option>
                                                <option value={1}>
                                                    Poniedziałek
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Godzina rozpoczęcia
                                            </label>
                                            <input
                                                type="time"
                                                name="defaultStartTime"
                                                value={
                                                    formData.defaultStartTime ??
                                                    '08:00'
                                                }
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Godzina zakończenia
                                            </label>
                                            <input
                                                type="time"
                                                name="defaultEndTime"
                                                value={
                                                    formData.defaultEndTime ??
                                                    '20:00'
                                                }
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium text-gray-900">
                                            Opcje wyświetlania
                                        </h3>
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    name="showWeekends"
                                                    checked={
                                                        formData.showWeekends ??
                                                        false
                                                    }
                                                    onChange={handleChange}
                                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    Pokazuj weekendy
                                                </span>
                                            </label>
                                            <label className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    name="showEmployeePhotos"
                                                    checked={
                                                        formData.showEmployeePhotos ??
                                                        true
                                                    }
                                                    onChange={handleChange}
                                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    Pokazuj zdjęcia pracowników
                                                </span>
                                            </label>
                                            <label className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    name="showServiceColors"
                                                    checked={
                                                        formData.showServiceColors ??
                                                        true
                                                    }
                                                    onChange={handleChange}
                                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    Koloruj wizyty według usługi
                                                </span>
                                            </label>
                                            <label className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    name="compactView"
                                                    checked={
                                                        formData.compactView ??
                                                        false
                                                    }
                                                    onChange={handleChange}
                                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    Widok kompaktowy
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'booking' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Minimalny czas wizyty (minuty)
                                            </label>
                                            <input
                                                type="number"
                                                name="minAppointmentDuration"
                                                value={
                                                    formData.minAppointmentDuration ??
                                                    15
                                                }
                                                onChange={handleChange}
                                                min={5}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Maksymalny czas wizyty (minuty)
                                            </label>
                                            <input
                                                type="number"
                                                name="maxAppointmentDuration"
                                                value={
                                                    formData.maxAppointmentDuration ??
                                                    480
                                                }
                                                onChange={handleChange}
                                                max={720}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Bufor przed wizytą (minuty)
                                            </label>
                                            <input
                                                type="number"
                                                name="bufferTimeBefore"
                                                value={
                                                    formData.bufferTimeBefore ??
                                                    0
                                                }
                                                onChange={handleChange}
                                                min={0}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Bufor po wizycie (minuty)
                                            </label>
                                            <input
                                                type="number"
                                                name="bufferTimeAfter"
                                                value={
                                                    formData.bufferTimeAfter ??
                                                    0
                                                }
                                                onChange={handleChange}
                                                min={0}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Minimum godzin przed wizytą
                                            </label>
                                            <input
                                                type="number"
                                                name="minBookingAdvanceHours"
                                                value={
                                                    formData.minBookingAdvanceHours ??
                                                    1
                                                }
                                                onChange={handleChange}
                                                min={0}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Ile godzin wcześniej można
                                                zarezerwować wizytę
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Maksimum dni w przód
                                            </label>
                                            <input
                                                type="number"
                                                name="maxBookingAdvanceDays"
                                                value={
                                                    formData.maxBookingAdvanceDays ??
                                                    90
                                                }
                                                onChange={handleChange}
                                                min={1}
                                                max={365}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Ile dni w przyszłość można
                                                rezerwować
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                name="allowSameDayBooking"
                                                checked={
                                                    formData.allowSameDayBooking ??
                                                    true
                                                }
                                                onChange={handleChange}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                            <span className="text-sm text-gray-700">
                                                Zezwalaj na rezerwacje w tym
                                                samym dniu
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                name="allowOverlappingAppointments"
                                                checked={
                                                    formData.allowOverlappingAppointments ??
                                                    false
                                                }
                                                onChange={handleChange}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                            <span className="text-sm text-gray-700">
                                                Zezwalaj na nakładające się
                                                wizyty
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'reminders' && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                name="reminderEnabled"
                                                checked={
                                                    formData.reminderEnabled ??
                                                    true
                                                }
                                                onChange={handleChange}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                            <span className="text-sm text-gray-700">
                                                Włącz przypomnienia o wizytach
                                            </span>
                                        </label>

                                        {formData.reminderEnabled && (
                                            <div className="ml-7">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Ile godzin przed wizytą
                                                </label>
                                                <input
                                                    type="number"
                                                    name="reminderHoursBefore"
                                                    value={
                                                        formData.reminderHoursBefore ??
                                                        24
                                                    }
                                                    onChange={handleChange}
                                                    min={1}
                                                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                name="secondReminderEnabled"
                                                checked={
                                                    formData.secondReminderEnabled ??
                                                    false
                                                }
                                                onChange={handleChange}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                            <span className="text-sm text-gray-700">
                                                Włącz drugie przypomnienie
                                            </span>
                                        </label>

                                        {formData.secondReminderEnabled && (
                                            <div className="ml-7">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Ile godzin przed wizytą
                                                    (drugie)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="secondReminderHoursBefore"
                                                    value={
                                                        formData.secondReminderHoursBefore ??
                                                        2
                                                    }
                                                    onChange={handleChange}
                                                    min={1}
                                                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t pt-6">
                                        <h3 className="text-sm font-medium text-gray-900 mb-4">
                                            Obsługa nieobecności (no-show)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Auto-oznaczenie jako
                                                    nieobecny po (minuty)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="autoMarkNoshowAfterMinutes"
                                                    value={
                                                        formData.autoMarkNoshowAfterMinutes ??
                                                        30
                                                    }
                                                    onChange={handleChange}
                                                    min={5}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                        </div>
                                        <label className="flex items-center gap-3 mt-4">
                                            <input
                                                type="checkbox"
                                                name="noshowPenaltyEnabled"
                                                checked={
                                                    formData.noshowPenaltyEnabled ??
                                                    false
                                                }
                                                onChange={handleChange}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                            <span className="text-sm text-gray-700">
                                                Włącz kary za nieobecność
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'cancellation' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Termin anulowania (godziny)
                                            </label>
                                            <input
                                                type="number"
                                                name="cancellationDeadlineHours"
                                                value={
                                                    formData.cancellationDeadlineHours ??
                                                    24
                                                }
                                                onChange={handleChange}
                                                min={0}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Ile godzin przed wizytą klient
                                                może anulować bez opłat
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Termin zmiany terminu (godziny)
                                            </label>
                                            <input
                                                type="number"
                                                name="rescheduleDeadlineHours"
                                                value={
                                                    formData.rescheduleDeadlineHours ??
                                                    24
                                                }
                                                onChange={handleChange}
                                                min={0}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Ile godzin przed wizytą klient
                                                może zmienić termin
                                            </p>
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            name="allowClientReschedule"
                                            checked={
                                                formData.allowClientReschedule ??
                                                true
                                            }
                                            onChange={handleChange}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Zezwalaj klientom na zmianę terminu
                                            online
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Save button */}
                        <div className="mt-6 flex justify-end gap-4">
                            {saved && (
                                <span className="flex items-center text-green-600 text-sm">
                                    <svg
                                        className="w-5 h-5 mr-1"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Zapisano
                                </span>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                )}
                                Zapisz zmiany
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
