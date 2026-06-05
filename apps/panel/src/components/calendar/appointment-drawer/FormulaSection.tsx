import { useEffect, useRef, useState } from 'react';
import type { Appointment, Formula } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface UsageHistoryEntry {
    id: number;
    usedAt: string;
    appointmentId: number | null;
    items: { productName: string; quantity: number; unit: string }[];
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
        setNoteSaved(false);

        const clientId = appointment.client?.id;
        if (clientId) {
            apiFetch<Formula[]>(`/customers/${clientId}/formulas`)
                .then((data) => {
                    if (!alive) return;
                    setFormulas(data.slice(0, 5));
                    setFormulasLoaded(true);
                })
                .catch(() => { if (alive) setFormulasLoaded(true); });

            apiFetch<UsageHistoryEntry[]>(`/customers/${clientId}/usage-history`)
                .then((data) => {
                    if (!alive) return;
                    setUsageHistory(data.slice(0, 5));
                    setHistoryLoaded(true);
                })
                .catch(() => { if (alive) setHistoryLoaded(true); });
        }

        return () => { alive = false; };
    }, [appointment, apiFetch]);

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
            noteSavedTimer.current = setTimeout(() => setNoteSaved(false), 2000);
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
                body: JSON.stringify({ description: formulaText.trim(), date: new Date().toISOString() }),
            });
            setFormulaText('');
            if (appointment.client?.id) {
                const data = await apiFetch<Formula[]>(`/customers/${appointment.client.id}/formulas`);
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
            {/* Client history: previous formulas + material usage */}
            {(formulasLoaded || historyLoaded) && (formulas.length > 0 || usageHistory.length > 0) && (
                <div className="rounded border p-2">
                    <strong className="d-block mb-2">Historia klienta</strong>

                    {formulas.length > 0 && (
                        <div className="mb-3">
                            <div className="small fw-medium text-muted mb-1">Poprzednie receptury</div>
                            <div className="d-flex flex-column gap-1">
                                {formulas.map((f) => (
                                    <div key={f.id} className="small bg-light rounded px-2 py-1">
                                        <div className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                                            {new Date(f.date).toLocaleDateString('pl-PL')}
                                        </div>
                                        <div>{f.description}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {usageHistory.length > 0 && (
                        <div>
                            <div className="small fw-medium text-muted mb-1">Użyte materiały (poprzednie wizyty)</div>
                            <div className="d-flex flex-column gap-1">
                                {usageHistory.map((entry) => (
                                    <div key={entry.id} className="small bg-light rounded px-2 py-1">
                                        <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>
                                            {new Date(entry.usedAt).toLocaleDateString('pl-PL')}
                                        </div>
                                        {entry.items.map((item, i) => (
                                            <div key={i} className="d-flex justify-content-between">
                                                <span>{item.productName}</span>
                                                <span className="text-muted">{item.quantity} {item.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Formula entry + internal note */}
            <div className="rounded border p-2">
                <strong className="d-block mb-2">Formularz zabiegu</strong>

                <div className="mb-2">
                    <label className="form-label form-label-sm mb-1" htmlFor="appointment-internal-note">
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
                        {noteSaved && <span className="small text-success">Zapisano</span>}
                    </div>
                </div>

                <div className="mb-2">
                    <label className="form-label form-label-sm mb-1" htmlFor="appointment-formula">
                        Receptura / formularz zabiegu
                    </label>
                    <textarea
                        id="appointment-formula"
                        className="form-control form-control-sm"
                        rows={3}
                        value={formulaText}
                        onChange={(e) => setFormulaText(e.target.value)}
                        placeholder="Np. kolor: 7.1 + 8 vol, 40 min..."
                    />
                    {formulaError && <div className="small text-danger mt-1">{formulaError}</div>}
                    <button
                        type="button"
                        className="btn btn-outline-primary btn-sm mt-1"
                        onClick={() => void handleSaveFormula()}
                        disabled={formulaSaving || !formulaText.trim()}
                    >
                        {formulaSaving ? 'Zapisywanie…' : 'Zapisz formularz'}
                    </button>
                </div>
            </div>
        </>
    );
}
