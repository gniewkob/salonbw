import type {
    V18CustomerNumberFilter,
    V18CustomerQuery,
    V18CustomerQueryAction,
} from '@/utils/v18CustomerQuery';
import styles from '@/styles/V18CustomerAdvancedFilters.module.css';

type Props = {
    query: V18CustomerQuery;
    onAction: (action: V18CustomerQueryAction) => void;
};

const ranges: ReadonlyArray<{
    title: string;
    minKey: V18CustomerNumberFilter;
    maxKey: V18CustomerNumberFilter;
    minLabel: string;
    maxLabel: string;
    max?: number;
    step: number;
}> = [
    {
        title: 'Wiek',
        minKey: 'ageMin',
        maxKey: 'ageMax',
        minLabel: 'Wiek od',
        maxLabel: 'Wiek do',
        max: 150,
        step: 1,
    },
    {
        title: 'Łączne wydatki (zł)',
        minKey: 'spentMin',
        maxKey: 'spentMax',
        minLabel: 'Wydatki od',
        maxLabel: 'Wydatki do',
        step: 0.01,
    },
];

/** Preserve backend-side filtering; do not filter a paginated result locally. */
export default function V18CustomerAdvancedFilters({ query, onAction }: Props) {
    const active = [
        query.gender,
        query.ageMin,
        query.ageMax,
        query.spentMin,
        query.spentMax,
    ].filter((value) => value !== undefined).length;
    const invalidAge =
        query.ageMin !== undefined &&
        query.ageMax !== undefined &&
        query.ageMin > query.ageMax;
    const invalidSpend =
        query.spentMin !== undefined &&
        query.spentMax !== undefined &&
        query.spentMin > query.spentMax;

    const updateNumber = (field: V18CustomerNumberFilter, raw: string) => {
        onAction({
            type: 'advancedNumber',
            field,
            value: raw === '' ? undefined : Number(raw),
        });
    };

    return (
        <details className={styles.disclosure}>
            <summary className={styles.summary}>
                <span>Filtry zaawansowane</span>
                {active > 0 ? (
                    <span className={styles.count} aria-label={`Aktywne filtry: ${active}`}>
                        {active}
                    </span>
                ) : null}
            </summary>
            <div className={styles.content}>
                <label className={styles.field}>
                    <span>Płeć</span>
                    <select
                        value={query.gender ?? ''}
                        onChange={(event) =>
                            onAction({
                                type: 'advancedGender',
                                value:
                                    event.target.value === 'female' ||
                                    event.target.value === 'male' ||
                                    event.target.value === 'other'
                                        ? event.target.value
                                        : undefined,
                            })
                        }
                    >
                        <option value="">Wszystkie</option>
                        <option value="female">Kobieta</option>
                        <option value="male">Mężczyzna</option>
                        <option value="other">Inna</option>
                    </select>
                </label>
                {ranges.map((range) => (
                    <fieldset className={styles.range} key={range.title}>
                        <legend>{range.title}</legend>
                        <div className={styles.rangeFields}>
                            <label className={styles.field}>
                                <span>{range.minLabel}</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={range.max}
                                    step={range.step}
                                    value={query[range.minKey] ?? ''}
                                    onChange={(event) =>
                                        updateNumber(
                                            range.minKey,
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                            <label className={styles.field}>
                                <span>{range.maxLabel}</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={range.max}
                                    step={range.step}
                                    value={query[range.maxKey] ?? ''}
                                    onChange={(event) =>
                                        updateNumber(
                                            range.maxKey,
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                        </div>
                    </fieldset>
                ))}
                {invalidAge || invalidSpend ? (
                    <p className={styles.warning} role="status">
                        Dolna granica nie może być większa od górnej.
                        Sprawdź zakres, jeśli lista jest pusta.
                    </p>
                ) : null}
                <p className={styles.helper}>
                    Kryteria są łączone z tagami, grupą i szybkimi filtrami.
                    Wyniki pochodzą z API, a wybór klientów pozostaje ograniczony
                    do bieżącej strony.
                </p>
            </div>
        </details>
    );
}
