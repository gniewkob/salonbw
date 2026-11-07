import { useState } from 'react';
import V18Select from '@/components/ui/V18Select';
import ConfirmModal from '@/components/ConfirmModal';
import {
    useCreateCustomerNote,
    useCustomerNotes,
    useDeleteCustomerNote,
    useUpdateCustomerNote,
} from '@/hooks/useCustomers';
import { useToast } from '@/contexts/ToastContext';
import type { CustomerNote, NoteType } from '@/types';

interface Props {
    customerId: number;
    variant?: 'legacy' | 'v18';
}

function formatDate(value: string) {
    return new Date(value).toLocaleString('pl-PL');
}

function noteTypeLabel(type: NoteType) {
    switch (type) {
        case 'warning':
            return 'Ostrzeżenie';
        case 'medical':
            return 'Medyczna';
        case 'preference':
            return 'Preferencja';
        case 'payment':
            return 'Płatność';
        default:
            return 'Ogólna';
    }
}

export default function CustomerNotesTab({
    customerId,
    variant = 'legacy',
}: Props) {
    const { data: notes = [], isLoading, error } = useCustomerNotes(customerId);
    const create = useCreateCustomerNote();
    const update = useUpdateCustomerNote();
    const remove = useDeleteCustomerNote();
    const toast = useToast();
    const [content, setContent] = useState('');
    const [noteType, setNoteType] = useState<NoteType>('general');
    const [pinInAlerts, setPinInAlerts] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [editNoteId, setEditNoteId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editError, setEditError] = useState<string | null>(null);
    const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);

    const saveEditedNote = async () => {
        if (editNoteId === null || !editContent.trim() || update.isPending) return;
        setEditError(null);
        try {
            await update.mutateAsync({
                noteId: editNoteId,
                customerId,
                data: { content: editContent.trim() },
            });
            setEditNoteId(null);
            setEditContent('');
        } catch (cause) {
            setEditError(
                cause instanceof Error ? cause.message : 'Nie udało się zapisać notatki.',
            );
        }
    };

    const startEdit = (note: CustomerNote) => {
        setEditNoteId(note.id);
        setEditContent(note.content);
        setEditError(null);
    };

    const requestDelete = (noteId: number) => {
        if (variant === 'v18') setDeleteNoteId(noteId);
        else remove.mutate({ noteId, customerId });
    };

    const handleAdd = async () => {
        if (!content.trim()) return;
        setSubmitError(null);
        try {
            await create.mutateAsync({
                customerId,
                content: content.trim(),
                type: noteType,
                isPinned: pinInAlerts,
            });
            setContent('');
            setNoteType('general');
            setPinInAlerts(false);
            toast.success('Dodano komentarz');
        } catch (e) {
            const message =
                e instanceof Error
                    ? e.message
                    : 'Nie udało się dodać komentarza';
            setSubmitError(message);
            toast.error('Nie udało się dodać komentarza');
        }
    };

    if (isLoading) {
        return <div className="customer-loading">Ładowanie komentarzy...</div>;
    }

    if (error) {
        return (
            <div className="customer-error">
                <p>Nie udało się załadować komentarzy</p>
            </div>
        );
    }

    const pinned = notes.filter((note) => note.isPinned);
    const regular = notes.filter((note) => !note.isPinned);

    return (
        <div className="customer-comments-tab">
            <div className="customer-comments-add">
                <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Dodaj komentarz klienta..."
                    aria-label="Treść notatki"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="row g-2 mt-2">
                    <div className="col-sm-6">
                        <label className="form-label mb-1" htmlFor="noteType">
                            Typ notatki
                        </label>
                        {variant === 'v18' ? (
                            <V18Select
                                id="noteType"
                                ariaLabel="Typ notatki"
                                value={noteType}
                                onChange={(value) => setNoteType(value as NoteType)}
                                options={[
                                    { value: 'general', label: 'Ogólna' },
                                    { value: 'warning', label: 'Ostrzeżenie' },
                                    { value: 'medical', label: 'Medyczna' },
                                    { value: 'preference', label: 'Preferencja' },
                                    { value: 'payment', label: 'Płatność' },
                                ]}
                            />
                        ) : (
                            <select
                                id="noteType"
                                className="form-control"
                                value={noteType}
                                onChange={(e) =>
                                    setNoteType(e.target.value as NoteType)
                                }
                            >
                                <option value="general">Ogólna</option>
                                <option value="warning">Ostrzeżenie</option>
                                <option value="medical">Medyczna</option>
                                <option value="preference">Preferencja</option>
                                <option value="payment">Płatność</option>
                            </select>
                        )}
                    </div>
                    <div className="col-sm-6 d-flex align-items-end">
                        <label className="d-flex align-items-center gap-2 mb-0">
                            <input
                                type="checkbox"
                                checked={pinInAlerts}
                                onChange={(e) =>
                                    setPinInAlerts(e.target.checked)
                                }
                            />
                            <span>Pokaż w alertach recepcji</span>
                        </label>
                    </div>
                </div>
                <div className="customer-comments-actions">
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => void handleAdd()}
                        disabled={!content.trim() || create.isPending}
                    >
                        dodaj komentarz
                    </button>
                </div>
                {submitError ? (
                    <div className="customer-inline-error">{submitError}</div>
                ) : null}
            </div>

            {variant === 'v18' && editNoteId !== null ? (
                <section aria-label="Edycja notatki" className="customer-comments-add">
                    <label htmlFor="v18-note-edit">Edytuj treść notatki</label>
                    <textarea
                        id="v18-note-edit"
                        className="form-control"
                        rows={3}
                        value={editContent}
                        onChange={(event) => setEditContent(event.target.value)}
                    />
                    {editError ? <p role="alert">{editError}</p> : null}
                    <div className="customer-comments-actions">
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={!editContent.trim() || update.isPending}
                            onClick={() => void saveEditedNote()}
                        >
                            Zapisz notatkę
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setEditNoteId(null)}
                        >
                            Anuluj
                        </button>
                    </div>
                </section>
            ) : null}
            <div className="customer-comments-list">
                {pinned.map((note) => (
                    <NoteRow
                        key={note.id}
                        note={note}
                        onTogglePin={() => {
                            update.mutate({
                                noteId: note.id,
                                customerId,
                                data: { isPinned: false },
                            });
                        }}
                        onEdit={variant === 'v18' ? () => startEdit(note) : undefined}
                        onDelete={() => requestDelete(note.id)}
                    />
                ))}
                {regular.map((note) => (
                    <NoteRow
                        key={note.id}
                        note={note}
                        onTogglePin={() => {
                            update.mutate({
                                noteId: note.id,
                                customerId,
                                data: { isPinned: true },
                            });
                        }}
                        onEdit={variant === 'v18' ? () => startEdit(note) : undefined}
                        onDelete={() => requestDelete(note.id)}
                    />
                ))}
                {notes.length === 0 && (
                    <div className="customer-empty-state">Brak komentarzy.</div>
                )}
            </div>
            {variant === 'v18' ? (
                <ConfirmModal
                    open={deleteNoteId !== null}
                    title="Usuń notatkę"
                    message="Czy na pewno chcesz usunąć tę notatkę? Operacji nie można cofnąć."
                    confirmLabel="Usuń"
                    confirmVariant="danger"
                    onConfirm={() => {
                        if (deleteNoteId === null) return;
                        remove.mutate({ noteId: deleteNoteId, customerId });
                        setDeleteNoteId(null);
                    }}
                    onCancel={() => setDeleteNoteId(null)}
                />
            ) : null}
        </div>
    );
}

function NoteRow({
    note,
    onTogglePin,
    onEdit,
    onDelete,
}: {
    note: CustomerNote;
    onTogglePin: () => void;
    onEdit?: () => void;
    onDelete: () => void;
}) {
    const noteType = noteTypeLabel(note.type);

    return (
        <div className="customer-comment-row">
            <div className="customer-comment-meta">
                <span>{formatDate(note.createdAt)}</span>
                {note.createdBy?.name ? (
                    <span> · {note.createdBy.name}</span>
                ) : null}
                <span className="label label-default">{noteType}</span>
                {note.isPinned ? (
                    <span className="label label-default customer-comment-pin">
                        przypięty
                    </span>
                ) : null}
            </div>
            <div className="customer-comment-body">{note.content}</div>
            <div className="customer-comment-controls">
                {onEdit ? (
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={onEdit}
                    >
                        edytuj
                    </button>
                ) : null}
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => void onTogglePin()}
                >
                    {note.isPinned ? 'ukryj z alertów' : 'pokaż w alertach'}
                </button>
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => void onDelete()}
                >
                    usuń
                </button>
            </div>
        </div>
    );
}
