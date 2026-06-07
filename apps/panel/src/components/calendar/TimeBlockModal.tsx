import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Employee, TimeBlock, TimeBlockType } from '@/types';
import { useCalendarMutations } from '@/hooks/useCalendar';
import { useToast } from '@/contexts/ToastContext';

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

function fromDatetimeLocal(value: string): string {
    return new Date(value).toISOString();
}

export default function TimeBlockModal({
    open,
    employees,
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
    const [employeeId, setEmployeeId] = useState(
        initialEmployeeId ?? employees[0]?.id ?? 0,
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
            setEmployeeId(initialEmployeeId ?? employees[0]?.id ?? 0);
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
        setSaving(true);
        try {
            const payload = {
                startTime: fromDatetimeLocal(startTime),
                endTime: fromDatetimeLocal(endTime),
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
            className="modal d-block"
            role="dialog"
            aria-modal="true"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            {isEdit ? 'Edytuj blokadę' : 'Dodaj blokadę'}
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Zamknij"
                            onClick={onClose}
                        />
                    </div>

                    <form onSubmit={(e) => void handleSubmit(e)}>
                        <div className="modal-body">
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
                        </div>

                        <div className="modal-footer d-flex justify-content-between">
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
