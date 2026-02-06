'use client';

import { useState } from 'react';
import {
    useCustomerNotes,
    useCreateCustomerNote,
    useUpdateCustomerNote,
    useDeleteCustomerNote,
} from '@/hooks/useCustomers';
import { CustomerNote, NoteType } from '@/types';

interface Props {
    customerId: number;
}

const noteTypeConfig: Record<
    NoteType,
    { label: string; color: string; icon: string }
> = {
    general: {
        label: 'Ogólna',
        color: 'bg-gray-100 text-gray-700',
        icon: '📝',
    },
    warning: {
        label: 'Ostrzeżenie',
        color: 'bg-red-100 text-red-700',
        icon: '⚠️',
    },
    preference: {
        label: 'Preferencja',
        color: 'bg-blue-100 text-blue-700',
        icon: '⭐',
    },
    medical: {
        label: 'Medyczna',
        color: 'bg-purple-100 text-purple-700',
        icon: '🏥',
    },
    payment: {
        label: 'Płatność',
        color: 'bg-green-100 text-green-700',
        icon: '💳',
    },
};

export default function CustomerNotesTab({ customerId }: Props) {
    const { data: notes, isLoading } = useCustomerNotes(customerId);
    const createNote = useCreateCustomerNote();
    const updateNote = useUpdateCustomerNote();
    const deleteNote = useDeleteCustomerNote();

    const [showAddForm, setShowAddForm] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [newNoteType, setNewNoteType] = useState<NoteType>('general');

    const handleAddNote = async () => {
        if (!newNoteContent.trim()) return;

        await createNote.mutateAsync({
            customerId,
            content: newNoteContent,
            type: newNoteType,
        });

        setNewNoteContent('');
        setNewNoteType('general');
        setShowAddForm(false);
    };

    const handleTogglePin = async (note: CustomerNote) => {
        await updateNote.mutateAsync({
            noteId: note.id,
            customerId,
            data: { isPinned: !note.isPinned },
        });
    };

    const handleDelete = async (noteId: number) => {
        if (!confirm('Czy na pewno chcesz usunąć tę notatkę?')) return;

        await deleteNote.mutateAsync({ noteId, customerId });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Ładowanie notatek...</div>
            </div>
        );
    }

    // Separate pinned and unpinned notes
    const pinnedNotes = notes?.filter((n) => n.isPinned) || [];
    const unpinnedNotes = notes?.filter((n) => !n.isPinned) || [];

    return (
        <div className="row">
            <div className="col-sm-12">
                <div className="versum-widget">
                    <div className="versum-widget__header flex-between">
                        <span>Notatki</span>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="btn btn-primary btn-xs"
                        >
                            + Dodaj notatkę
                        </button>
                    </div>

                    <div className="versum-widget__content">
                        {/* Add Note Form */}
                        {showAddForm && (
                            <div className="versum-panel-sub mb-20 p-15">
                                <div className="row">
                                    <div className="col-sm-4">
                                        <div className="form-group">
                                            <label
                                                htmlFor="new-note-type"
                                                className="control-label fz-11"
                                            >
                                                Typ notatki
                                            </label>
                                            <select
                                                id="new-note-type"
                                                value={newNoteType}
                                                onChange={(e) =>
                                                    setNewNoteType(
                                                        e.target
                                                            .value as NoteType,
                                                    )
                                                }
                                                className="form-control h-30 fz-12"
                                            >
                                                {Object.entries(
                                                    noteTypeConfig,
                                                ).map(([key, config]) => (
                                                    <option
                                                        key={key}
                                                        value={key}
                                                    >
                                                        {config.icon}{' '}
                                                        {config.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-sm-8 flex items-end">
                                        <div className="form-group w-full">
                                            <label
                                                htmlFor="new-note-content"
                                                className="control-label fz-11"
                                            >
                                                Treść
                                            </label>
                                            <textarea
                                                id="new-note-content"
                                                value={newNoteContent}
                                                onChange={(e) =>
                                                    setNewNoteContent(
                                                        e.target.value,
                                                    )
                                                }
                                                rows={2}
                                                placeholder="Wpisz treść notatki..."
                                                className="form-control fz-12"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-10">
                                    <button
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setNewNoteContent('');
                                            setNewNoteType('general');
                                        }}
                                        className="btn btn-default btn-xs"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        onClick={() => {
                                            void handleAddNote();
                                        }}
                                        disabled={
                                            !newNoteContent.trim() ||
                                            createNote.isPending
                                        }
                                        className="btn btn-primary btn-xs"
                                    >
                                        {createNote.isPending
                                            ? 'Zapisywanie...'
                                            : 'Zapisz'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="versum-notes-list">
                            {/* Pinned Notes */}
                            {pinnedNotes.length > 0 && (
                                <div className="mb-20">
                                    <div className="text-muted fz-11 uppercase mb-10 border-bottom pb-3">
                                        📌 Przypięte ({pinnedNotes.length})
                                    </div>
                                    {pinnedNotes.map((note) => (
                                        <NoteItem
                                            key={note.id}
                                            note={note}
                                            onTogglePin={handleTogglePin}
                                            onDelete={handleDelete}
                                            formatDate={formatDate}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Other Notes */}
                            {unpinnedNotes.length > 0 && (
                                <div>
                                    {pinnedNotes.length > 0 && (
                                        <div className="text-muted fz-11 uppercase mb-10 border-bottom pb-3">
                                            Pozostałe ({unpinnedNotes.length})
                                        </div>
                                    )}
                                    {unpinnedNotes.map((note) => (
                                        <NoteItem
                                            key={note.id}
                                            note={note}
                                            onTogglePin={handleTogglePin}
                                            onDelete={handleDelete}
                                            formatDate={formatDate}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Empty State */}
                            {notes?.length === 0 && !showAddForm && (
                                <div className="text-center text-muted p-40-0">
                                    Brak notatek. Kliknij &quot;Dodaj
                                    notatkę&quot; aby dodać pierwszą.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NoteItem({
    note,
    onTogglePin,
    onDelete,
    formatDate,
}: {
    note: CustomerNote;
    onTogglePin: (note: CustomerNote) => Promise<void> | void;
    onDelete: (id: number) => Promise<void> | void;
    formatDate: (date: string) => string;
}) {
    const config = noteTypeConfig[note.type] || noteTypeConfig.general;

    return (
        <div className="py-12 border-bottom-f0">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-5">
                        <span className="inline-block px-8 py-1 rounded-10 fz-10 bold uppercase bg-eee text-666">
                            {config.label}
                        </span>
                        <span className="fz-11 text-999">
                            {formatDate(note.createdAt)}
                            {note.createdBy && ` • ${note.createdBy.name}`}
                        </span>
                    </div>
                    <p className="m-0 fz-13 lh-15 pre-wrap text-333">
                        {note.content}
                    </p>
                </div>
                <div className="flex gap-1 ml-10">
                    <button
                        onClick={() => {
                            void onTogglePin(note);
                        }}
                        className={`btn-pin ${note.isPinned ? 'active' : 'inactive'}`}
                        title={note.isPinned ? 'Odepnij' : 'Przypnij'}
                    >
                        📌
                    </button>
                    <button
                        onClick={() => {
                            void onDelete(note.id);
                        }}
                        className="btn-delete"
                        title="Usuń"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    );
}
