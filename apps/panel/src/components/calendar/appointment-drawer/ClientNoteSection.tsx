import { useEffect, useRef, useState } from 'react';
import type { Appointment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
    appointment: Appointment | null | undefined;
}

// Client booking comment, visible in the client's visit details. This is
// distinct from staff recommendations saved at finalization and from the
// staff-only "Notatka wewnętrzna" (appointment.internalNote).
export default function ClientNoteSection({ appointment }: Props) {
    const { apiFetch } = useAuth();
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setNote(appointment?.clientComment ?? '');
        setSaved(false);
        return () => {
            if (savedTimer.current) clearTimeout(savedTimer.current);
        };
    }, [appointment]);

    const handleSave = async () => {
        if (!appointment?.id) return;
        setSaving(true);
        try {
            await apiFetch(`/appointments/${appointment.id}/client-note`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientComment: note || null }),
            });
            if (savedTimer.current) clearTimeout(savedTimer.current);
            setSaved(true);
            savedTimer.current = setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    if (!appointment?.id) return null;

    return (
        <div className="rounded border p-2 mb-2">
            <label
                className="form-label form-label-sm mb-1"
                htmlFor="appointment-client-note"
            >
                Komentarz do rezerwacji
            </label>
            <textarea
                id="appointment-client-note"
                className="form-control form-control-sm"
                rows={2}
                maxLength={1000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Uwagi od klienta przy rezerwacji. Zalecenia po wizycie wpisz przy finalizacji."
            />
            <div className="d-flex align-items-center gap-2 mt-1">
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => void handleSave()}
                    disabled={saving}
                >
                    {saving ? 'Zapisywanie…' : 'Zapisz komentarz'}
                </button>
                {saved && <span className="small text-success">Zapisano</span>}
            </div>
        </div>
    );
}
