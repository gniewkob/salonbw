import { useState, useEffect } from 'react';
import type { ServiceCategory } from '@/types';
import PanelButton from '@/components/ui/PanelButton';

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
    { label: 'Czerń', value: '#0d0d0d' },
    { label: 'Grafit', value: '#23252a' },
    { label: 'Szary ciemny', value: '#5f6369' },
    { label: 'Szary', value: '#6e7278' },
    { label: 'Srebrny ciemny', value: '#8e9298' },
    { label: 'Srebrny', value: '#b4b8be' },
    { label: 'Szary jasny', value: '#d1d5db' },
];
const DEFAULT_CATEGORY_COLOR = '#6e7278';
const APPROVED_CATEGORY_COLORS = new Set(
    COLOR_OPTIONS.map((option) => option.value),
);

function normalizeCategoryColor(color?: string | null) {
    return color && APPROVED_CATEGORY_COLORS.has(color)
        ? color
        : DEFAULT_CATEGORY_COLOR;
}

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
        color: DEFAULT_CATEGORY_COLOR,
        parentId: undefined,
        isActive: true,
    });

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                description: category.description || '',
                color: normalizeCategoryColor(category.color),
                parentId: category.parentId,
                isActive: category.isActive,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                color: DEFAULT_CATEGORY_COLOR,
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
        <div
            className="modal bg-modal-overlay"
            style={{ display: 'block', opacity: 1 }}
        >
            <div
                className="modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Kategoria usług"
            >
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
                            <div className="mb-3">
                                <label
                                    htmlFor="category_name"
                                    className="col-sm-3 form-label"
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

                            <div className="mb-3">
                                <label
                                    htmlFor="category_description"
                                    className="col-sm-3 form-label"
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

                            <div className="mb-3">
                                <label
                                    htmlFor="category_parent"
                                    className="col-sm-3 form-label"
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

                            <div className="mb-3">
                                <span className="col-sm-3 form-label d-block">
                                    Kolor
                                </span>
                                <div className="col-sm-9">
                                    <div className="d-flex align-items-center gap-5 flex-wrap mt-5">
                                        {COLOR_OPTIONS.map((option) => {
                                            const dotStyle = {
                                                '--category-color':
                                                    option.value,
                                            } as React.CSSProperties;
                                            const isSelected =
                                                formData.color === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() =>
                                                        setFormData({
                                                            ...formData,
                                                            color: option.value,
                                                        })
                                                    }
                                                    className={`category-color-swatch${isSelected ? ' is-selected' : ''}`}
                                                    style={dotStyle}
                                                    aria-label={`Wybierz kolor: ${option.label}`}
                                                    aria-pressed={isSelected}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
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
                            <PanelButton
                                type="button"
                                onClick={onClose}
                                variant="secondary"
                            >
                                Anuluj
                            </PanelButton>
                            <PanelButton type="submit" variant="primary">
                                {category ? 'Zapisz zmiany' : 'Dodaj kategorię'}
                            </PanelButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
