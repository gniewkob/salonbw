'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
    useCustomerGroups,
    useCreateCustomerGroup,
    useUpdateCustomerGroup,
    useDeleteCustomerGroup,
} from '@/hooks/useCustomers';

type Props = {
    onClose: () => void;
};

type Draft = {
    name: string;
    description: string;
    color: string;
};

const colorOptions = [
    '#06b6d4', // cyan
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#6366f1', // indigo
    '#64748b', // slate
];

export default function ManageCustomerGroupsModal({ onClose }: Props) {
    const { data: groups = [], isLoading } = useCustomerGroups();
    const create = useCreateCustomerGroup();
    const update = useUpdateCustomerGroup();
    const del = useDeleteCustomerGroup();

    const [newGroup, setNewGroup] = useState<Draft>({
        name: '',
        description: '',
        color: '#06b6d4',
    });

    const [drafts, setDrafts] = useState<Record<number, Draft>>({});

    useEffect(() => {
        // Initialize drafts from server state.
        setDrafts((prev) => {
            const next: Record<number, Draft> = { ...prev };
            for (const g of groups) {
                if (!next[g.id]) {
                    next[g.id] = {
                        name: g.name ?? '',
                        description: g.description ?? '',
                        color: g.color ?? '#06b6d4',
                    };
                }
            }
            // Drop drafts for deleted groups.
            for (const idStr of Object.keys(next)) {
                const id = Number(idStr);
                if (!groups.some((g) => g.id === id)) {
                    delete next[id];
                }
            }
            return next;
        });
    }, [groups]);

    const isBusy = create.isPending || update.isPending || del.isPending;

    const sortedGroups = useMemo(() => {
        return [...groups].sort((a, b) => (a.name ?? '').localeCompare(b.name));
    }, [groups]);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        const payload = {
            name: newGroup.name.trim(),
            description: newGroup.description.trim() || undefined,
            color: newGroup.color,
        };
        if (!payload.name) return;
        await create.mutateAsync(payload);
        setNewGroup({ name: '', description: '', color: '#06b6d4' });
    };

    const handleSave = async (groupId: number) => {
        const d = drafts[groupId];
        if (!d) return;
        await update.mutateAsync({
            id: groupId,
            data: {
                name: d.name.trim(),
                description: d.description.trim() || undefined,
                color: d.color,
            },
        });
    };

    const handleDelete = async (groupId: number) => {
        if (
            !confirm(
                'Czy na pewno chcesz usunąć tę grupę? Członkowie nie zostaną usunięci, tylko przestaną należeć do grupy.',
            )
        ) {
            return;
        }
        await del.mutateAsync(groupId);
    };

    return (
        <div className="modal-backdrop fade in" onClick={onClose}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h4 className="modal-title">Grupy klientów</h4>
                        <button
                            type="button"
                            className="close"
                            onClick={onClose}
                            aria-label="Zamknij"
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>

                    <div className="modal-body modal-body-scroll">
                        <form onSubmit={(e) => void handleCreate(e)}>
                            <div className="form-group">
                                <label
                                    className="control-label"
                                    htmlFor="new_group_name"
                                >
                                    Dodaj nową grupę
                                </label>
                                <input
                                    id="new_group_name"
                                    className="form-control"
                                    value={newGroup.name}
                                    onChange={(e) =>
                                        setNewGroup((p) => ({
                                            ...p,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="np. VIP, Stali klienci"
                                    disabled={isBusy}
                                />
                            </div>
                            <div className="form-group">
                                <label
                                    className="control-label"
                                    htmlFor="new_group_desc"
                                >
                                    Opis (opcjonalnie)
                                </label>
                                <textarea
                                    id="new_group_desc"
                                    className="form-control"
                                    value={newGroup.description}
                                    onChange={(e) =>
                                        setNewGroup((p) => ({
                                            ...p,
                                            description: e.target.value,
                                        }))
                                    }
                                    rows={2}
                                    disabled={isBusy}
                                />
                            </div>
                            <div className="form-group">
                                <label className="control-label">Kolor</label>
                                <div className="versum-color-picker">
                                    {colorOptions.map((color) => {
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() =>
                                                    setNewGroup((p) => ({
                                                        ...p,
                                                        color,
                                                    }))
                                                }
                                                style={{
                                                    backgroundColor: color,
                                                }}
                                                title={color}
                                                aria-label={color}
                                                disabled={isBusy}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-xs"
                                    disabled={isBusy || !newGroup.name.trim()}
                                >
                                    {create.isPending
                                        ? 'Zapisywanie...'
                                        : 'Dodaj'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-default btn-xs"
                                    onClick={() =>
                                        setNewGroup({
                                            name: '',
                                            description: '',
                                            color: '#06b6d4',
                                        })
                                    }
                                    disabled={isBusy}
                                >
                                    Wyczyść
                                </button>
                            </div>
                        </form>

                        <hr className="my-[14px] border-[#eef1f4]" />

                        {isLoading ? (
                            <div className="text-muted">Ładowanie grup...</div>
                        ) : sortedGroups.length === 0 ? (
                            <div className="text-muted">
                                Brak grup. Dodaj pierwszą grupę powyżej.
                            </div>
                        ) : (
                            <div>
                                {sortedGroups.map((g) => {
                                    const d = drafts[g.id] ?? {
                                        name: g.name ?? '',
                                        description: g.description ?? '',
                                        color: g.color ?? '#06b6d4',
                                    };
                                    return (
                                        <div
                                            key={g.id}
                                            className="border border-[#e6eaee] rounded-[3px] p-[10px] mb-[10px]"
                                        >
                                            <div className="flex items-center justify-between gap-[10px] mb-2">
                                                <div className="flex items-center gap-[10px]">
                                                    {(() => {
                                                        const colorDotStyle: React.CSSProperties =
                                                            {
                                                                width: 10,
                                                                height: 10,
                                                                borderRadius: 999,
                                                                background:
                                                                    d.color ||
                                                                    '#06b6d4',
                                                                display:
                                                                    'inline-block',
                                                                boxShadow:
                                                                    '0 0 0 1px rgba(0,0,0,0.12)',
                                                            };
                                                        return (
                                                            <span
                                                                style={
                                                                    colorDotStyle
                                                                }
                                                            />
                                                        );
                                                    })()}
                                                    <strong className="text-[12px]">
                                                        #{g.id}
                                                    </strong>
                                                </div>
                                                <div className="btn-group">
                                                    <button
                                                        type="button"
                                                        className="btn btn-default btn-xs"
                                                        onClick={() =>
                                                            void handleSave(
                                                                g.id,
                                                            )
                                                        }
                                                        disabled={
                                                            isBusy ||
                                                            !d.name.trim()
                                                        }
                                                    >
                                                        Zapisz
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-xs"
                                                        onClick={() =>
                                                            void handleDelete(
                                                                g.id,
                                                            )
                                                        }
                                                        disabled={isBusy}
                                                    >
                                                        Usuń
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label
                                                    className="control-label"
                                                    htmlFor={`group_name_${g.id}`}
                                                >
                                                    Nazwa
                                                </label>
                                                <input
                                                    id={`group_name_${g.id}`}
                                                    className="form-control"
                                                    value={d.name}
                                                    onChange={(e) =>
                                                        setDrafts((p) => ({
                                                            ...p,
                                                            [g.id]: {
                                                                ...d,
                                                                name: e.target
                                                                    .value,
                                                            },
                                                        }))
                                                    }
                                                    disabled={isBusy}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label
                                                    className="control-label"
                                                    htmlFor={`group_desc_${g.id}`}
                                                >
                                                    Opis
                                                </label>
                                                <textarea
                                                    id={`group_desc_${g.id}`}
                                                    className="form-control"
                                                    value={d.description}
                                                    onChange={(e) =>
                                                        setDrafts((p) => ({
                                                            ...p,
                                                            [g.id]: {
                                                                ...d,
                                                                description:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        }))
                                                    }
                                                    rows={2}
                                                    disabled={isBusy}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="control-label">
                                                    Kolor
                                                </label>
                                                <div className="versum-color-picker">
                                                    {colorOptions.map(
                                                        (color) => {
                                                            const buttonStyle =
                                                                {
                                                                    backgroundColor:
                                                                        color,
                                                                };
                                                            return (
                                                                <button
                                                                    key={color}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setDrafts(
                                                                            (
                                                                                p,
                                                                            ) => ({
                                                                                ...p,
                                                                                [g.id]: {
                                                                                    ...d,
                                                                                    color,
                                                                                },
                                                                            }),
                                                                        )
                                                                    }
                                                                    style={
                                                                        buttonStyle
                                                                    }
                                                                    title={
                                                                        color
                                                                    }
                                                                    aria-label={
                                                                        color
                                                                    }
                                                                    disabled={
                                                                        isBusy
                                                                    }
                                                                />
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-default"
                            onClick={onClose}
                            disabled={isBusy}
                        >
                            Zamknij
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
