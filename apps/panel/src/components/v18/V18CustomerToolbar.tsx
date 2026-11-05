import type {
    V18CustomerQuery,
    V18CustomerQueryAction,
} from '@/utils/v18CustomerQuery';
import styles from '@/styles/V18CustomersList.module.css';

type Props = {
    query: V18CustomerQuery;
    onAction: (action: V18CustomerQueryAction) => void;
    disabled?: boolean;
};

export default function V18CustomerToolbar({
    query,
    onAction,
    disabled = false,
}: Props) {
    return (
        <div className={styles.toolbar} role="search" aria-label="Filtry klientów">
            <label className={styles.field}>
                <span>Wyszukaj klienta</span>
                <input
                    type="search"
                    value={query.search}
                    disabled={disabled}
                    onChange={(event) =>
                        onAction({ type: 'search', value: event.target.value })
                    }
                    placeholder="Imię, telefon lub e-mail"
                />
            </label>
            <label className={styles.field}>
                <span>Na stronie</span>
                <select
                    value={query.pageSize}
                    disabled={disabled}
                    onChange={(event) =>
                        onAction({
                            type: 'pageSize',
                            value: Number(event.target.value),
                        })
                    }
                >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </label>
            <button
                className={styles.reset}
                type="button"
                disabled={disabled}
                onClick={() => onAction({ type: 'reset' })}
            >
                Wyczyść filtry
            </button>
        </div>
    );
}
