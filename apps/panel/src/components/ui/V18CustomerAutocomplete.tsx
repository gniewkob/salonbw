import { useState, type KeyboardEvent } from 'react';
import type { Customer } from '@/types';
import styles from '@/styles/V18BookingDrawer.module.css';

type Props = {
    id: string;
    value: string;
    customers: Customer[];
    pending: boolean;
    disabled: boolean;
    onChange: (value: string) => void;
    onSelect: (customer: Customer) => void;
};

export default function V18CustomerAutocomplete({
    id,
    value,
    customers,
    pending,
    disabled,
    onChange,
    onSelect,
}: Props) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const query = value.trim().toLocaleLowerCase('pl-PL');
    const matches =
        query.length >= 2
            ? customers.filter((customer) =>
                  [
                      customer.fullName,
                      customer.name,
                      customer.phone,
                      customer.email,
                  ].some((field) =>
                      String(field ?? '')
                          .toLocaleLowerCase('pl-PL')
                          .includes(query),
                  ),
              )
            : [];
    const showMatches = open && query.length >= 2;
    const choose = (customer: Customer) => {
        onSelect(customer);
        setOpen(false);
        setActiveIndex(0);
    };
    const handleKeys = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            setOpen(false);
            event.stopPropagation();
            return;
        }
        if (!showMatches || pending || matches.length === 0) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(
                (current) =>
                    (current +
                        (event.key === 'ArrowDown' ? 1 : -1) +
                        matches.length) %
                    matches.length,
            );
        } else if (event.key === 'Enter') {
            event.preventDefault();
            choose(matches[activeIndex] ?? matches[0]);
        }
    };

    return (
        <div
            className={styles.customerCombobox}
            onBlur={(event) => {
                if (
                    !event.currentTarget.contains(
                        event.relatedTarget as Node | null,
                    )
                ) {
                    setOpen(false);
                }
            }}
        >
            <input
                id={id}
                type="search"
                role="combobox"
                aria-label="Szukaj klienta"
                aria-autocomplete="list"
                aria-expanded={showMatches}
                aria-controls={id + '-matches'}
                aria-activedescendant={
                    showMatches && !pending && matches.length > 0
                        ? id + '-option-' + activeIndex
                        : undefined
                }
                className="form-control"
                placeholder="Szukaj po imieniu, nazwisku, telefonie..."
                autoComplete="off"
                disabled={disabled}
                value={value}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeys}
                onChange={(event) => {
                    setActiveIndex(0);
                    setOpen(true);
                    onChange(event.target.value);
                }}
            />
            {showMatches ? (
                <div
                    id={id + '-matches'}
                    role="listbox"
                    aria-label="Wyniki wyszukiwania klientów"
                    className={styles.customerMatches}
                >
                    {pending ? (
                        <p className={styles.customerEmpty}>Wyszukiwanie…</p>
                    ) : matches.length > 0 ? (
                        matches.map((customer, index) => (
                            <button
                                key={customer.id}
                                id={id + '-option-' + index}
                                type="button"
                                role="option"
                                aria-selected={index === activeIndex}
                                className={[
                                    styles.customerMatch,
                                    index === activeIndex
                                        ? styles.customerMatchActive
                                        : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                onMouseEnter={() => setActiveIndex(index)}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => choose(customer)}
                            >
                                <strong>
                                    {customer.fullName ?? customer.name}
                                </strong>
                                {customer.phone ? (
                                    <span
                                        className={styles.customerMatchDetails}
                                    >
                                        {customer.phone}
                                    </span>
                                ) : null}
                            </button>
                        ))
                    ) : (
                        <p className={styles.customerEmpty}>
                            Nie znaleziono klienta.
                        </p>
                    )}
                </div>
            ) : null}
        </div>
    );
}
