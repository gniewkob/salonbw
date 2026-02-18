'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useCreateWarehouseOrder,
    useWarehouseProducts,
} from '@/hooks/useWarehouseViews';
import { useSuppliers } from '@/hooks/useWarehouse';

interface OrderLineForm {
    productId: string;
    productName: string;
    quantity: string;
    unit: string;
}

export default function WarehouseOrderCreatePage() {
    const router = useRouter();
    const { data: suppliers = [] } = useSuppliers();
    const { data: products = [] } = useWarehouseProducts({
        includeInactive: false,
    });
    const createMutation = useCreateWarehouseOrder();

    const [supplierId, setSupplierId] = useState('');
    const [notes, setNotes] = useState('');
    const [notesEnabled, setNotesEnabled] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [lines, setLines] = useState<OrderLineForm[]>([
        { productId: '', productName: '', quantity: '1', unit: 'op.' },
    ]);

    const addLine = () => {
        setLines((current) => [
            ...current,
            { productId: '', productName: '', quantity: '1', unit: 'op.' },
        ]);
    };

    const updateLine = (index: number, next: Partial<OrderLineForm>) => {
        setLines((current) =>
            current.map((line, lineIndex) =>
                lineIndex === index ? { ...line, ...next } : line,
            ),
        );
    };

    const submit = async () => {
        setFormError(null);
        const items = lines
            .map((line) => ({
                productId: line.productId ? Number(line.productId) : undefined,
                productName: line.productName || undefined,
                quantity: Number(line.quantity || 0),
                unit: line.unit || 'op.',
            }))
            .filter(
                (line) =>
                    line.quantity > 0 && (line.productId || line.productName),
            );

        if (items.length === 0) {
            setFormError(
                'Dodaj co najmniej jedną pozycję zamówienia z ilością większą od 0.',
            );
            return;
        }

        await createMutation.mutateAsync({
            supplierId: supplierId ? Number(supplierId) : undefined,
            notes: notes || undefined,
            items,
        });

        await router.push('/orders/history?status=draft');
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Dodaj zamówienie | SalonBW"
            heading="Magazyn / Dodaj zamówienie"
            activeTab="orders"
            actions={
                <Link href="/orders/history" className="btn btn-default btn-xs">
                    historia zamówień
                </Link>
            }
        >
            <div className="warehouse-new-screen">
                <h3 className="warehouse-subtitle">Pozycje zamówienia</h3>
                <div className="products-table-wrap warehouse-lines-table">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>lp</th>
                                <th>nazwa</th>
                                <th>jednostka</th>
                                <th>ilość</th>
                                <th>usuń</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line, index) => (
                                <tr key={`${index}-${line.productId}`}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <select
                                            value={line.productId}
                                            onChange={(event) => {
                                                const value =
                                                    event.target.value;
                                                const product = products.find(
                                                    (item) =>
                                                        String(item.id) ===
                                                        value,
                                                );
                                                updateLine(index, {
                                                    productId: value,
                                                    productName:
                                                        product?.name ?? '',
                                                    unit:
                                                        product?.unit || 'op.',
                                                });
                                            }}
                                            className="form-control"
                                        >
                                            <option value="">
                                                wybierz produkt
                                            </option>
                                            {products.map((product) => (
                                                <option
                                                    key={product.id}
                                                    value={product.id}
                                                >
                                                    {product.name}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            value={line.productName}
                                            onChange={(event) =>
                                                updateLine(index, {
                                                    productName:
                                                        event.target.value,
                                                })
                                            }
                                            className="form-control"
                                            placeholder="nazwa alternatywna"
                                        />
                                    </td>
                                    <td>
                                        <select
                                            value={line.unit}
                                            onChange={(event) =>
                                                updateLine(index, {
                                                    unit: event.target.value,
                                                })
                                            }
                                            className="form-control"
                                        >
                                            <option value="op.">op.</option>
                                            <option value="szt.">szt.</option>
                                            <option value="ml">ml</option>
                                            <option value="g">g</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min={1}
                                            value={line.quantity}
                                            onChange={(event) =>
                                                updateLine(index, {
                                                    quantity:
                                                        event.target.value,
                                                })
                                            }
                                            className="form-control"
                                        />
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn btn-default btn-xs"
                                            onClick={() =>
                                                setLines((current) =>
                                                    current.filter(
                                                        (_, lineIndex) =>
                                                            lineIndex !== index,
                                                    ),
                                                )
                                            }
                                        >
                                            usuń
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="warehouse-actions-row">
                    <button
                        type="button"
                        className="btn btn-default btn-xs"
                        onClick={addLine}
                    >
                        dodaj kolejną pozycję
                    </button>
                    <Link
                        href="/products/new"
                        className="btn btn-default btn-xs"
                    >
                        dodaj nowy produkt
                    </Link>
                </div>

                <div className="warehouse-entry-form">
                    <div className="warehouse-entry-row">
                        <span className="warehouse-entry-row__index">1.</span>
                        <span className="warehouse-entry-row__label">
                            dostawca
                        </span>
                        <div className="warehouse-inline-field">
                            <select
                                value={supplierId}
                                onChange={(event) =>
                                    setSupplierId(event.target.value)
                                }
                                className="versum-select"
                            >
                                <option value="">
                                    wpisz nazwę lub wybierz z listy
                                </option>
                                {suppliers.map((supplier) => (
                                    <option
                                        key={supplier.id}
                                        value={supplier.id}
                                    >
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                            <Link
                                href="/suppliers"
                                className="btn btn-default btn-xs"
                            >
                                dodaj dostawcę
                            </Link>
                        </div>
                    </div>
                    {notesEnabled ? (
                        <div className="warehouse-entry-row">
                            <span className="warehouse-entry-row__index">
                                2.
                            </span>
                            <span className="warehouse-entry-row__label">
                                opis
                            </span>
                            <textarea
                                value={notes}
                                onChange={(event) =>
                                    setNotes(event.target.value)
                                }
                                className="form-control"
                            />
                        </div>
                    ) : (
                        <div className="warehouse-entry-row">
                            <span className="warehouse-entry-row__index">
                                2.
                            </span>
                            <span className="warehouse-entry-row__label">
                                opis
                            </span>
                            <button
                                type="button"
                                className="btn btn-default btn-xs"
                                onClick={() => setNotesEnabled(true)}
                            >
                                dodaj uwagi
                            </button>
                        </div>
                    )}
                    <div className="warehouse-entry-actions">
                        <Link
                            href="/orders/history"
                            className="btn btn-default btn-xs"
                        >
                            anuluj
                        </Link>
                        <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={() => void submit()}
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending
                                ? 'zapisywanie...'
                                : 'zapisz zamówienie'}
                        </button>
                        <span className="warehouse-entry-total">
                            pozycje: {lines.length}
                        </span>
                    </div>
                </div>
                {formError ? (
                    <p className="warehouse-validation-error">{formError}</p>
                ) : null}
            </div>
        </WarehouseLayout>
    );
}
