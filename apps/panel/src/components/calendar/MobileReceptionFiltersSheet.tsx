import { useState } from 'react';
import MobileBottomSheet from '@/components/salon/MobileBottomSheet';

interface MobileReceptionFiltersSheetProps {
    statusFilter: string;
    paymentFilter: string;
    alertFilter: boolean;
    priorityFilter: boolean;
    setStatusFilter: (value: string) => void;
    setPaymentFilter: (value: string) => void;
    setAlertFilter: (value: boolean) => void;
    setPriorityFilter: (value: boolean) => void;
    resetAll: () => void;
}

const STATUS_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'scheduled', label: 'Zaplanowane' },
    { value: 'confirmed', label: 'Potwierdzone' },
    { value: 'in_progress', label: 'W trakcie' },
    { value: 'completed', label: 'Zakończone' },
    { value: 'cancelled', label: 'Anulowane' },
    { value: 'no_show', label: 'No-show' },
];

const PAYMENT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'unpaid', label: 'Nieopłacone' },
    { value: 'to_finalize', label: 'Do finalizacji' },
];

function countActive(props: MobileReceptionFiltersSheetProps): number {
    let n = 0;
    if (props.statusFilter !== 'all') n += 1;
    if (props.paymentFilter !== 'all') n += 1;
    if (props.alertFilter) n += 1;
    if (props.priorityFilter) n += 1;
    return n;
}

export default function MobileReceptionFiltersSheet(
    props: MobileReceptionFiltersSheetProps,
) {
    const [open, setOpen] = useState(false);
    const activeCount = countActive(props);
    const isAnyActive = activeCount > 0;

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.75rem 0.75rem 0',
                }}
            >
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    style={{
                        flex: 1,
                        minHeight: 44,
                        padding: '0.625rem 0.875rem',
                        background: isAnyActive ? '#0d0d0d' : '#ffffff',
                        color: isAnyActive ? '#ffffff' : '#1a1a1a',
                        border: `1px solid ${
                            isAnyActive ? '#0d0d0d' : '#d1d5db'
                        }`,
                        borderRadius: 4,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        letterSpacing: '0.03em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                    }}
                >
                    <span>Filtry</span>
                    {isAnyActive ? (
                        <span
                            aria-label={`${activeCount} aktywnych filtrów`}
                            style={{
                                background: '#ffffff',
                                color: '#0d0d0d',
                                borderRadius: 999,
                                minWidth: 22,
                                height: 22,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 0.5rem',
                            }}
                        >
                            {activeCount}
                        </span>
                    ) : null}
                </button>
                {isAnyActive ? (
                    <button
                        type="button"
                        onClick={props.resetAll}
                        style={{
                            minHeight: 44,
                            padding: '0.625rem 0.875rem',
                            background: '#ffffff',
                            color: '#842029',
                            border: '1px solid #dc3545',
                            borderRadius: 4,
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            letterSpacing: '0.03em',
                            cursor: 'pointer',
                        }}
                    >
                        Wyczyść
                    </button>
                ) : null}
            </div>
            <MobileBottomSheet
                open={open}
                onClose={() => setOpen(false)}
                title="Filtry wizyt"
            >
                <FilterGroup label="Status">
                    {STATUS_OPTIONS.map((option) => (
                        <FilterRadio
                            key={option.value}
                            name="status"
                            value={option.value}
                            checked={props.statusFilter === option.value}
                            label={option.label}
                            onSelect={() => props.setStatusFilter(option.value)}
                        />
                    ))}
                </FilterGroup>
                <FilterGroup label="Płatność">
                    {PAYMENT_OPTIONS.map((option) => (
                        <FilterRadio
                            key={option.value}
                            name="payment"
                            value={option.value}
                            checked={props.paymentFilter === option.value}
                            label={option.label}
                            onSelect={() =>
                                props.setPaymentFilter(option.value)
                            }
                        />
                    ))}
                </FilterGroup>
                <FilterGroup label="Dodatkowe">
                    <FilterToggle
                        label="Tylko z alertem CRM"
                        checked={props.alertFilter}
                        onChange={props.setAlertFilter}
                    />
                    <FilterToggle
                        label="Tylko priorytetowe"
                        checked={props.priorityFilter}
                        onChange={props.setPriorityFilter}
                    />
                </FilterGroup>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        paddingTop: '1rem',
                    }}
                >
                    <button
                        type="button"
                        onClick={props.resetAll}
                        style={{
                            flex: 1,
                            minHeight: 48,
                            padding: '0.75rem 1rem',
                            background: '#ffffff',
                            color: '#1a1a1a',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Resetuj
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        style={{
                            flex: 2,
                            minHeight: 48,
                            padding: '0.75rem 1rem',
                            background: '#0d0d0d',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                        }}
                    >
                        Zastosuj
                    </button>
                </div>
            </MobileBottomSheet>
        </>
    );
}

interface FilterGroupProps {
    label: string;
    children: React.ReactNode;
}

function FilterGroup({ label, children }: FilterGroupProps) {
    return (
        <fieldset
            style={{
                border: 'none',
                margin: 0,
                padding: '0.75rem 0 0.5rem',
            }}
        >
            <legend
                style={{
                    padding: 0,
                    margin: '0 0 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#6c757d',
                }}
            >
                {label}
            </legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {children}
            </div>
        </fieldset>
    );
}

interface FilterRadioProps {
    name: string;
    value: string;
    checked: boolean;
    label: string;
    onSelect: () => void;
}

function FilterRadio({
    name,
    value,
    checked,
    label,
    onSelect,
}: FilterRadioProps) {
    return (
        <label
            htmlFor={`${name}-${value}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                minHeight: 44,
                padding: '0.5rem 0.75rem',
                background: checked ? '#f8f9fa' : '#ffffff',
                border: `1px solid ${checked ? '#0d0d0d' : '#e5e7eb'}`,
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.95rem',
                color: '#1a1a1a',
            }}
        >
            <input
                id={`${name}-${value}`}
                type="radio"
                name={name}
                checked={checked}
                onChange={onSelect}
                style={{
                    width: 20,
                    height: 20,
                    accentColor: '#0d0d0d',
                    margin: 0,
                }}
            />
            <span>{label}</span>
        </label>
    );
}

interface FilterToggleProps {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}

function FilterToggle({ label, checked, onChange }: FilterToggleProps) {
    return (
        <label
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                minHeight: 44,
                padding: '0.5rem 0.75rem',
                background: checked ? '#f8f9fa' : '#ffffff',
                border: `1px solid ${checked ? '#0d0d0d' : '#e5e7eb'}`,
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.95rem',
                color: '#1a1a1a',
            }}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                style={{
                    width: 20,
                    height: 20,
                    accentColor: '#0d0d0d',
                    margin: 0,
                }}
            />
            <span>{label}</span>
        </label>
    );
}
