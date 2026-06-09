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
        <div className="salonbw-sidebar">
            {/* Search */}
            <div className="salonbw-sidebar__search">
                <div className="mb-0">
                    <input
                        type="text"
                        placeholder="Szukaj klientów..."
                        aria-label="Szukaj klientów"
                        value={filters.search || ''}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="form-control input-sm"
                    />
                </div>
            </div>

            <div className="salonbw-sidebar__content">
                {/* Groups */}
                <div className="salonbw-sidebar__section">
                    <div className="salonbw-sidebar__header flex-between">
                        <span>GRUPY</span>
                        {onCreateGroup && (
                            <button
                                type="button"
                                onClick={onCreateGroup}
                                className="btn btn-link btn-sm p-0 text-salonbw-blue"
                            >
                                + dodaj
                            </button>
                        )}
                    </div>
                    <ul className="salonbw-sidebar__nav">
                        <li className={!filters.groupId ? 'active' : ''}>
                            <a
                                role="button"
                                tabIndex={0}
                                onClick={() => handleGroupSelect(undefined)}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' &&
                                    handleGroupSelect(undefined)
                                }
                            >
                                <span className="flex-fill">
                                    Wszyscy klienci
                                </span>
                            </a>
                        </li>
                        {groups.map((group) => (
                            <li
                                key={group.id}
                                className={
                                    filters.groupId === group.id ? 'active' : ''
                                }
                            >
                                <a
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleGroupSelect(group.id)}
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' &&
                                        handleGroupSelect(group.id)
                                    }
                                >
                                    <div className="flex-center w-full gap-8">
                                        {group.color &&
                                            (() => {
                                                const dotStyle = {
                                                    '--dynamic-color':
                                                        group.color || '#999',
                                                } as React.CSSProperties;
                                                return (
                                                    <span
                                                        className="status-dot w-8 h-8 bg-dynamic"
                                                        style={dotStyle}
                                                    />
                                                );
                                            })()}
                                        <span className="flex-fill text-truncate">
                                            {group.name}
                                        </span>
                                        {group.memberCount !== undefined && (
                                            <span className="badge badge-default">
                                                {group.memberCount}
                                            </span>
                                        )}
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Tagi */}
                <div className="salonbw-sidebar__section">
                    <div className="salonbw-sidebar__header">TAGI</div>
                    <div className="salonbw-sidebar__tag-list">
                        {tags.map((tag) => {
                            const tagStyle = {
                                '--dynamic-color':
                                    filters.tagId === tag.id
                                        ? '#008bb4'
                                        : tag.color || '#999',
                            } as React.CSSProperties;
                            return (
                                <button
                                    type="button"
                                    key={tag.id}
                                    onClick={() =>
                                        handleTagSelect(
                                            filters.tagId === tag.id
                                                ? undefined
                                                : tag.id,
                                        )
                                    }
                                    className={`label  bg-dynamic ${filters.tagId === tag.id ? 'label-primary' : 'label-default'}`}
                                    style={tagStyle}
                                >
                                    {tag.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Filtry zaawansowane */}
                <div className="salonbw-sidebar__section">
                    <button
                        type="button"
                        className="salonbw-sidebar__header flex-between w-100 border-0 bg-transparent p-0 text-start"
                        aria-expanded={showAdvancedFilters}
                        onClick={() =>
                            setShowAdvancedFilters(!showAdvancedFilters)
                        }
                    >
                        <span>FILTRY ZAAWANSOWANE</span>
                        <i
                            className={`fa ${showAdvancedFilters ? 'fa-angle-down' : 'fa-angle-right'}`}
                            aria-hidden="true"
                        ></i>
                    </button>

                    {showAdvancedFilters && (
                        <div className="salonbw-sidebar__filters">
                            <div className="mb-0">
                                <label
                                    htmlFor="filter-gender"
                                    className="form-label salonbw-label-xs"
                                >
                                    Płeć
                                </label>
                                <select
                                    id="filter-gender"
                                    value={filters.gender || ''}
                                    onChange={(e) =>
                                        onFilterChange({
                                            ...filters,
                                            gender: (e.target.value ||
                                                undefined) as CustomerFilterParams['gender'],
                                            page: 1,
                                        })
                                    }
                                    className="form-control input-sm"
                                >
                                    <option value="">Wszystkie</option>
                                    <option value="female">Kobieta</option>
                                    <option value="male">Mężczyzna</option>
                                    <option value="other">Inna</option>
                                </select>
                            </div>

                            <div className="row row-tight">
                                <div className="col-6">
                                    <label
                                        htmlFor="filter-age-min"
                                        className="form-label salonbw-label-xs"
                                    >
                                        Wiek od
                                    </label>
                                    <input
                                        id="filter-age-min"
                                        type="number"
                                        min={0}
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
                                        className="form-control input-sm"
                                    />
                                </div>
                                <div className="col-6">
                                    <label
                                        htmlFor="filter-age-max"
                                        className="form-label small mb-4"
                                    >
                                        do
                                    </label>
                                    <input
                                        id="filter-age-max"
                                        type="number"
                                        min={0}
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
                                        className="form-control input-sm"
                                    />
                                </div>
                            </div>

                            <div className="row row-tight">
                                <div className="col-6">
                                    <label
                                        htmlFor="filter-spent-min"
                                        className="form-label salonbw-label-xs"
                                    >
                                        Wydane od
                                    </label>
                                    <input
                                        id="filter-spent-min"
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
                                        className="form-control input-sm"
                                    />
                                </div>
                                <div className="col-6">
                                    <label
                                        htmlFor="filter-spent-max"
                                        className="form-label salonbw-label-xs"
                                    >
                                        do
                                    </label>
                                    <input
                                        id="filter-spent-max"
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
                                        className="form-control input-sm"
                                    />
                                </div>
                            </div>

                            <div className="checkbox m-0">
                                <label className="fz-12">
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
                            </div>
                            <div className="checkbox m-0">
                                <label className="fz-12">
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

                            <button
                                type="button"
                                onClick={() =>
                                    onFilterChange({
                                        page: 1,
                                        limit: filters.limit,
                                    })
                                }
                                className="btn btn-outline-secondary btn-sm d-block mt-5"
                            >
                                Wyczyść filtry
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
