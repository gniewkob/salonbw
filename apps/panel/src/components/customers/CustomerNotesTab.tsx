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
                            <div
                                className="versum-panel-sub"
                                style={{
                                    marginBottom: '20px',
                                    padding: '15px',
                                }}
                            >
                                <div className="row">
                                    <div className="col-sm-4">
                                        <div className="form-group">
                                            <label
                                                className="control-label"
                                                style={{ fontSize: '11px' }}
                                            >
                                                Typ notatki
                                            </label>
                                            <select
                                                value={newNoteType}
                                                onChange={(e) =>
                                                    setNewNoteType(
                                                        e.target
                                                            .value as NoteType,
                                                    )
                                                }
                                                className="form-control"
                                                style={{
                                                    height: '30px',
                                                    fontSize: '12px',
                                                }}
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
                                                className="control-label"
                                                style={{ fontSize: '11px' }}
                                            >
                                                Treść
                                            </label>
                                            <textarea
                                                value={newNoteContent}
                                                onChange={(e) =>
                                                    setNewNoteContent(
                                                        e.target.value,
                                                    )
                                                }
                                                rows={2}
                                                placeholder="Wpisz treść notatki..."
                                                className="form-control"
                                                style={{ fontSize: '12px' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div
                                    className="flex justify-end gap-2"
                                    style={{ marginTop: '10px' }}
                                >
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
                                <div style={{ marginBottom: '20px' }}>
                                    <div
                                        className="text-muted"
                                        style={{
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                            marginBottom: '10px',
                                            borderBottom: '1px solid #eee',
                                            paddingBottom: '3px',
                                        }}
                                    >
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
                                        <div
                                            className="text-muted"
                                            style={{
                                                fontSize: '11px',
                                                textTransform: 'uppercase',
                                                marginBottom: '10px',
                                                borderBottom: '1px solid #eee',
                                                paddingBottom: '3px',
                                            }}
                                        >
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
                                <div
                                    className="text-center text-muted"
                                    style={{ padding: '40px 0' }}
                                >
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
        <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div className="flex items-start justify-between">
                <div style={{ flex: 1 }}>
                    <div
                        className="flex items-center gap-2"
                        style={{ marginBottom: '5px' }}
                    >
                        <span
                            style={{
                                display: 'inline-block',
                                padding: '1px 8px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background: '#eee',
                                color: '#666',
                            }}
                        >
                            {config.label}
                        </span>
                        <span style={{ fontSize: '11px', color: '#999' }}>
                            {formatDate(note.createdAt)}
                            {note.createdBy && ` • ${note.createdBy.name}`}
                        </span>
                    </div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: '13px',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                            color: '#333',
                        }}
                    >
                        {note.content}
                    </p>
                </div>
                <div className="flex gap-1" style={{ marginLeft: '10px' }}>
                    <button
                        onClick={() => {
                            void onTogglePin(note);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '3px',
                            opacity: note.isPinned ? 1 : 0.3,
                            filter: note.isPinned ? 'none' : 'grayscale(100%)',
                        }}
                        title={note.isPinned ? 'Odepnij' : 'Przypnij'}
                    >
                        📌
                    </button>
                    <button
                        onClick={() => {
                            void onDelete(note.id);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '3px',
                            opacity: 0.3,
                        }}
                        className="hover:opacity-100"
                        title="Usuń"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    );
}
