'use client';

import { useState, useEffect } from 'react';
import type { Service, ServiceVariant, PriceType } from '@/types';
import {
    useServiceVariants,
    useCreateServiceVariant,
    useUpdateServiceVariant,
    useDeleteServiceVariant,
} from '@/hooks/useServicesAdmin';

interface ServiceVariantsModalProps {
    isOpen: boolean;
    service: Service | null;
    onClose: () => void;
}

interface VariantFormData {
    name: string;
    description?: string;
    duration: number;
    price: number;
    priceType: PriceType;
}

const defaultFormData: VariantFormData = {
    name: '',
    description: '',
    duration: 30,
    price: 0,
    priceType: 'fixed',
};

export default function ServiceVariantsModal({
    isOpen,
    service,
    onClose,
}: ServiceVariantsModalProps) {
    const [editingVariant, setEditingVariant] = useState<ServiceVariant | null>(
        null,
    );
    const [formData, setFormData] = useState<VariantFormData>(defaultFormData);
    const [isFormVisible, setIsFormVisible] = useState(false);

    const { data: variants = [], isLoading } = useServiceVariants(
        service?.id ?? null,
    );
    const createVariant = useCreateServiceVariant();
    const updateVariant = useUpdateServiceVariant();
    const deleteVariant = useDeleteServiceVariant();

    useEffect(() => {
        if (!isOpen) {
            setEditingVariant(null);
            setFormData(defaultFormData);
            setIsFormVisible(false);
        }
    }, [isOpen]);

    const handleOpenForm = (variant?: ServiceVariant) => {
        if (variant) {
            setEditingVariant(variant);
            setFormData({
                name: variant.name,
                description: variant.description || '',
                duration: variant.duration,
                price: variant.price,
                priceType: variant.priceType,
            });
        } else {
            setEditingVariant(null);
            setFormData(defaultFormData);
        }
        setIsFormVisible(true);
    };

    const handleCancelForm = () => {
        setEditingVariant(null);
        setFormData(defaultFormData);
        setIsFormVisible(false);
    };

    const handleSaveVariant = async () => {
        if (!service) return;

        if (editingVariant) {
            await updateVariant.mutateAsync({
                serviceId: service.id,
                variantId: editingVariant.id,
                data: formData,
            });
        } else {
            await createVariant.mutateAsync({
                serviceId: service.id,
                data: formData,
            });
        }
        handleCancelForm();
    };

    const handleDeleteVariant = async (variantId: number) => {
        if (!service) return;
        if (window.confirm('Czy na pewno chcesz usunąć ten wariant?')) {
            await deleteVariant.mutateAsync({
                serviceId: service.id,
                variantId,
            });
        }
    };

    if (!isOpen || !service) return null;

    return (
        <div
            className={`modal fade ${isOpen ? 'in' : ''}`}
            style={{ display: isOpen ? 'block' : 'none' }}
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <button
                            type="button"
                            className="close"
                            onClick={onClose}
                        >
                            ×
                        </button>
                        <h4 className="modal-title">
                            Warianty usługi: {service.name}
                        </h4>
                    </div>

                    <div className="modal-body">
                        {isLoading ? (
                            <div className="text-center py-5">
                                <div className="versum-muted">
                                    Ładowanie wariantów...
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Variants list */}
                                {!isFormVisible && (
                                    <>
                                        <div
                                            className="flex-between"
                                            style={{ marginBottom: '15px' }}
                                        >
                                            <span className="versum-muted">
                                                {variants.length} wariant
                                                {variants.length !== 1 && 'ów'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenForm()}
                                                className="btn btn-primary btn-xs"
                                            >
                                                dodaj wariant
                                            </button>
                                        </div>

                                        <div className="versum-table-wrap">
                                            <table className="versum-table">
                                                <thead>
                                                    <tr>
                                                        <th>Nazwa</th>
                                                        <th>Czas</th>
                                                        <th>Cena</th>
                                                        <th
                                                            style={{
                                                                width: '100px',
                                                            }}
                                                        >
                                                            Akcje
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {variants.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={4}
                                                                className="text-center versum-muted"
                                                            >
                                                                Brak wariantów.
                                                                Dodaj nowy
                                                                wariant, aby
                                                                kontynuować.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        variants.map(
                                                            (variant) => (
                                                                <tr
                                                                    key={
                                                                        variant.id
                                                                    }
                                                                >
                                                                    <td>
                                                                        <strong>
                                                                            {
                                                                                variant.name
                                                                            }
                                                                        </strong>
                                                                        {variant.description && (
                                                                            <div
                                                                                className="versum-muted"
                                                                                style={{
                                                                                    fontSize:
                                                                                        '11px',
                                                                                }}
                                                                            >
                                                                                {
                                                                                    variant.description
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        {
                                                                            variant.duration
                                                                        }{' '}
                                                                        min
                                                                    </td>
                                                                    <td>
                                                                        {variant.priceType ===
                                                                        'from'
                                                                            ? 'od '
                                                                            : ''}
                                                                        {variant.price.toFixed(
                                                                            2,
                                                                        )}{' '}
                                                                        zł
                                                                    </td>
                                                                    <td className="text-right">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleOpenForm(
                                                                                    variant,
                                                                                )
                                                                            }
                                                                            className="btn btn-default btn-xs"
                                                                            style={{
                                                                                marginRight:
                                                                                    '4px',
                                                                            }}
                                                                        >
                                                                            edytuj
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                void handleDeleteVariant(
                                                                                    variant.id,
                                                                                )
                                                                            }
                                                                            className="btn btn-default btn-xs"
                                                                        >
                                                                            usuń
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {/* Variant form */}
                                {isFormVisible && (
                                    <div className="form-horizontal">
                                        <h5
                                            style={{
                                                borderBottom: '1px solid #eee',
                                                paddingBottom: '10px',
                                                marginBottom: '20px',
                                            }}
                                        >
                                            {editingVariant
                                                ? 'Edycja wariantu'
                                                : 'Nowy wariant'}
                                        </h5>

                                        <div className="control-group">
                                            <label className="control-label">
                                                Nazwa wariantu *
                                            </label>
                                            <div className="controls">
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            name: e.target
                                                                .value,
                                                        })
                                                    }
                                                    className="form-control"
                                                    placeholder="np. Krótkie włosy, Długie włosy"
                                                />
                                            </div>
                                        </div>

                                        <div className="control-group">
                                            <label className="control-label">
                                                Opis (opcjonalnie)
                                            </label>
                                            <div className="controls">
                                                <input
                                                    type="text"
                                                    value={
                                                        formData.description ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            description:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="form-control"
                                                />
                                            </div>
                                        </div>

                                        <div className="control-group">
                                            <label className="control-label">
                                                Czas trwania (min) *
                                            </label>
                                            <div className="controls">
                                                <input
                                                    type="number"
                                                    value={formData.duration}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            duration:
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                ) || 0,
                                                        })
                                                    }
                                                    min={5}
                                                    step={5}
                                                    className="form-control"
                                                    style={{ width: '100px' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="control-group">
                                            <label className="control-label">
                                                Cena (zł) *
                                            </label>
                                            <div className="controls">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={formData.price}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                price:
                                                                    parseFloat(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                            })
                                                        }
                                                        min={0}
                                                        step={0.01}
                                                        className="form-control"
                                                        style={{
                                                            width: '100px',
                                                        }}
                                                    />
                                                    <select
                                                        value={
                                                            formData.priceType
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                priceType: e
                                                                    .target
                                                                    .value as PriceType,
                                                            })
                                                        }
                                                        className="form-control"
                                                        style={{
                                                            width: '150px',
                                                        }}
                                                    >
                                                        <option value="fixed">
                                                            Stała cena
                                                        </option>
                                                        <option value="from">
                                                            Cena od
                                                        </option>
                                                        <option value="free">
                                                            Bezpłatna
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className="form-actions"
                                            style={{
                                                background: 'none',
                                                borderTop: '1px solid #eee',
                                                padding: '20px 0 0',
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={handleCancelForm}
                                                className="btn btn-default"
                                                style={{ marginRight: '10px' }}
                                            >
                                                anuluj
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    void handleSaveVariant();
                                                }}
                                                disabled={
                                                    !formData.name ||
                                                    createVariant.isPending ||
                                                    updateVariant.isPending
                                                }
                                                className="btn btn-primary"
                                            >
                                                {editingVariant
                                                    ? 'zapisz zmiany'
                                                    : 'dodaj wariant'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {!isFormVisible && (
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-default"
                                onClick={onClose}
                            >
                                zamknij
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {isOpen && (
                <div className="modal-backdrop fade in" onClick={onClose}></div>
            )}
        </div>
    );
}
