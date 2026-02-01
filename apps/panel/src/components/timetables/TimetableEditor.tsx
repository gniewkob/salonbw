'use client';

import { useState, useCallback } from 'react';
import type { Timetable, DayOfWeek } from '@/types';

interface Props {
    timetable: Timetable | null;
    onSave: (slots: SlotData[]) => Promise<void>;
    saving?: boolean;
}

export interface SlotData {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isBreak: boolean;
    notes?: string;
}

const DAY_NAMES: Record<DayOfWeek, string> = {
    0: 'Poniedziałek',
    1: 'Wtorek',
    2: 'Środa',
    3: 'Czwartek',
    4: 'Piątek',
    5: 'Sobota',
    6: 'Niedziela',
};

const DEFAULT_START = '09:00';
const DEFAULT_END = '17:00';

export default function TimetableEditor({ timetable, onSave, saving }: Props) {
    const [slots, setSlots] = useState<SlotData[]>(() => {
        if (timetable?.slots) {
            return timetable.slots.map((s) => ({
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                isBreak: s.isBreak,
                notes: s.notes,
            }));
        }
        // Default schedule: Mon-Fri 9:00-17:00
        return ([0, 1, 2, 3, 4] as DayOfWeek[]).map((d) => ({
            dayOfWeek: d,
            startTime: DEFAULT_START,
            endTime: DEFAULT_END,
            isBreak: false,
        }));
    });

    const getSlotForDay = useCallback(
        (day: DayOfWeek) => {
            return slots.find((s) => s.dayOfWeek === day && !s.isBreak);
        },
        [slots],
    );

    const getBreakForDay = useCallback(
        (day: DayOfWeek) => {
            return slots.find((s) => s.dayOfWeek === day && s.isBreak);
        },
        [slots],
    );

    const toggleDay = (day: DayOfWeek) => {
        const existing = getSlotForDay(day);
        if (existing) {
            // Remove all slots for this day
            setSlots((prev) => prev.filter((s) => s.dayOfWeek !== day));
        } else {
            // Add default slot
            setSlots((prev) => [
                ...prev,
                {
                    dayOfWeek: day,
                    startTime: DEFAULT_START,
                    endTime: DEFAULT_END,
                    isBreak: false,
                },
            ]);
        }
    };

    const updateSlot = (
        day: DayOfWeek,
        field: 'startTime' | 'endTime',
        value: string,
    ) => {
        setSlots((prev) =>
            prev.map((s) =>
                s.dayOfWeek === day && !s.isBreak
                    ? { ...s, [field]: value }
                    : s,
            ),
        );
    };

    const toggleBreak = (day: DayOfWeek) => {
        const existing = getBreakForDay(day);
        if (existing) {
            setSlots((prev) =>
                prev.filter((s) => !(s.dayOfWeek === day && s.isBreak)),
            );
        } else {
            // Add default break 12:00-12:30
            setSlots((prev) => [
                ...prev,
                {
                    dayOfWeek: day,
                    startTime: '12:00',
                    endTime: '12:30',
                    isBreak: true,
                },
            ]);
        }
    };

    const updateBreak = (
        day: DayOfWeek,
        field: 'startTime' | 'endTime',
        value: string,
    ) => {
        setSlots((prev) =>
            prev.map((s) =>
                s.dayOfWeek === day && s.isBreak ? { ...s, [field]: value } : s,
            ),
        );
    };

    const handleSave = async () => {
        await onSave(slots);
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Grafik tygodniowy
            </h3>

            <div className="space-y-4">
                {([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((day) => {
                    const slot = getSlotForDay(day);
                    const breakSlot = getBreakForDay(day);
                    const isWorking = !!slot;

                    return (
                        <div
                            key={day}
                            className={`flex items-center gap-4 p-4 rounded-lg border ${
                                isWorking
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-50 border-gray-100'
                            }`}
                        >
                            {/* Day toggle */}
                            <label className="flex items-center gap-3 w-40">
                                <input
                                    type="checkbox"
                                    checked={isWorking}
                                    onChange={() => toggleDay(day)}
                                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                />
                                <span
                                    className={`font-medium ${isWorking ? 'text-gray-800' : 'text-gray-400'}`}
                                >
                                    {DAY_NAMES[day]}
                                </span>
                            </label>

                            {isWorking && slot && (
                                <>
                                    {/* Work hours */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600">
                                            Od:
                                        </label>
                                        <input
                                            type="time"
                                            value={slot.startTime}
                                            onChange={(e) =>
                                                updateSlot(
                                                    day,
                                                    'startTime',
                                                    e.target.value,
                                                )
                                            }
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                        <label className="text-sm text-gray-600">
                                            Do:
                                        </label>
                                        <input
                                            type="time"
                                            value={slot.endTime}
                                            onChange={(e) =>
                                                updateSlot(
                                                    day,
                                                    'endTime',
                                                    e.target.value,
                                                )
                                            }
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    {/* Break toggle */}
                                    <div className="flex items-center gap-2 ml-4">
                                        <label className="flex items-center gap-2 text-sm text-gray-600">
                                            <input
                                                type="checkbox"
                                                checked={!!breakSlot}
                                                onChange={() =>
                                                    toggleBreak(day)
                                                }
                                                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400"
                                            />
                                            Przerwa
                                        </label>

                                        {breakSlot && (
                                            <div className="flex items-center gap-2 ml-2">
                                                <input
                                                    type="time"
                                                    value={breakSlot.startTime}
                                                    onChange={(e) =>
                                                        updateBreak(
                                                            day,
                                                            'startTime',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="px-2 py-1 border border-orange-200 rounded text-sm focus:ring-2 focus:ring-orange-400"
                                                />
                                                <span className="text-gray-400">
                                                    -
                                                </span>
                                                <input
                                                    type="time"
                                                    value={breakSlot.endTime}
                                                    onChange={(e) =>
                                                        updateBreak(
                                                            day,
                                                            'endTime',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="px-2 py-1 border border-orange-200 rounded text-sm focus:ring-2 focus:ring-orange-400"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {!isWorking && (
                                <span className="text-sm text-gray-400 italic">
                                    Dzień wolny
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    type="button"
                    onClick={() => {
                        void handleSave();
                    }}
                    disabled={saving}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? 'Zapisywanie...' : 'Zapisz grafik'}
                </button>
            </div>
        </div>
    );
}
