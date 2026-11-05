import type {
    V18CustomerQuickFilter,
    V18CustomerQueryAction,
} from '@/utils/v18CustomerQuery';
import styles from '@/styles/V18CustomersPilot.module.css';

const quickFilters: ReadonlyArray<{
    key: Exclude<V18CustomerQuickFilter, ''>;
    label: string;
}> = [
    { key: 'upcoming', label: 'Nadchodząca wizyta' },
    { key: 'inactive6m', label: 'Brak wizyty >6 mies.' },
    { key: 'new', label: 'Nowi klienci' },
    { key: 'noEmailConsent', label: 'Brak zgody e-mail' },
    { key: 'noSmsConsent', label: 'Brak zgody SMS' },
];

type Props = {
    active: V18CustomerQuickFilter;
    onAction: (action: V18CustomerQueryAction) => void;
};

export default function V18CustomerQuickFilters({ active, onAction }: Props) {
    return (
        <div
            className={styles.quickFilters}
            role="group"
            aria-label="Szybkie filtry klientów"
        >
            {quickFilters.map(({ key, label }) => (
                <button
                    key={key}
                    type="button"
                    className={[
                        styles.quickChip,
                        active === key ? styles.quickChipActive : '',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    aria-pressed={active === key}
                    onClick={() => onAction({ type: 'quickFilter', value: key })}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
