import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
} from 'react';
import styles from '@/styles/V18Select.module.css';

export type V18SelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

type Props = {
    id?: string;
    ariaLabel: string;
    value: string;
    options: readonly V18SelectOption[];
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    menuPlacement?: 'bottom' | 'top';
};

/**
 * Select-only combobox for V18. The popup is fully styled rather than
 * delegating to the browser's native <select> menu. Selection remains a
 * simple string so the parent retains ownership of form state.
 */
export default function V18Select({
    id,
    ariaLabel,
    value,
    options,
    onChange,
    disabled = false,
    placeholder,
    className,
    menuPlacement = 'bottom',
}: Props) {
    const generatedId = useId();
    const controlId = id ?? `v18-select-${generatedId}`;
    const listId = `${controlId}-list`;
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const highlightedRef = useRef<HTMLLIElement>(null);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const enabledIndices = useMemo(
        () =>
            options.flatMap((option, index) =>
                option.disabled ? [] : [index],
            ),
        [options],
    );
    const selected = options.find((option) => option.value === value);
    const unavailable = disabled || enabledIndices.length === 0;

    const close = () => {
        setOpen(false);
    };
    const openMenu = () => {
        if (unavailable) return;
        const currentIndex = options.findIndex(
            (option) => option.value === value && !option.disabled,
        );
        setActiveIndex(currentIndex >= 0 ? currentIndex : enabledIndices[0]);
        setOpen(true);
    };
    const choose = (index: number) => {
        const option = options[index];
        if (!option || option.disabled) return;
        onChange(option.value);
        close();
        triggerRef.current?.focus();
    };
    const shift = (direction: number) => {
        if (enabledIndices.length === 0) return;
        const position = enabledIndices.indexOf(activeIndex);
        const start = position < 0 ? 0 : position;
        const next =
            (start + direction + enabledIndices.length) % enabledIndices.length;
        setActiveIndex(enabledIndices[next]);
    };

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                close();
            }
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open]);

    useEffect(() => {
        if (open) {
            highlightedRef.current?.scrollIntoView?.({ block: 'nearest' });
        }
    }, [open, activeIndex]);

    const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (unavailable) return;
        if (event.key === 'Escape') {
            if (open) {
                event.preventDefault();
                close();
            }
            return;
        }
        if (event.key === 'Tab') {
            close();
            return;
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) {
                openMenu();
            } else {
                shift(event.key === 'ArrowDown' ? 1 : -1);
            }
            return;
        }
        if (event.key === 'Home' || event.key === 'End') {
            if (!open) return;
            event.preventDefault();
            setActiveIndex(
                event.key === 'Home'
                    ? enabledIndices[0]
                    : enabledIndices[enabledIndices.length - 1],
            );
            return;
        }
        if (event.key === 'PageUp' || event.key === 'PageDown') {
            if (!open) return;
            event.preventDefault();
            const position = Math.max(0, enabledIndices.indexOf(activeIndex));
            const step = event.key === 'PageDown' ? 10 : -10;
            const index = Math.max(
                0,
                Math.min(enabledIndices.length - 1, position + step),
            );
            setActiveIndex(enabledIndices[index]);
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (open) {
                choose(activeIndex);
            } else {
                openMenu();
            }
            return;
        }
        if (open && event.key.length === 1) {
            const prefix = event.key.toLocaleLowerCase();
            const matchingIndex = options.findIndex(
                (option) =>
                    !option.disabled &&
                    option.label.toLocaleLowerCase().startsWith(prefix),
            );
            if (matchingIndex >= 0) setActiveIndex(matchingIndex);
        }
    };

    return (
        <div className={styles.root} ref={rootRef}>
            <button
                id={controlId}
                ref={triggerRef}
                type="button"
                role="combobox"
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-controls={listId}
                aria-expanded={open}
                aria-activedescendant={
                    open ? `${listId}-option-${activeIndex}` : undefined
                }
                disabled={unavailable}
                className={[styles.trigger, className]
                    .filter(Boolean)
                    .join(' ')}
                onClick={() => (open ? close() : openMenu())}
                onKeyDown={onKeyDown}
            >
                <span
                    className={[
                        styles.value,
                        !selected ? styles.placeholder : '',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                >
                    {selected?.label ?? placeholder ?? ''}
                </span>
                <svg
                    aria-hidden="true"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>
            {open && (
                <ul
                    id={listId}
                    role="listbox"
                    aria-label={ariaLabel}
                    className={[
                        styles.menu,
                        menuPlacement === 'top' ? styles.menuTop : '',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                >
                    {options.map((option, index) => (
                        <li
                            key={option.value}
                            ref={
                                index === activeIndex
                                    ? highlightedRef
                                    : undefined
                            }
                            id={`${listId}-option-${index}`}
                            role="option"
                            aria-selected={option.value === value}
                            aria-disabled={option.disabled || undefined}
                            className={[
                                styles.option,
                                index === activeIndex ? styles.active : '',
                                option.value === value ? styles.selected : '',
                                option.disabled ? styles.disabled : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            onMouseEnter={() => {
                                if (!option.disabled) setActiveIndex(index);
                            }}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => choose(index)}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
