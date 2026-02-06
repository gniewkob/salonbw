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
        <div className="versum-sidebar">
            {/* Search */}
            <div className="versum-sidebar__item" style={{ padding: '15px' }}>
                <div className="form-group mb-0">
                    <input
                        type="text"
                        placeholder="Szukaj klientów..."
                        value={filters.search || ''}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="form-control input-sm"
                    />
                </div>
            </div>

            <div className="versum-sidebar__content">
                {/* Groups */}
                <div className="versum-sidebar__section">
                    <div className="versum-sidebar__header flex-between">
                        <span>GRUPY</span>
                        {onCreateGroup && (
                            <button
                                onClick={onCreateGroup}
                                className="btn btn-link btn-xs p-0"
                                style={{ color: '#008bb4' }}
                            >
                                + dodaj
                            </button>
                        )}
                    </div>
                    <ul className="versum-sidebar__nav">
                        <li className={!filters.groupId ? 'active' : ''}>
                            <a onClick={() => handleGroupSelect(undefined)}>
                                <span className="flex-1">Wszyscy klienci</span>
                            </a>
                        </li>
                        {groups.map((group) => (
                            <li
                                key={group.id}
                                className={
                                    filters.groupId === group.id ? 'active' : ''
                                }
                            >
                                <a onClick={() => handleGroupSelect(group.id)}>
                                    <div
                                        className="flex-center"
                                        style={{ gap: '8px', width: '100%' }}
                                    >
                                        {group.color && (
                                            <span
                                                className="status-dot"
                                                style={{
                                                    backgroundColor:
                                                        group.color,
                                                    width: '8px',
                                                    height: '8px',
                                                }}
                                            />
                                        )}
                                        <span className="flex-1 text-truncate">
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
                <div className="versum-sidebar__section">
                    <div className="versum-sidebar__header">TAGI</div>
                    <div
                        style={{
                            padding: '0 15px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                        }}
                    >
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
                                className={`label ${filters.tagId === tag.id ? 'label-primary' : 'label-default'}`}
                                style={{
                                    cursor: 'pointer',
                                    backgroundColor:
                                        filters.tagId === tag.id
                                            ? '#008bb4'
                                            : tag.color || '#999',
                                    borderColor: 'transparent',
                                    fontWeight: 400,
                                }}
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filtry zaawansowane */}
                <div className="versum-sidebar__section">
                    <div
                        className="versum-sidebar__header flex-between"
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                            setShowAdvancedFilters(!showAdvancedFilters)
                        }
                    >
                        <span>FILTRY ZAAWANSOWANE</span>
                        <i
                            className={`fa ${showAdvancedFilters ? 'fa-angle-down' : 'fa-angle-right'}`}
                        ></i>
                    </div>

                    {showAdvancedFilters && (
                        <div
                            style={{
                                padding: '10px 15px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                            }}
                        >
                            <div className="form-group mb-0">
                                <label
                                    className="control-label"
                                    style={{
                                        fontSize: '11px',
                                        marginBottom: '4px',
                                    }}
                                >
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
                                    className="form-control input-sm"
                                >
                                    <option value="">Wszystkie</option>
                                    <option value="female">Kobieta</option>
                                    <option value="male">Mężczyzna</option>
                                    <option value="other">Inna</option>
                                </select>
                            </div>

                            <div className="row row-tight">
                                <div className="col-xs-6">
                                    <label
                                        className="control-label"
                                        style={{
                                            fontSize: '11px',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Wiek od
                                    </label>
                                    <input
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
                                <div className="col-xs-6">
                                    <label
                                        className="control-label"
                                        style={{
                                            fontSize: '11px',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        do
                                    </label>
                                    <input
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
                                <div className="col-xs-6">
                                    <label
                                        className="control-label"
                                        style={{
                                            fontSize: '11px',
                                            marginBottom: '4px',
                                        }}
                                    >
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
                                        className="form-control input-sm"
                                    />
                                </div>
                                <div className="col-xs-6">
                                    <label
                                        className="control-label"
                                        style={{
                                            fontSize: '11px',
                                            marginBottom: '4px',
                                        }}
                                    >
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
                                        className="form-control input-sm"
                                    />
                                </div>
                            </div>

                            <div className="checkbox" style={{ margin: 0 }}>
                                <label style={{ fontSize: '12px' }}>
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
                            <div className="checkbox" style={{ margin: 0 }}>
                                <label style={{ fontSize: '12px' }}>
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
                                onClick={() =>
                                    onFilterChange({
                                        page: 1,
                                        limit: filters.limit,
                                    })
                                }
                                className="btn btn-default btn-xs btn-block"
                                style={{ marginTop: '5px' }}
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
