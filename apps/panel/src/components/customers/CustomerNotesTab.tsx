'use client';

import { useState } from 'react';
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

export default function CustomerNotesTab({ customerId }: Props) {
    const { data: notes = [], isLoading, error } = useCustomerNotes(customerId);
    const create = useCreateCustomerNote();
    const update = useUpdateCustomerNote();
    const remove = useDeleteCustomerNote();
    const toast = useToast();
    const [content, setContent] = useState('');
    const [noteType, setNoteType] = useState<NoteType>('general');
    const [pinInAlerts, setPinInAlerts] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

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
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="row g-2 mt-2">
                    <div className="col-sm-6">
                        <label className="form-label mb-1" htmlFor="noteType">
                            Typ notatki
                        </label>
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

            <div className="customer-comments-list">
                {pinned.map((note) => (
                    <NoteRow
                        key={note.id}
                        note={note}
                        onTogglePin={async () => {
                            await update.mutateAsync({
                                noteId: note.id,
                                customerId,
                                data: { isPinned: false },
                            });
                        }}
                        onDelete={async () => {
                            await remove.mutateAsync({
                                noteId: note.id,
                                customerId,
                            });
                        }}
                    />
                ))}
                {regular.map((note) => (
                    <NoteRow
                        key={note.id}
                        note={note}
                        onTogglePin={async () => {
                            await update.mutateAsync({
                                noteId: note.id,
                                customerId,
                                data: { isPinned: true },
                            });
                        }}
                        onDelete={async () => {
                            await remove.mutateAsync({
                                noteId: note.id,
                                customerId,
                            });
                        }}
                    />
                ))}
                {notes.length === 0 && (
                    <div className="customer-empty-state">Brak komentarzy.</div>
                )}
            </div>
        </div>
    );
}

function NoteRow({
    note,
    onTogglePin,
    onDelete,
}: {
    note: CustomerNote;
    onTogglePin: () => Promise<void>;
    onDelete: () => Promise<void>;
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
