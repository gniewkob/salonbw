import { useEffect, useMemo, useRef, useState } from 'react';
import type { Appointment, Formula } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface UsageHistoryEntry {
    id: number;
    usedAt: string;
    appointmentId: number | null;
    items: { productName: string; quantity: number; unit: string }[];
}

interface PreparationVisit {
    id: number;
    date: string;
    service: { id: number; name: string } | null;
    durationMinutes?: number | null;
    formula?: string | null;
}

interface Props {
    appointment: Appointment | null | undefined;
}

export default function FormulaSection({ appointment }: Props) {
    const { apiFetch } = useAuth();
    const [internalNote, setInternalNote] = useState('');
    const [noteSaving, setNoteSaving] = useState(false);
    const [noteSaved, setNoteSaved] = useState(false);
    const noteSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [formulaText, setFormulaText] = useState('');
    const [formulaSaving, setFormulaSaving] = useState(false);
    const [formulaError, setFormulaError] = useState<string | null>(null);
    const [formulas, setFormulas] = useState<Formula[]>([]);
    const [formulasLoaded, setFormulasLoaded] = useState(false);

    const [usageHistory, setUsageHistory] = useState<UsageHistoryEntry[]>([]);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [preparationVisits, setPreparationVisits] = useState<
        PreparationVisit[]
    >([]);
    const [visitsLoaded, setVisitsLoaded] = useState(false);

    useEffect(() => {
        if (!appointment) return;
        let alive = true;

        setInternalNote(appointment.internalNote ?? '');
        setFormulaText('');
        setFormulaError(null);
        setFormulas([]);
        setFormulasLoaded(false);
        setUsageHistory([]);
        setHistoryLoaded(false);
        setPreparationVisits([]);
        setVisitsLoaded(false);
        setNoteSaved(false);

        const clientId = appointment.client?.id;
        if (clientId) {
            apiFetch<Formula[]>(`/customers/${clientId}/formulas`)
                .then((data) => {
                    if (!alive) return;
                    setFormulas(data.slice(0, 5));
                    setFormulasLoaded(true);
                })
                .catch(() => {
                    if (alive) setFormulasLoaded(true);
                });

            apiFetch<UsageHistoryEntry[]>(
                `/customers/${clientId}/usage-history`,
            )
                .then((data) => {
                    if (!alive) return;
                    // One visit can create more than one usage entry.
                    // Keep the API's bounded result so all entries can be
                    // grouped under their appointment below.
                    setUsageHistory(data);
                    setHistoryLoaded(true);
                })
                .catch(() => {
                    if (alive) setHistoryLoaded(true);
                });

            apiFetch<{ items: PreparationVisit[] }>(
                `/customers/${clientId}/events-history?limit=5&status=completed`,
            )
                .then((data) => {
                    if (!alive) return;
                    setPreparationVisits((data.items ?? []).slice(0, 5));
                    setVisitsLoaded(true);
                })
                .catch(() => {
                    if (alive) setVisitsLoaded(true);
                });
        }

        return () => {
            alive = false;
        };
    }, [appointment, apiFetch]);

    const formulaByAppointmentId = useMemo(
        () =>
            new Map(
                formulas
                    .filter((formula) => formula.appointment?.id)
                    .map((formula) => [
                        formula.appointment!.id,
                        formula.description,
                    ]),
            ),
        [formulas],
    );
    const usageByAppointmentId = useMemo(() => {
        const byAppointment = new Map<number, UsageHistoryEntry['items']>();

        for (const entry of usageHistory) {
            if (!entry.appointmentId) continue;
            byAppointment.set(entry.appointmentId, [
                ...(byAppointment.get(entry.appointmentId) ?? []),
                ...entry.items,
            ]);
        }

        return byAppointment;
    }, [usageHistory]);
    const displayedVisitIds = useMemo(
        () => new Set(preparationVisits.map((visit) => visit.id)),
        [preparationVisits],
    );
    const otherFormulas = useMemo(
        () =>
            formulas.filter(
                (formula) =>
                    !formula.appointment?.id ||
                    !displayedVisitIds.has(formula.appointment.id),
            ),
        [displayedVisitIds, formulas],
    );
    const canEditFormula =
        appointment?.status === 'confirmed' ||
        appointment?.status === 'in_progress' ||
        appointment?.status === 'completed';

    const handleSaveNote = async () => {
        if (!appointment?.id) return;
        setNoteSaving(true);
        try {
            await apiFetch(`/appointments/${appointment.id}/notes`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ internalNote: internalNote || null }),
            });
            if (noteSavedTimer.current) clearTimeout(noteSavedTimer.current);
            setNoteSaved(true);
            noteSavedTimer.current = setTimeout(
                () => setNoteSaved(false),
                2000,
            );
        } finally {
            setNoteSaving(false);
        }
    };

    const handleSaveFormula = async () => {
        if (!appointment?.id || !formulaText.trim()) return;
        setFormulaSaving(true);
        setFormulaError(null);
        try {
            await apiFetch(`/appointments/${appointment.id}/formulas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: formulaText.trim(),
                    date: new Date().toISOString(),
                }),
            });
            setFormulaText('');
            if (appointment.client?.id) {
                const data = await apiFetch<Formula[]>(
                    `/customers/${appointment.client.id}/formulas`,
                );
                setFormulas(data.slice(0, 3));
            }
        } catch {
            setFormulaError('Nie udało się zapisać formularza.');
        } finally {
            setFormulaSaving(false);
        }
    };

    return (
        <>
            {/* Decision support before confirming or starting the visit. */}
            {formulasLoaded && historyLoaded && visitsLoaded && (
                <div className="rounded border p-2">
                    <strong className="d-block mb-1">
                        Przygotowanie do wizyty
                    </strong>
                    <p className="small text-muted mb-2">
                        Ostatnie zabiegi: czas w kalendarzu, receptura,
                        proporcje i zużyte materiały.
                    </p>

                    {preparationVisits.length === 0 &&
                    otherFormulas.length === 0 ? (
                        <div className="small text-muted">
                            Brak zapisanej historii przygotowania.
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-2">
                            {preparationVisits.map((visit) => {
                                const formula =
                                    visit.formula ??
                                    formulaByAppointmentId.get(visit.id);
                                const materials =
                                    usageByAppointmentId.get(visit.id) ?? [];
                                return (
                                    <div
                                        key={visit.id}
                                        className="small bg-light rounded p-2"
                                    >
                                        <div className="d-flex flex-wrap justify-content-between gap-1 mb-1">
                                            <strong>
                                                {visit.service?.name ??
                                                    'Usługa usunięta'}
                                            </strong>
                                            <span className="text-muted">
                                                {new Date(
                                                    visit.date,
                                                ).toLocaleDateString('pl-PL')}
                                            </span>
                                        </div>
                                        {visit.durationMinutes != null && (
                                            <div className="text-muted mb-1">
                                                Czas w kalendarzu:{' '}
                                                {visit.durationMinutes} min
                                            </div>
                                        )}
                                        <div className="mb-1">
                                            <span className="fw-medium">
                                                Receptura i proporcje:{' '}
                                            </span>
                                            {formula ?? 'brak zapisu'}
                                        </div>
                                        <div className="fw-medium">
                                            Zużyte materiały:
                                        </div>
                                        {materials.length > 0 ? (
                                            materials.map((item, index) => (
                                                <div
                                                    key={`${item.productName}-${index}`}
                                                    className="d-flex justify-content-between gap-2"
                                                >
                                                    <span>
                                                        {item.productName}
                                                    </span>
                                                    <span className="text-muted text-nowrap">
                                                        {item.quantity}{' '}
                                                        {item.unit}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-muted">
                                                brak zapisu
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {otherFormulas.length > 0 && (
                                <div className="small">
                                    <div className="fw-medium text-muted mb-1">
                                        Pozostałe zapisane receptury
                                    </div>
                                    {otherFormulas.map((formula) => (
                                        <div
                                            key={formula.id}
                                            className="bg-light rounded p-2 mb-1"
                                        >
                                            <span className="text-muted">
                                                {new Date(
                                                    formula.date,
                                                ).toLocaleDateString('pl-PL')}
                                                :{' '}
                                            </span>
                                            {formula.description}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Formula entry + internal note */}
            <div className="rounded border p-2">
                <strong className="d-block mb-2">
                    {canEditFormula
                        ? 'Formularz zabiegu'
                        : 'Notatka do przygotowania'}
                </strong>

                <div className="mb-2">
                    <label
                        className="form-label form-label-sm mb-1"
                        htmlFor="appointment-internal-note"
                    >
                        Notatka wewnętrzna
                    </label>
                    <textarea
                        id="appointment-internal-note"
                        className="form-control form-control-sm"
                        rows={2}
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        placeholder="Uwagi widoczne tylko dla personelu..."
                    />
                    <div className="d-flex align-items-center gap-2 mt-1">
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => void handleSaveNote()}
                            disabled={noteSaving}
                        >
                            {noteSaving ? 'Zapisywanie…' : 'Zapisz notatkę'}
                        </button>
                        {noteSaved && (
                            <span className="small text-success">Zapisano</span>
                        )}
                    </div>
                </div>

                {canEditFormula && (
                    <div className="mb-2">
                        <label
                            className="form-label form-label-sm mb-1"
                            htmlFor="appointment-formula"
                        >
                            Receptura i proporcje tego zabiegu
                        </label>
                        <textarea
                            id="appointment-formula"
                            className="form-control form-control-sm"
                            rows={3}
                            value={formulaText}
                            onChange={(e) => setFormulaText(e.target.value)}
                            placeholder="Np. 7.1 40 g + oksydant 6% 60 g (1:1,5), 40 min"
                        />
                        <div className="small text-muted mt-1">
                            Zapisz odcienie, gramaturę, proporcję i czas
                            działania.
                        </div>
                        {formulaError && (
                            <div className="small text-danger mt-1">
                                {formulaError}
                            </div>
                        )}
                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm mt-1"
                            onClick={() => void handleSaveFormula()}
                            disabled={formulaSaving || !formulaText.trim()}
                        >
                            {formulaSaving
                                ? 'Zapisywanie…'
                                : 'Zapisz recepturę'}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
