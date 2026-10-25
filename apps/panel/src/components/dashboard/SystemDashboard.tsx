import { useSystemStatus } from '@/hooks/useSystemStatus';
import styles from './SystemDashboard.module.css';

const labels: Record<string, string> = {
    database: 'Baza danych',
    smtp: 'Poczta SMTP',
    instagram: 'Instagram',
};
const statuses: Record<string, string> = {
    ok: 'Sprawne',
    error: 'Awaria',
    skipped: 'Nie skonfigurowano',
};
const bodyFont = "var(--salon-font-body, 'Open Sans', sans-serif)";
const headingFont =
    "var(--salon-font-heading, 'Playfair Display', Georgia, serif)";
const textStyle = { fontSize: 16, lineHeight: 1.6, margin: 0 };

export default function SystemDashboard() {
    const { data, isPending, isFetching, isError, refetch } = useSystemStatus();
    return (
        <div
            className={styles.dashboard}
            style={{ color: 'var(--salon-text)', fontFamily: bodyFont }}
        >
            <header className={styles.header}>
                <div>
                    <h1
                        style={{
                            fontFamily: headingFont,
                            fontSize: 28,
                            fontWeight: 700,
                            lineHeight: 1.3,
                            margin: '0 0 6px',
                        }}
                    >
                        Stan systemu
                    </h1>
                    <p style={{ ...textStyle, color: 'var(--salon-muted)' }}>
                        Pulpit administratora systemu
                    </p>
                </div>
                <button
                    type="button"
                    className={styles.button}
                    disabled={isFetching}
                    onClick={() => void refetch()}
                >
                    {isFetching ? 'Odświeżanie…' : 'Odśwież'}
                </button>
            </header>
            {isError ? (
                <p role="alert" style={textStyle}>
                    Nie udało się pobrać aktualnego stanu systemu. Poprzedni
                    wynik nie potwierdza jego obecnego działania.
                </p>
            ) : isPending || !data ? (
                <p role="status" style={textStyle}>
                    Sprawdzanie stanu systemu…
                </p>
            ) : (
                <>
                    <section
                        aria-label="Bieżące kontrole"
                        className={styles.checks}
                    >
                        {[
                            {
                                key: 'api',
                                title: 'API',
                                status: data.api.status,
                                latencyMs: undefined,
                            },
                            ...Object.entries(data.services).map(
                                ([key, value]) => ({
                                    key,
                                    title: labels[key] ?? key,
                                    ...value,
                                }),
                            ),
                        ].map((item) => (
                            <div key={item.key} className={styles.card}>
                                <h2
                                    style={{
                                        fontFamily: bodyFont,
                                        fontSize: 16,
                                        fontWeight: 600,
                                        lineHeight: 1.5,
                                        margin: 0,
                                    }}
                                >
                                    {item.title}
                                </h2>
                                <p
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 600,
                                        lineHeight: 1.4,
                                        margin: 0,
                                    }}
                                >
                                    {statuses[item.status] ?? 'Brak danych'}
                                </p>
                                {item.latencyMs != null &&
                                    item.status !== 'skipped' && (
                                        <p
                                            style={{
                                                ...textStyle,
                                                color: 'var(--salon-muted)',
                                            }}
                                        >
                                            Odpowiedź:{' '}
                                            {Math.round(item.latencyMs)} ms
                                        </p>
                                    )}
                            </div>
                        ))}
                    </section>
                    <p
                        role="status"
                        className={styles.summary}
                        style={{ fontSize: 16 }}
                    >
                        {data.status === 'ok'
                            ? 'Bieżące kontrole zakończyły się poprawnie.'
                            : 'Wykryto awarię lub niepełną konfigurację.'}
                    </p>
                    <dl className={styles.metadata}>
                        <div>
                            <dt>Ostatnia kontrola</dt>
                            <dd>
                                {new Intl.DateTimeFormat('pl-PL', {
                                    dateStyle: 'short',
                                    timeStyle: 'medium',
                                    timeZone: 'Europe/Warsaw',
                                }).format(new Date(data.checkedAt))}
                            </dd>
                        </div>
                        <div>
                            <dt>Czas pracy procesu API</dt>
                            <dd>
                                {Math.floor(data.api.uptimeSeconds / 60)} min
                            </dd>
                        </div>
                        <div className={styles.revision}>
                            <dt>Wersja API</dt>
                            <dd>
                                {data.api.revision ? (
                                    <code>{data.api.revision}</code>
                                ) : (
                                    'Brak metadanych wydania'
                                )}
                            </dd>
                        </div>
                    </dl>
                    <section className={styles.scope}>
                        <h2
                            style={{
                                fontFamily: headingFont,
                                fontSize: 20,
                                fontWeight: 700,
                                lineHeight: 1.4,
                                margin: 0,
                            }}
                        >
                            Powiadomienia i zakres kontroli
                        </h2>
                        <p style={textStyle}>
                            Połączenie SMTP nie potwierdza dostarczenia
                            wiadomości. Odbiór wymaga osobnego testu.
                        </p>
                        <p
                            style={{
                                ...textStyle,
                                color: 'var(--salon-muted)',
                            }}
                        >
                            Statusy SMS/push i historia incydentów: brak danych.
                            Widok pokazuje bieżące kontrole, odświeżane co 60
                            sekund.
                        </p>
                    </section>
                </>
            )}
        </div>
    );
}
