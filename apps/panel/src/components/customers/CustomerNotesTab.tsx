'use client';

import { useState } from 'react';
import {
    useCreateCustomerNote,
    useCustomerNotes,
    useDeleteCustomerNote,
    useUpdateCustomerNote,
} from '@/hooks/useCustomers';
import type { CustomerNote } from '@/types';

interface Props {
    customerId: number;
}

function formatDate(value: string) {
    return new Date(value).toLocaleString('pl-PL');
}

export default function CustomerNotesTab({ customerId }: Props) {
    const { data: notes = [], isLoading, error } = useCustomerNotes(customerId);
    const create = useCreateCustomerNote();
    const update = useUpdateCustomerNote();
    const remove = useDeleteCustomerNote();
    const [content, setContent] = useState('');

    const handleAdd = async () => {
        if (!content.trim()) return;
        await create.mutateAsync({
            customerId,
            content: content.trim(),
            type: 'general',
        });
        setContent('');
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
                <div className="customer-comments-actions">
                    <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => void handleAdd()}
                        disabled={!content.trim() || create.isPending}
                    >
                        dodaj komentarz
                    </button>
                </div>
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
    return (
        <div className="customer-comment-row">
            <div className="customer-comment-meta">
                <span>{formatDate(note.createdAt)}</span>
                {note.createdBy?.name ? (
                    <span> · {note.createdBy.name}</span>
                ) : null}
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
                    className="btn btn-default btn-xs"
                    onClick={() => void onTogglePin()}
                >
                    {note.isPinned ? 'odepnij' : 'przypnij'}
                </button>
                <button
                    type="button"
                    className="btn btn-default btn-xs"
                    onClick={() => void onDelete()}
                >
                    usuń
                </button>
            </div>
        </div>
    );
}
