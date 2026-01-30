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
    general: { label: 'Ogólna', color: 'bg-gray-100 text-gray-700', icon: '📝' },
    warning: { label: 'Ostrzeżenie', color: 'bg-red-100 text-red-700', icon: '⚠️' },
    preference: {
        label: 'Preferencja',
        color: 'bg-blue-100 text-blue-700',
        icon: '⭐',
    },
    medical: { label: 'Medyczna', color: 'bg-purple-100 text-purple-700', icon: '🏥' },
    payment: { label: 'Płatność', color: 'bg-green-100 text-green-700', icon: '💳' },
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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Notatki</h3>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="rounded bg-cyan-600 px-3 py-1.5 text-sm text-white hover:bg-cyan-700"
                >
                    + Dodaj notatkę
                </button>
            </div>

            {/* Add Note Form */}
            {showAddForm && (
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="mb-3">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Typ notatki
                        </label>
                        <select
                            value={newNoteType}
                            onChange={(e) => setNewNoteType(e.target.value as NoteType)}
                            className="w-full rounded border px-3 py-2"
                        >
                            {Object.entries(noteTypeConfig).map(([key, config]) => (
                                <option key={key} value={key}>
                                    {config.icon} {config.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Treść
                        </label>
                        <textarea
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            rows={3}
                            placeholder="Wpisz treść notatki..."
                            className="w-full rounded border px-3 py-2"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                setNewNoteContent('');
                                setNewNoteType('general');
                            }}
                            className="rounded border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            Anuluj
                        </button>
                        <button
                            onClick={handleAddNote}
                            disabled={!newNoteContent.trim() || createNote.isPending}
                            className="rounded bg-cyan-600 px-3 py-1.5 text-sm text-white hover:bg-cyan-700 disabled:opacity-50"
                        >
                            {createNote.isPending ? 'Zapisywanie...' : 'Zapisz'}
                        </button>
                    </div>
                </div>
            )}

            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-500">
                        📌 Przypięte ({pinnedNotes.length})
                    </h4>
                    {pinnedNotes.map((note) => (
                        <NoteCard
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
                <div className="space-y-3">
                    {pinnedNotes.length > 0 && (
                        <h4 className="text-sm font-medium text-gray-500">
                            Pozostałe ({unpinnedNotes.length})
                        </h4>
                    )}
                    {unpinnedNotes.map((note) => (
                        <NoteCard
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
            {notes?.length === 0 && (
                <div className="rounded-lg border bg-gray-50 p-8 text-center text-gray-500">
                    Brak notatek. Kliknij &quot;Dodaj notatkę&quot; aby dodać pierwszą.
                </div>
            )}
        </div>
    );
}

function NoteCard({
    note,
    onTogglePin,
    onDelete,
    formatDate,
}: {
    note: CustomerNote;
    onTogglePin: (note: CustomerNote) => void;
    onDelete: (id: number) => void;
    formatDate: (date: string) => string;
}) {
    const config = noteTypeConfig[note.type] || noteTypeConfig.general;

    return (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-start justify-between">
                <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}
                >
                    {config.icon} {config.label}
                </span>
                <div className="flex gap-1">
                    <button
                        onClick={() => onTogglePin(note)}
                        className={`rounded p-1 hover:bg-gray-100 ${
                            note.isPinned ? 'text-cyan-600' : 'text-gray-400'
                        }`}
                        title={note.isPinned ? 'Odepnij' : 'Przypnij'}
                    >
                        📌
                    </button>
                    <button
                        onClick={() => onDelete(note.id)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Usuń"
                    >
                        🗑️
                    </button>
                </div>
            </div>
            <p className="whitespace-pre-wrap text-gray-700">{note.content}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span>{formatDate(note.createdAt)}</span>
                {note.createdBy && <span>Dodał: {note.createdBy.name}</span>}
            </div>
        </div>
    );
}
