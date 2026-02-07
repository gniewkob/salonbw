'use client';

import { useState } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import { useReminderStats, useSmsMutations } from '@/hooks/useSms';

export default function RemindersPage() {
    const { role } = useAuth();
    const { data: stats, refetch } = useReminderStats(7);
    const { triggerAutomaticReminders } = useSmsMutations();

    const [hours, setHours] = useState(24);
    const [results, setResults] = useState<
        Array<{
            appointmentId: number;
            clientName: string;
            smsSent: boolean;
            emailSent: boolean;
            error?: string;
        }>
    >([]);
    const [isTriggering, setIsTriggering] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const handleTrigger = async () => {
        setIsTriggering(true);
        setShowResults(false);
        try {
            const response = await triggerAutomaticReminders.mutateAsync(hours);
            setResults(response.results);
            setShowResults(true);
            void refetch();
        } catch (error) {
            console.error('Failed to trigger reminders:', error);
            alert('Wystąpił błąd podczas wyzwalania przypomnień');
        }
        setIsTriggering(false);
    };

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:communication">
            <VersumShell role={role}>
                <div className="versum-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">
                            Łączność / Automatyczne przypomnienia
                        </h1>
                        <Link
                            href="/communication"
                            className="versum-btn versum-btn--light"
                        >
                            ← Powrót
                        </Link>
                    </header>

                    {/* Stats */}
                    <div className="versum-mass-communication">
                        <div className="versum-mass-communication__section">
                            <h3>Statystyki (ostatnie 7 dni)</h3>
                            <div className="versum-send-result__stats">
                                <div className="versum-stat">
                                    <span className="versum-stat__value">
                                        {stats?.total ?? '-'}
                                    </span>
                                    <span className="versum-stat__label">
                                        Wszystkich wizyt
                                    </span>
                                </div>
                                <div className="versum-stat versum-stat--success">
                                    <span className="versum-stat__value">
                                        {stats?.sent ?? '-'}
                                    </span>
                                    <span className="versum-stat__label">
                                        Wysłanych przypomnień
                                    </span>
                                </div>
                                <div className="versum-stat versum-stat--error">
                                    <span className="versum-stat__value">
                                        {stats?.failed ?? '-'}
                                    </span>
                                    <span className="versum-stat__label">
                                        Nieudanych
                                    </span>
                                </div>
                                <div className="versum-stat">
                                    <span
                                        className="versum-stat__value"
                                        style={{ color: '#25B4C1' }}
                                    >
                                        {stats?.upcoming ?? '-'}
                                    </span>
                                    <span className="versum-stat__label">
                                        Nadchodzących (48h)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Manual trigger */}
                        <div className="versum-mass-communication__section">
                            <h3>Ręczne wyzwalanie</h3>
                            <p className="versum-muted mb-4">
                                Wyślij przypomnienia do wszystkich klientów z
                                wizytami w najbliższych godzinach.
                            </p>
                            <div className="versum-form-group">
                                <label>Zakres godzin</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        className="versum-input w-32"
                                        value={hours}
                                        onChange={(e) =>
                                            setHours(
                                                parseInt(e.target.value, 10) ||
                                                    1,
                                            )
                                        }
                                        min={1}
                                        max={168}
                                    />
                                    <span>godzin</span>
                                    <button
                                        type="button"
                                        className="versum-btn versum-btn--primary ml-4"
                                        onClick={() => void handleTrigger()}
                                        disabled={
                                            isTriggering ||
                                            triggerAutomaticReminders.isPending
                                        }
                                    >
                                        {isTriggering
                                            ? 'Wysyłanie...'
                                            : 'Wyślij przypomnienia'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Results */}
                        {showResults && (
                            <div className="versum-mass-communication__section">
                                <h3>Wyniki wysyłki ({results.length} wizyt)</h3>
                                {results.length === 0 ? (
                                    <p className="versum-muted">
                                        Brak wizyt w wybranym zakresie godzin.
                                    </p>
                                ) : (
                                    <div className="versum-table-wrap">
                                        <table className="versum-table">
                                            <thead>
                                                <tr>
                                                    <th>Klient</th>
                                                    <th>SMS</th>
                                                    <th>Email</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {results.map((r) => (
                                                    <tr key={r.appointmentId}>
                                                        <td>{r.clientName}</td>
                                                        <td>
                                                            {r.smsSent ? (
                                                                <span className="versum-badge versum-badge--success">
                                                                    Wysłany
                                                                </span>
                                                            ) : (
                                                                <span className="versum-badge versum-badge--inactive">
                                                                    -
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {r.emailSent ? (
                                                                <span className="versum-badge versum-badge--success">
                                                                    Wysłany
                                                                </span>
                                                            ) : (
                                                                <span className="versum-badge versum-badge--inactive">
                                                                    -
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {r.error ? (
                                                                <span
                                                                    className="versum-badge versum-badge--error"
                                                                    title={
                                                                        r.error
                                                                    }
                                                                >
                                                                    Błąd
                                                                </span>
                                                            ) : r.smsSent ||
                                                              r.emailSent ? (
                                                                <span className="versum-badge versum-badge--success">
                                                                    OK
                                                                </span>
                                                            ) : (
                                                                <span className="versum-badge versum-badge--inactive">
                                                                    Pominięty
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info */}
                        <div className="versum-mass-communication__section">
                            <h3>Jak to działa?</h3>
                            <ul className="list-disc pl-5 space-y-2 text-gray-700">
                                <li>
                                    System automatycznie wysyła przypomnienia{' '}
                                    <strong>24h przed wizytą</strong>
                                </li>
                                <li>
                                    Sprawdzanie odbywa się co godzinę (o pełnej
                                    godzinie)
                                </li>
                                <li>
                                    Wysyłane są tylko do wizyt ze statusem „
                                    <em>Zaplanowana</em>”
                                </li>
                                <li>
                                    Każde przypomnienie jest wysyłane tylko raz
                                    (oznaczane jako wysłane)
                                </li>
                                <li>
                                    Wymagany jest szablon typu „Przypomnienie o
                                    wizycie” ustawiony jako domyślny
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
