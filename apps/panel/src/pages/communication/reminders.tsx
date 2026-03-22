'use client';

import { useState } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import VersumBreadcrumbs from '@/components/salonbw/VersumBreadcrumbs';
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
            <SalonBWShell role={role}>
                <div className="salonbw-page">
                    <VersumBreadcrumbs
                        iconClass="sprite-breadcrumbs_communication"
                        items={[
                            { label: 'Łączność', href: '/communication' },
                            { label: 'Automatyczne przypomnienia' },
                        ]}
                    />
                    <div className="salonbw-page__toolbar">
                        <Link
                            href="/communication"
                            className="salonbw-btn salonbw-btn--light"
                        >
                            ← Powrót
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="salonbw-mass-communication">
                        <div className="salonbw-mass-communication__section">
                            <h3>Statystyki (ostatnie 7 dni)</h3>
                            <div className="salonbw-send-result__stats">
                                <div className="salonbw-stat">
                                    <span className="salonbw-stat__value">
                                        {stats?.total ?? '-'}
                                    </span>
                                    <span className="salonbw-stat__label">
                                        Wszystkich wizyt
                                    </span>
                                </div>
                                <div className="salonbw-stat salonbw-stat--success">
                                    <span className="salonbw-stat__value">
                                        {stats?.sent ?? '-'}
                                    </span>
                                    <span className="salonbw-stat__label">
                                        Wysłanych przypomnień
                                    </span>
                                </div>
                                <div className="salonbw-stat salonbw-stat--error">
                                    <span className="salonbw-stat__value">
                                        {stats?.failed ?? '-'}
                                    </span>
                                    <span className="salonbw-stat__label">
                                        Nieudanych
                                    </span>
                                </div>
                                <div className="salonbw-stat">
                                    <span className="salonbw-stat__value text-[#25B4C1]">
                                        {stats?.upcoming ?? '-'}
                                    </span>
                                    <span className="salonbw-stat__label">
                                        Nadchodzących (48h)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Manual trigger */}
                        <div className="salonbw-mass-communication__section">
                            <h3>Ręczne wyzwalanie</h3>
                            <p className="salonbw-muted">
                                Wyślij przypomnienia do wszystkich klientów z
                                wizytami w najbliższych godzinach.
                            </p>
                            <div className="salonbw-form-group">
                                <label htmlFor="hours-input">
                                    Zakres godzin
                                </label>
                                <div className="salonbw-actions">
                                    <input
                                        id="hours-input"
                                        type="number"
                                        className="salonbw-input"
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
                                        className="salonbw-btn salonbw-btn--primary"
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
                            <div className="salonbw-mass-communication__section">
                                <h3>Wyniki wysyłki ({results.length} wizyt)</h3>
                                {results.length === 0 ? (
                                    <p className="salonbw-muted">
                                        Brak wizyt w wybranym zakresie godzin.
                                    </p>
                                ) : (
                                    <div className="salonbw-table-wrap">
                                        <table className="salonbw-table">
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
                                                                <span className="salonbw-badge salonbw-badge--success">
                                                                    Wysłany
                                                                </span>
                                                            ) : (
                                                                <span className="salonbw-badge salonbw-badge--inactive">
                                                                    -
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {r.emailSent ? (
                                                                <span className="salonbw-badge salonbw-badge--success">
                                                                    Wysłany
                                                                </span>
                                                            ) : (
                                                                <span className="salonbw-badge salonbw-badge--inactive">
                                                                    -
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {r.error ? (
                                                                <span
                                                                    className="salonbw-badge salonbw-badge--error"
                                                                    title={
                                                                        r.error
                                                                    }
                                                                >
                                                                    Błąd
                                                                </span>
                                                            ) : r.smsSent ||
                                                              r.emailSent ? (
                                                                <span className="salonbw-badge salonbw-badge--success">
                                                                    OK
                                                                </span>
                                                            ) : (
                                                                <span className="salonbw-badge salonbw-badge--inactive">
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
                        <div className="salonbw-mass-communication__section">
                            <h3>Jak to działa?</h3>
                            <ul>
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
            </SalonBWShell>
        </RouteGuard>
    );
}
