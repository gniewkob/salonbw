import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
} from 'react';
import type { Service } from '@/types';

interface Props {
    id?: string;
    services: Service[];
    value: number | '';
    onChange: (id: number | '') => void;
    disabled?: boolean;
}

/**
 * Searchable combobox for service picker in the appointment drawer.
 * - Filters client-side (no extra fetches) by service name (case-insensitive).
 * - Shows duration + price per option when available.
 * - Keyboard: ↑/↓ navigate, Enter selects, Escape closes.
 * - Style: brand B&W — no blue accents; active option uses #0d0d0d fill.
 * - Preserves the existing state contract: value is a service id (number | '').
 */
export default function ServiceCombobox({
    id,
    services,
    value,
    onChange,
    disabled = false,
}: Props) {
    const autoId = useId();
    const inputId = id ?? `svc-combobox-${autoId}`;
    const listId = `${inputId}-list`;

    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Derive display name of the currently selected service.
    const selectedService = useMemo(
        () => services.find((s) => s.id === Number(value)),
        [services, value],
    );

    // Filter list. When the list is open and query is empty show all services.
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return services;
        return services.filter((s) => s.name.toLowerCase().includes(q));
    }, [services, query]);

    // Reset highlight when filter result changes.
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [filtered]);

    // When dropdown opens, prime query with current selection so user can refine.
    const openDropdown = () => {
        if (disabled) return;
        setQuery('');
        setIsOpen(true);
        setHighlightedIndex(-1);
    };

    const closeDropdown = () => {
        setIsOpen(false);
        setQuery('');
    };

    const selectService = (svc: Service) => {
        onChange(svc.id);
        setQuery('');
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const clearSelection = () => {
        onChange('');
        setQuery('');
        setIsOpen(false);
    };

    // Close on outside click.
    useEffect(() => {
        if (!isOpen) return;
        const handlePointerDown = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                closeDropdown();
            }
        };
        document.addEventListener('pointerdown', handlePointerDown);
        return () =>
            document.removeEventListener('pointerdown', handlePointerDown);
    }, [isOpen]);

    // Scroll highlighted item into view.
    useEffect(() => {
        if (!isOpen || highlightedIndex < 0) return;
        const list = listRef.current;
        if (!list) return;
        const item = list.children[highlightedIndex + 1] as
            | HTMLElement
            | undefined; // +1 because first child is the "clear" option
        item?.scrollIntoView({ block: 'nearest' });
    }, [highlightedIndex, isOpen]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                e.preventDefault();
                openDropdown();
            }
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((i) =>
                    i < filtered.length - 1 ? i + 1 : 0,
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((i) =>
                    i > 0 ? i - 1 : filtered.length - 1,
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
                    selectService(filtered[highlightedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                closeDropdown();
                break;
            case 'Tab':
                closeDropdown();
                break;
        }
    };

    // The text shown in the input field.
    const inputDisplayValue = isOpen ? query : (selectedService?.name ?? '');

    const formatMeta = (svc: Service): string => {
        const parts: string[] = [];
        if (svc.duration) parts.push(`${svc.duration} min`);
        if (svc.price != null) {
            const price =
                typeof svc.price === 'string'
                    ? Number(svc.price)
                    : (svc.price as number);
            if (Number.isFinite(price)) parts.push(`${price.toFixed(2)} PLN`);
        }
        return parts.join(' · ');
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
                <input
                    ref={inputRef}
                    id={inputId}
                    type="text"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-autocomplete="list"
                    aria-controls={listId}
                    aria-activedescendant={
                        highlightedIndex >= 0
                            ? `${listId}-opt-${highlightedIndex}`
                            : undefined
                    }
                    className="form-control"
                    placeholder="Szukaj usługi..."
                    value={inputDisplayValue}
                    disabled={disabled}
                    onFocus={openDropdown}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                />
                {/* Caret hint */}
                <span
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: disabled ? '#aaa' : '#6e7278',
                        fontSize: 10,
                    }}
                >
                    ▾
                </span>
            </div>

            {isOpen && (
                <ul
                    ref={listRef}
                    id={listId}
                    role="listbox"
                    aria-label="Usługi"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1300,
                        maxHeight: 272, // ~8 items × 34px
                        overflowY: 'auto',
                        margin: 0,
                        padding: 0,
                        listStyle: 'none',
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,0.14)',
                        borderRadius: 6,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        marginTop: 2,
                    }}
                >
                    {/* Clear / empty option */}
                    <li
                        role="option"
                        id={`${listId}-opt-clear`}
                        aria-selected={value === ''}
                        onClick={clearSelection}
                        style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            color: '#9a9ea4',
                            fontSize: 13,
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                        }}
                        onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.background =
                                '#f0f0f0')
                        }
                        onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.background =
                                '')
                        }
                    >
                        — Wybierz usługę —
                    </li>

                    {filtered.length === 0 ? (
                        <li
                            style={{
                                padding: '8px 12px',
                                color: '#9a9ea4',
                                fontSize: 13,
                                fontStyle: 'italic',
                            }}
                        >
                            Brak usług dla &ldquo;{query}&rdquo;
                        </li>
                    ) : (
                        filtered.map((svc, i) => {
                            const isSelected = svc.id === Number(value);
                            const isHighlighted = i === highlightedIndex;
                            const meta = formatMeta(svc);
                            return (
                                <li
                                    key={svc.id}
                                    id={`${listId}-opt-${i}`}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => selectService(svc)}
                                    onMouseEnter={() => setHighlightedIndex(i)}
                                    style={{
                                        padding: '7px 12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'baseline',
                                        gap: 8,
                                        background: isHighlighted
                                            ? '#f0f0f0'
                                            : isSelected
                                              ? '#f7f7f7'
                                              : undefined,
                                        borderLeft: isSelected
                                            ? '3px solid #0d0d0d'
                                            : '3px solid transparent',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 13,
                                            color: '#1a1a1a',
                                            fontWeight: isSelected ? 600 : 400,
                                            minWidth: 0,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {svc.name}
                                    </span>
                                    {meta && (
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: '#9a9ea4',
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {meta}
                                        </span>
                                    )}
                                </li>
                            );
                        })
                    )}
                </ul>
            )}
        </div>
    );
}
