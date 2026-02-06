'use client';

import { useState, useEffect } from 'react';
import type { ServiceCategory } from '@/types';

interface Props {
    isOpen: boolean;
    category: ServiceCategory | null;
    parentId: number | null;
    categories: ServiceCategory[];
    onClose: () => void;
    onSave: (data: CategoryFormData) => Promise<void> | void;
}

export interface CategoryFormData {
    name: string;
    description: string;
    color: string;
    parentId: number | undefined;
    isActive: boolean;
}

const COLOR_OPTIONS = [
    '#25B4C1', // Primary teal
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F97316', // Orange
    '#EAB308', // Yellow
    '#22C55E', // Green
    '#6B7280', // Gray
];

export default function CategoryFormModal({
    isOpen,
    category,
    parentId,
    categories,
    onClose,
    onSave,
}: Props) {
    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
        description: '',
        color: COLOR_OPTIONS[0],
        parentId: undefined,
        isActive: true,
    });

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                description: category.description || '',
                color: category.color || COLOR_OPTIONS[0],
                parentId: category.parentId,
                isActive: category.isActive,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                color: COLOR_OPTIONS[0],
                parentId: parentId || undefined,
                isActive: true,
            });
        }
    }, [category, parentId, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void onSave(formData);
    };

    const flattenCategories = (
        cats: ServiceCategory[],
        level = 0,
        excludeId?: number,
    ): Array<{ id: number; name: string; level: number }> => {
        const result: Array<{ id: number; name: string; level: number }> = [];
        for (const cat of cats) {
            if (cat.id !== excludeId) {
                result.push({ id: cat.id, name: cat.name, level });
                if (cat.children) {
                    result.push(
                        ...flattenCategories(
                            cat.children,
                            level + 1,
                            excludeId,
                        ),
                    );
                }
            }
        }
        return result;
    };

    const flatCategories = flattenCategories(categories, 0, category?.id);

    if (!isOpen) return null;

    return (
        <div className="modal fade in block bg-modal-overlay">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <button
                            type="button"
                            className="close"
                            onClick={onClose}
                            aria-label="Zamknij"
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title">
                            {category ? 'Edytuj kategorię' : 'Nowa kategoria'}
                        </h4>
                    </div>

                    <form className="form-horizontal" onSubmit={handleSubmit}>
                        <div className="modal-body py-20">
                            <div className="form-group">
                                <label
                                    htmlFor="category_name"
                                    className="col-sm-3 control-label"
                                >
                                    Nazwa kategorii *
                                </label>
                                <div className="col-sm-9">
                                    <input
                                        id="category_name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="form-control"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label
                                    htmlFor="category_description"
                                    className="col-sm-3 control-label"
                                >
                                    Opis
                                </label>
                                <div className="col-sm-9">
                                    <textarea
                                        id="category_description"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        rows={3}
                                        className="form-control"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label
                                    htmlFor="category_parent"
                                    className="col-sm-3 control-label"
                                >
                                    Kategoria nadrzędna
                                </label>
                                <div className="col-sm-9">
                                    <select
                                        id="category_parent"
                                        value={formData.parentId || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                parentId: e.target.value
                                                    ? Number(e.target.value)
                                                    : undefined,
                                            })
                                        }
                                        className="form-control"
                                    >
                                        <option value="">
                                            Brak (kategoria główna)
                                        </option>
                                        {flatCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {'\u00A0'.repeat(cat.level * 4)}{' '}
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="col-sm-3 control-label">
                                    Kolor
                                </label>
                                <div className="col-sm-9">
                                    <div className="flex-center gap-6 flex-wrap mt-5">
                                        {COLOR_OPTIONS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        color,
                                                    })
                                                }
                                                className="status-dot w-24 h-24"
                                                style={{
                                                    backgroundColor: color,
                                                    border:
                                                        formData.color === color
                                                            ? '2px solid #000'
                                                            : '1px solid #ddd',
                                                }}
                                                aria-label={`Wybierz kolor ${color}`}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            value={formData.color}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    color: e.target.value,
                                                })
                                            }
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                padding: 0,
                                                border: '1px solid #ddd',
                                                borderRadius: '50%',
                                                cursor: 'pointer',
                                            }}
                                            title="Wybierz własny kolor"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="col-sm-offset-3 col-sm-9">
                                    <div className="checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        isActive:
                                                            e.target.checked,
                                                    })
                                                }
                                            />
                                            Kategoria aktywna
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-default"
                            >
                                Anuluj
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {category ? 'Zapisz zmiany' : 'Dodaj kategorię'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
