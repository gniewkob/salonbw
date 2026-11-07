import { useEffect, useId, useRef, useState } from 'react';
import {
    STAFF_SOURCE_LABELS,
    StaffGrantSource,
} from '@/api/communicationConsents';

export interface StaffEvidence {
    source: StaffGrantSource;
    evidenceReference: string;
    consentGivenAt?: string;
}

export interface ConsentConfirmationRequest {
    title: string;
    /** Human-readable summary lines of the requested change. */
    summary: string[];
    /** Consent statement shown for grants (exact versioned wording). */
    statement?: { text: string; version: string; draft: boolean };
    /**
     * Staff recording a grant must capture real evidence. Withdrawals and
     * preference changes never ask for evidence or justification.
     */
    requireStaffEvidence?: boolean;
    staffSources?: StaffGrantSource[];
    confirmLabel?: string;
    destructive?: boolean;
}

interface Props {
    request: ConsentConfirmationRequest | null;
    pending?: boolean;
    onConfirm: (evidence?: StaffEvidence) => void;
    onCancel: () => void;
}

/**
 * Explicit confirmation step for every consent/preference change. The
 * backend still validates and audits; this dialog only prevents accidental
 * changes and collects staff evidence for grants.
 */
export default function CustomerConsentConfirmation({
    request,
    pending = false,
    onConfirm,
    onCancel,
}: Props) {
    const titleId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<Element | null>(null);
    const sources = request?.staffSources ?? [];
    const [source, setSource] = useState<StaffGrantSource | ''>('');
    const [evidence, setEvidence] = useState('');
    const [givenAt, setGivenAt] = useState('');
    const open = request !== null;

    useEffect(() => {
        if (open) {
            triggerRef.current = document.activeElement;
            setSource('');
            setEvidence('');
            setGivenAt('');
            requestAnimationFrame(() => {
                dialogRef.current
                    ?.querySelector<HTMLElement>(
                        'select, input, button[data-cancel]',
                    )
                    ?.focus();
            });
        } else {
            (triggerRef.current as HTMLElement | null)?.focus?.();
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !pending) {
                onCancel();
                return;
            }
            if (e.key !== 'Tab' || !dialogRef.current) return;
            const focusable = Array.from(
                dialogRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), input:not([disabled]), select:not([disabled])',
                ),
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, pending, onCancel]);

    if (!request) return null;

    const evidenceValid =
        !request.requireStaffEvidence ||
        (source !== '' && evidence.trim().length >= 3);
    const today = new Date().toISOString().slice(0, 10);

    return (
        <div
            className="position-fixed top-0 start-0 bottom-0 end-0 d-flex align-items-center justify-content-center p-3"
            style={{ zIndex: 2100, background: 'rgba(0,0,0,0.55)' }}
            onClick={() => !pending && onCancel()}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="bg-white rounded-4 overflow-hidden"
                style={{ maxWidth: 520, width: '100%' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="consent-confirmation"
            >
                <form
                    className="px-4 pt-4 pb-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!evidenceValid || pending) return;
                        onConfirm(
                            request.requireStaffEvidence && source
                                ? {
                                      source,
                                      evidenceReference: evidence.trim(),
                                      consentGivenAt: givenAt
                                          ? new Date(givenAt).toISOString()
                                          : undefined,
                                  }
                                : undefined,
                        );
                    }}
                >
                    <h2 id={titleId} className="h6 fw-semibold mb-2">
                        {request.title}
                    </h2>
                    <ul className="small mb-3 ps-3">
                        {request.summary.map((line) => (
                            <li key={line}>{line}</li>
                        ))}
                    </ul>
                    {request.statement && (
                        <blockquote className="small border-start ps-3 mb-3">
                            <p className="mb-1">{request.statement.text}</p>
                            <footer className="text-muted">
                                Wersja treści: {request.statement.version}
                                {request.statement.draft &&
                                    ' (projekt — wymaga akceptacji właściciela)'}
                            </footer>
                        </blockquote>
                    )}
                    {request.requireStaffEvidence && (
                        <fieldset className="mb-3">
                            <legend className="small fw-semibold">
                                Dowód zgody klienta
                            </legend>
                            <label className="small d-block mb-2">
                                Źródło
                                <select
                                    className="form-select form-select-sm"
                                    value={source}
                                    required
                                    onChange={(e) =>
                                        setSource(
                                            e.target.value as StaffGrantSource,
                                        )
                                    }
                                >
                                    <option value="">Wybierz…</option>
                                    {sources.map((s) => (
                                        <option key={s} value={s}>
                                            {STAFF_SOURCE_LABELS[s]}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="small d-block mb-2">
                                Odniesienie do dowodu (np. numer formularza)
                                <input
                                    className="form-control form-control-sm"
                                    value={evidence}
                                    minLength={3}
                                    maxLength={500}
                                    required
                                    onChange={(e) =>
                                        setEvidence(e.target.value)
                                    }
                                />
                            </label>
                            <label className="small d-block">
                                Data udzielenia zgody (opcjonalnie)
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={givenAt}
                                    max={today}
                                    onChange={(e) => setGivenAt(e.target.value)}
                                />
                            </label>
                        </fieldset>
                    )}
                    <div className="d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            data-cancel
                            className="btn btn-outline-secondary btn-sm"
                            onClick={onCancel}
                            disabled={pending}
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            className={`btn btn-sm ${
                                request.destructive ? 'btn-danger' : 'btn-dark'
                            }`}
                            disabled={!evidenceValid || pending}
                            aria-busy={pending}
                        >
                            {pending
                                ? 'Zapisywanie…'
                                : (request.confirmLabel ?? 'Potwierdź')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
