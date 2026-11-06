import type {
    V18CustomerQuery,
    V18CustomerQueryAction,
} from '@/utils/v18CustomerQuery';
import V18Select from '@/components/ui/V18Select';
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
        <div
            className={styles.toolbar}
            role="search"
            aria-label="Filtry klientów"
        >
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
                <V18Select
                    ariaLabel="Na stronie"
                    value={String(query.pageSize)}
                    disabled={disabled}
                    onChange={(value) =>
                        onAction({
                            type: 'pageSize',
                            value: Number(value),
                        })
                    }
                    options={[
                        { value: '20', label: '20' },
                        { value: '50', label: '50' },
                        { value: '100', label: '100' },
                    ]}
                />
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
