import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Employee, TimeBlock, TimeBlockType } from '@/types';
import { useCalendarMutations } from '@/hooks/useCalendar';
import { useToast } from '@/contexts/ToastContext';
import bookingStyles from '@/styles/V18BookingDrawer.module.css';
import timeBlockStyles from '@/styles/V18TimeBlockModal.module.css';

const BLOCK_TYPE_LABELS: Record<TimeBlockType, string> = {
    break: 'Przerwa',
    vacation: 'Urlop',
    training: 'Szkolenie',
    sick: 'Zwolnienie lekarskie',
    other: 'Inne',
};

interface TimeBlockModalProps {
    open: boolean;
    employees: Employee[];
    /** Studio V18 uses the shared booking modal design; legacy stays unchanged. */
    visualVariant?: 'legacy' | 'v18';
    /** Pre-fill when creating from a time selection */
    initialStartTime?: Date;
    initialEndTime?: Date;
    initialEmployeeId?: number;
    /** Pre-fill when editing an existing block */
    existingBlock?: TimeBlock | null;
    onClose: () => void;
    onSaved: () => void;
}

function toDatetimeLocal(date: Date): string {
    return format(date, "yyyy-MM-dd'T'HH:mm");
}

export default function TimeBlockModal({
    open,
    employees,
    visualVariant = 'legacy',
    initialStartTime,
    initialEndTime,
    initialEmployeeId,
    existingBlock,
    onClose,
    onSaved,
}: TimeBlockModalProps) {
    const toast = useToast();
    const { createTimeBlock, updateTimeBlock, deleteTimeBlock } =
        useCalendarMutations();

    const isEdit = !!existingBlock;
    const v18 = visualVariant === 'v18';
    const [employeeId, setEmployeeId] = useState(
        initialEmployeeId ?? (employees.length === 1 ? employees[0].id : 0),
    );
    const [startTime, setStartTime] = useState(
        toDatetimeLocal(initialStartTime ?? new Date()),
    );
    const [endTime, setEndTime] = useState(
        toDatetimeLocal(
            initialEndTime ??
                new Date((initialStartTime ?? new Date()).getTime() + 3600000),
        ),
    );
    const [blockType, setBlockType] = useState<TimeBlockType>('break');
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [allDay, setAllDay] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (!open) return;
        if (existingBlock) {
            setEmployeeId(existingBlock.employeeId);
            setStartTime(toDatetimeLocal(new Date(existingBlock.startTime)));
            setEndTime(toDatetimeLocal(new Date(existingBlock.endTime)));
            setBlockType(existingBlock.type);
            setTitle(existingBlock.title ?? '');
            setNotes(existingBlock.notes ?? '');
            setAllDay(existingBlock.allDay);
        } else {
            setEmployeeId(initialEmployeeId ?? (employees.length === 1 ? employees[0].id : 0));
            setStartTime(toDatetimeLocal(initialStartTime ?? new Date()));
            setEndTime(
                toDatetimeLocal(
                    initialEndTime ??
                        new Date(
                            (initialStartTime ?? new Date()).getTime() +
                                3600000,
                        ),
                ),
            );
            setBlockType('break');
            setTitle('');
            setNotes('');
            setAllDay(false);
        }
        setConfirmDelete(false);
    }, [
        open,
        existingBlock,
        initialStartTime,
        initialEndTime,
        initialEmployeeId,
        employees,
    ]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        if (!isEdit && employeeId <= 0) {
            toast.error('Wybierz pracownika dla blokady');
            return;
        }
        if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime())
        ) {
            toast.error('Podaj poprawny zakres dat');
            return;
        }
        if (endDate <= startDate) {
            toast.error('Koniec blokady musi być po jej początku');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                type: blockType,
                title: title.trim() || undefined,
                notes: notes.trim() || undefined,
                allDay,
            };
            if (isEdit && existingBlock) {
                await updateTimeBlock.mutateAsync({
                    id: existingBlock.id,
                    ...payload,
                });
                toast.success('Blokada zaktualizowana');
            } else {
                await createTimeBlock.mutateAsync({
                    employeeId,
                    ...payload,
                });
                toast.success('Blokada dodana');
            }
            onSaved();
            onClose();
        } catch {
            toast.error('Nie udało się zapisać blokady');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!existingBlock) return;
        setDeleting(true);
        try {
            await deleteTimeBlock.mutateAsync(existingBlock.id);
            toast.success('Blokada usunięta');
            onSaved();
            onClose();
        } catch {
            toast.error('Nie udało się usunąć blokady');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div
            className={`modal d-block${v18 ? ` ${timeBlockStyles.overlay}` : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={isEdit ? 'Edytuj blokadę' : 'Dodaj blokadę'}
            style={v18 ? undefined : { background: 'rgba(0,0,0,0.4)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className={`modal-dialog modal-dialog-centered${v18 ? ` ${timeBlockStyles.dialog}` : ''}`}>
                <div className={`modal-content${v18 ? ` ${bookingStyles.panel} ${timeBlockStyles.panel}` : ''}`}>
                    <div className={`modal-header${v18 ? ` ${bookingStyles.header} ${timeBlockStyles.header}` : ''}`}>
                        {v18 ? (
                            <div className={bookingStyles.headerText}>
                                <span className={bookingStyles.eyebrow}>
                                    Salon Black &amp; White · CRM V18
                                </span>
                                <h2 className={bookingStyles.heading}>
                                    {isEdit ? 'Edytuj blokadę' : 'Dodaj blokadę'}
                                </h2>
                                <span className={bookingStyles.headerHint}>
                                    Wybierz rodzaj blokady, pracownika i termin.
                                </span>
                            </div>
                        ) : (
                            <h5 className="modal-title">
                                {isEdit ? 'Edytuj blokadę' : 'Dodaj blokadę'}
                            </h5>
                        )}
                        <button
                            type="button"
                            className={`btn-close${v18 ? ` ${bookingStyles.close}` : ''}`}
                            aria-label="Zamknij"
                            onClick={onClose}
                        />
                    </div>

                    <form
                        className={v18 ? timeBlockStyles.form : undefined}
                        onSubmit={(e) => void handleSubmit(e)}
                    >
                        <div className={`modal-body${v18 ? ` ${bookingStyles.body} ${timeBlockStyles.body}` : ''}`}>
                            {v18 && (
                                <div className="rounded border p-2">
                                    <h3 className={timeBlockStyles.sectionTitle}>Blokada</h3>
                            )}

                            {!isEdit && (
                                <div className="mb-3">
                                    <label
                                        htmlFor="tb-employee"
                                        className="form-label"
                                    >
                                        Pracownik
                                    </label>
                                    <select
                                        id="tb-employee"
                                        className="form-select"
                                        value={employeeId}
                                        onChange={(e) =>
                                            setEmployeeId(
                                                Number(e.target.value),
                                            )
                                        }
                                        required
                                    >
                                        <option value={0} disabled>
                                            Wybierz pracownika
                                        </option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="mb-3">
                                <label htmlFor="tb-type" className="form-label">
                                    Rodzaj blokady
                                </label>
                                <select
                                    id="tb-type"
                                    className="form-select"
                                    value={blockType}
                                    onChange={(e) =>
                                        setBlockType(
                                            e.target.value as TimeBlockType,
                                        )
                                    }
                                >
                                    {(
                                        Object.entries(BLOCK_TYPE_LABELS) as [
                                            TimeBlockType,
                                            string,
                                        ][]
                                    ).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label
                                    htmlFor="tb-title"
                                    className="form-label"
                                >
                                    Tytuł (opcjonalnie)
                                </label>
                                <input
                                    id="tb-title"
                                    type="text"
                                    className="form-control"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={BLOCK_TYPE_LABELS[blockType]}
                                />
                            </div>

                            <div className="mb-3 form-check">
                                <input
                                    id="tb-allday"
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={allDay}
                                    onChange={(e) =>
                                        setAllDay(e.target.checked)
                                    }
                                />
                                <label
                                    htmlFor="tb-allday"
                                    className="form-check-label"
                                >
                                    Cały dzień
                                </label>
                            </div>

                            {!allDay && (
                                <>
                                    <div className="mb-3">
                                        <label
                                            htmlFor="tb-start"
                                            className="form-label"
                                        >
                                            Od
                                        </label>
                                        <input
                                            id="tb-start"
                                            type="datetime-local"
                                            className="form-control"
                                            value={startTime}
                                            onChange={(e) =>
                                                setStartTime(e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label
                                            htmlFor="tb-end"
                                            className="form-label"
                                        >
                                            Do
                                        </label>
                                        <input
                                            id="tb-end"
                                            type="datetime-local"
                                            className="form-control"
                                            value={endTime}
                                            onChange={(e) =>
                                                setEndTime(e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {allDay && (
                                <div className="mb-3">
                                    <label
                                        htmlFor="tb-date"
                                        className="form-label"
                                    >
                                        Data
                                    </label>
                                    <input
                                        id="tb-date"
                                        type="date"
                                        className="form-control"
                                        value={startTime.slice(0, 10)}
                                        onChange={(e) => {
                                            const d = e.target.value;
                                            setStartTime(`${d}T00:00`);
                                            setEndTime(`${d}T23:59`);
                                        }}
                                        required
                                    />
                                </div>
                            )}

                            <div className="mb-3">
                                <label
                                    htmlFor="tb-notes"
                                    className="form-label"
                                >
                                    Uwagi (opcjonalnie)
                                </label>
                                <textarea
                                    id="tb-notes"
                                    className="form-control"
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                            {v18 && </div>}
                        </div>

                        <div className={`modal-footer d-flex justify-content-between${v18 ? ` ${timeBlockStyles.footer}` : ''}`}>
                            {isEdit ? (
                                confirmDelete ? (
                                    <div className="d-flex gap-2 align-items-center">
                                        <span className="text-danger small">
                                            Usunąć?
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-danger"
                                            disabled={deleting}
                                            onClick={() => void handleDelete()}
                                        >
                                            {deleting
                                                ? 'Usuwanie...'
                                                : 'Tak, usuń'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() =>
                                                setConfirmDelete(false)
                                            }
                                        >
                                            Anuluj
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => setConfirmDelete(true)}
                                    >
                                        Usuń blokadę
                                    </button>
                                )
                            ) : (
                                <span />
                            )}
                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={onClose}
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Zapisywanie...'
                                        : isEdit
                                          ? 'Zapisz zmiany'
                                          : 'Dodaj blokadę'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
