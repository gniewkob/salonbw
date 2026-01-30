'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { DateRange } from '@/types';

interface Props {
    value: DateRange;
    onChange: (range: DateRange, customFrom?: string, customTo?: string) => void;
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
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1">
                {RANGE_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => handleRangeChange(option.value)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            value === option.value
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {showCustom && (
                <div className="flex items-center gap-2 ml-2">
                    <input
                        type="date"
                        value={localFrom}
                        onChange={(e) => setLocalFrom(e.target.value)}
                        className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                        type="date"
                        value={localTo}
                        onChange={(e) => setLocalTo(e.target.value)}
                        className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleCustomApply}
                        className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        Zastosuj
                    </button>
                </div>
            )}
        </div>
    );
}
