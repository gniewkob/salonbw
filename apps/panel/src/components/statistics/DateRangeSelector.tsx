'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DateRange } from '@/types';

interface Props {
    value: DateRange;
    onChange: (
        range: DateRange,
        customFrom?: string,
        customTo?: string,
    ) => void;
    customFrom?: string;
    customTo?: string;
}

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
    { value: DateRange.Today, label: 'Dziś' },
    { value: DateRange.Yesterday, label: 'Wczoraj' },
    { value: DateRange.ThisWeek, label: 'Ten tydzień' },
    { value: DateRange.LastWeek, label: 'Poprzedni tydzień' },
    { value: DateRange.ThisMonth, label: 'Ten miesiąc' },
    { value: DateRange.LastMonth, label: 'Poprzedni miesiąc' },
    { value: DateRange.ThisYear, label: 'Ten rok' },
    { value: DateRange.Custom, label: 'Własny zakres' },
];

export default function DateRangeSelector({
    value,
    onChange,
    customFrom,
    customTo,
}: Props) {
    const [showCustom, setShowCustom] = useState(value === DateRange.Custom);
    const [localFrom, setLocalFrom] = useState(
        customFrom || format(new Date(), 'yyyy-MM-dd'),
    );
    const [localTo, setLocalTo] = useState(
        customTo || format(new Date(), 'yyyy-MM-dd'),
    );

    // Synchronizacja stanu lokalnego, jeśli propsy z zewnątrz ulegną zmianie
    useEffect(() => {
        if (customFrom) setLocalFrom(customFrom);
    }, [customFrom]);

    useEffect(() => {
        if (customTo) setLocalTo(customTo);
    }, [customTo]);

    const handleRangeChange = (newRange: DateRange) => {
        if (newRange === DateRange.Custom) {
            setShowCustom(true);
            onChange(newRange, localFrom, localTo);
        } else {
            setShowCustom(false);
            onChange(newRange);
        }
    };

    const handleCustomApply = () => {
        onChange(DateRange.Custom, localFrom, localTo);
    };

    return (
        <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="d-flex flex-wrap gap-1">
                {RANGE_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => handleRangeChange(option.value)}
                        className={`px-3 py-1 small rounded-3 ${
                            value === option.value
                                ? 'bg-primary bg-opacity-10 text-white'
                                : 'bg-light text-body bg-opacity-25'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {showCustom && (
                <div className="d-flex align-items-center gap-2 ms-2">
                    <input
                        type="date"
                        aria-label="Data początkowa"
                        value={localFrom}
                        onChange={(e) => setLocalFrom(e.target.value)}
                        className="px-2 py-1 small border border-secondary border-opacity-50 rounded-3 focus:"
                    />
                    <span className="text-muted">-</span>
                    <input
                        type="date"
                        aria-label="Data końcowa"
                        value={localTo}
                        onChange={(e) => setLocalTo(e.target.value)}
                        className="px-2 py-1 small border border-secondary border-opacity-50 rounded-3 focus:"
                    />
                    <button
                        onClick={handleCustomApply}
                        className="px-3 py-1 small bg-primary bg-opacity-10 text-white rounded-3 bg-opacity-10"
                    >
                        Zastosuj
                    </button>
                </div>
            )}
        </div>
    );
}
