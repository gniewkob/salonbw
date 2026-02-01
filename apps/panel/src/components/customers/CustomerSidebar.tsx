'use client';

import { useState } from 'react';
import { CustomerGroup, CustomerTag, CustomerFilterParams } from '@/types';

interface Props {
    groups: CustomerGroup[];
    tags: CustomerTag[];
    filters: CustomerFilterParams;
    onFilterChange: (filters: CustomerFilterParams) => void;
    onCreateGroup?: () => void;
}

export default function CustomerSidebar({
    groups,
    tags,
    filters,
    onFilterChange,
    onCreateGroup,
}: Props) {
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const handleGroupSelect = (groupId: number | undefined) => {
        onFilterChange({ ...filters, groupId, page: 1 });
    };

    const handleTagSelect = (tagId: number | undefined) => {
        onFilterChange({ ...filters, tagId, page: 1 });
    };

    const handleSearchChange = (search: string) => {
        onFilterChange({ ...filters, search, page: 1 });
    };

    return (
        <div className="flex h-full w-64 flex-col border-r bg-gray-50">
            {/* Search */}
            <div className="border-b p-4">
                <input
                    type="text"
                    placeholder="Szukaj klientów..."
                    value={filters.search || ''}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm"
                />
            </div>

            {/* Groups */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700">
                            Grupy
                        </h3>
                        {onCreateGroup && (
                            <button
                                onClick={onCreateGroup}
                                className="text-xs text-cyan-600 hover:text-cyan-700"
                            >
                                + Dodaj
                            </button>
                        )}
                    </div>
                    <ul className="space-y-1">
                        <li>
                            <button
                                onClick={() => handleGroupSelect(undefined)}
                                className={`w-full rounded px-2 py-1 text-left text-sm ${
                                    !filters.groupId
                                        ? 'bg-cyan-100 text-cyan-800'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Wszyscy klienci
                            </button>
                        </li>
                        {groups.map((group) => (
                            <li key={group.id}>
                                <button
                                    onClick={() => handleGroupSelect(group.id)}
                                    className={`flex w-full items-center rounded px-2 py-1 text-left text-sm ${
                                        filters.groupId === group.id
                                            ? 'bg-cyan-100 text-cyan-800'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {group.color && (
                                        <span
                                            className="mr-2 h-2 w-2 rounded-full"
                                            style={{
                                                backgroundColor: group.color,
                                            }}
                                        />
                                    )}
                                    <span className="flex-1">{group.name}</span>
                                    {group.memberCount !== undefined && (
                                        <span className="text-xs text-gray-400">
                                            {group.memberCount}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Tags */}
                <div className="mb-4">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                        Tagi
                    </h3>
                    <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => (
                            <button
                                key={tag.id}
                                onClick={() =>
                                    handleTagSelect(
                                        filters.tagId === tag.id
                                            ? undefined
                                            : tag.id,
                                    )
                                }
                                className={`rounded px-2 py-0.5 text-xs ${
                                    filters.tagId === tag.id
                                        ? 'bg-cyan-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                style={
                                    tag.color && filters.tagId !== tag.id
                                        ? {
                                              backgroundColor: tag.color,
                                              color: '#fff',
                                          }
                                        : undefined
                                }
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Advanced Filters Toggle */}
                <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                >
                    {showAdvancedFilters ? '▼' : '▶'} Filtry zaawansowane
                </button>

                {showAdvancedFilters && (
                    <div className="mt-2 space-y-3 rounded border bg-white p-3">
                        {/* Gender */}
                        <div>
                            <label className="mb-1 block text-xs text-gray-500">
                                Płeć
                            </label>
                            <select
                                value={filters.gender || ''}
                                onChange={(e) =>
                                    onFilterChange({
                                        ...filters,
                                        gender: (e.target.value ||
                                            undefined) as CustomerFilterParams['gender'],
                                        page: 1,
                                    })
                                }
                                className="w-full rounded border px-2 py-1 text-sm"
                            >
                                <option value="">Wszystkie</option>
                                <option value="female">Kobieta</option>
                                <option value="male">Mężczyzna</option>
                                <option value="other">Inna</option>
                            </select>
                        </div>

                        {/* Age Range */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="mb-1 block text-xs text-gray-500">
                                    Wiek od
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={150}
                                    value={filters.ageMin || ''}
                                    onChange={(e) =>
                                        onFilterChange({
                                            ...filters,
                                            ageMin: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                            page: 1,
                                        })
                                    }
                                    className="w-full rounded border px-2 py-1 text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="mb-1 block text-xs text-gray-500">
                                    do
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={150}
                                    value={filters.ageMax || ''}
                                    onChange={(e) =>
                                        onFilterChange({
                                            ...filters,
                                            ageMax: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                            page: 1,
                                        })
                                    }
                                    className="w-full rounded border px-2 py-1 text-sm"
                                />
                            </div>
                        </div>

                        {/* Spending Range */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="mb-1 block text-xs text-gray-500">
                                    Wydane od
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={filters.spentMin || ''}
                                    onChange={(e) =>
                                        onFilterChange({
                                            ...filters,
                                            spentMin: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                            page: 1,
                                        })
                                    }
                                    className="w-full rounded border px-2 py-1 text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="mb-1 block text-xs text-gray-500">
                                    do
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={filters.spentMax || ''}
                                    onChange={(e) =>
                                        onFilterChange({
                                            ...filters,
                                            spentMax: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                            page: 1,
                                        })
                                    }
                                    className="w-full rounded border px-2 py-1 text-sm"
                                />
                            </div>
                        </div>

                        {/* Consent Filters */}
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={filters.smsConsent === true}
                                    onChange={(e) =>
                                        onFilterChange({
                                            ...filters,
                                            smsConsent: e.target.checked
                                                ? true
                                                : undefined,
                                            page: 1,
                                        })
                                    }
                                />
                                Zgoda SMS
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={filters.emailConsent === true}
                                    onChange={(e) =>
                                        onFilterChange({
                                            ...filters,
                                            emailConsent: e.target.checked
                                                ? true
                                                : undefined,
                                            page: 1,
                                        })
                                    }
                                />
                                Zgoda e-mail
                            </label>
                        </div>

                        {/* Clear Filters */}
                        <button
                            onClick={() =>
                                onFilterChange({
                                    page: 1,
                                    limit: filters.limit,
                                })
                            }
                            className="w-full rounded border px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            Wyczyść filtry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
