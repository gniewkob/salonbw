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
        <div className="bg-white rounded-3 shadow p-4">
            <h3 className="fs-5 fw-semibold text-dark mb-3">
                Grafik tygodniowy
            </h3>

            <div className="gap-2">
                {([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((day) => {
                    const slot = getSlotForDay(day);
                    const breakSlot = getBreakForDay(day);
                    const isWorking = !!slot;

                    return (
                        <div
                            key={day}
                            className={`d-flex align-items-center gap-3 p-3 rounded-3 border ${
                                isWorking
                                    ? 'bg-white border-secondary border-opacity-25'
                                    : 'bg-light border-secondary border-opacity-10'
                            }`}
                        >
                            {/* Day toggle */}
                            <label className="d-flex align-items-center gap-2 w-40">
                                <input
                                    type="checkbox"
                                    checked={isWorking}
                                    onChange={() => toggleDay(day)}
                                    className="w-5 h-5 text-primary rounded focus:"
                                />
                                <span
                                    className={`fw-medium ${isWorking ? 'text-dark' : 'text-secondary'}`}
                                >
                                    {DAY_NAMES[day]}
                                </span>
                            </label>

                            {isWorking && slot && (
                                <>
                                    {/* Work hours */}
                                    <div className="d-flex align-items-center gap-2">
                                        <label className="small text-muted">
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
                                            className="px-3 py-1 border border-secondary border-opacity-50 rounded-3 small focus:"
                                        />
                                        <label className="small text-muted">
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
                                            className="px-3 py-1 border border-secondary border-opacity-50 rounded-3 small focus:"
                                        />
                                    </div>

                                    {/* Break toggle */}
                                    <div className="d-flex align-items-center gap-2 ms-3">
                                        <label className="d-flex align-items-center gap-2 small text-muted">
                                            <input
                                                type="checkbox"
                                                checked={!!breakSlot}
                                                onChange={() =>
                                                    toggleBreak(day)
                                                }
                                                className="w-4 h-4 text-warning rounded"
                                            />
                                            Przerwa
                                        </label>

                                        {breakSlot && (
                                            <div className="d-flex align-items-center gap-2 ms-2">
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
                                                    className="px-2 py-1 border border-orange-200 rounded small"
                                                />
                                                <span className="text-secondary">
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
                                                    className="px-2 py-1 border border-orange-200 rounded small"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {!isWorking && (
                                <span className="small text-secondary fst-italic">
                                    Dzień wolny
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 d-flex justify-content-end">
                <button
                    type="button"
                    onClick={() => {
                        void handleSave();
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-primary bg-opacity-10 text-white rounded-3 fw-medium bg-opacity-10 disabled:"
                >
                    {saving ? 'Zapisywanie...' : 'Zapisz grafik'}
                </button>
            </div>
        </div>
    );
}
