'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseProducts } from '@/hooks/useWarehouseViews';
import {
    useCreateDelivery,
    useReceiveDelivery,
    useSuppliers,
} from '@/hooks/useWarehouse';

interface DeliveryLineForm {
    productId: string;
    quantity: string;
    unitCost: string;
    unit: string;
}

export default function WarehouseDeliveryCreatePage() {
    const router = useRouter();
    const { data: products = [] } = useWarehouseProducts({
        includeInactive: false,
    });
    const { data: suppliers = [] } = useSuppliers();
    const createDelivery = useCreateDelivery();
    const receiveDelivery = useReceiveDelivery();

    const [supplierId, setSupplierId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [deliveryDate, setDeliveryDate] = useState(
        new Date().toISOString().slice(0, 10),
    );
    const [notes, setNotes] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [lines, setLines] = useState<DeliveryLineForm[]>([
        { productId: '', quantity: '1', unitCost: '0', unit: 'op.' },
    ]);

    const addLine = () => {
        setLines((current) => [
            ...current,
            { productId: '', quantity: '1', unitCost: '0', unit: 'op.' },
        ]);
    };

    const updateLine = (index: number, next: Partial<DeliveryLineForm>) => {
        setLines((current) =>
            current.map((line, lineIndex) =>
                lineIndex === index ? { ...line, ...next } : line,
            ),
        );
    };

    const removeLine = (index: number) => {
        setLines((current) =>
            current.filter((_, lineIndex) => lineIndex !== index),
        );
    };

    const getValidItems = () =>
        lines
            .filter((line) => line.productId)
            .map((line) => ({
                productId: Number(line.productId),
                quantity: Number(line.quantity || 0),
                unitCost: Number(line.unitCost || 0),
            }))
            .filter((line) => line.quantity > 0);

    const createDraft = async () => {
        setFormError(null);
        const items = getValidItems();
        if (items.length === 0) {
            setFormError(
                'Dodaj co najmniej jedną pozycję z produktem i ilością większą od 0.',
            );
            return null;
        }

        const created = await createDelivery.mutateAsync({
            supplierId: supplierId ? Number(supplierId) : undefined,
            deliveryDate,
            invoiceNumber: invoiceNumber || undefined,
            notes: notes || undefined,
            items,
        });

        return created;
    };

    const submit = async () => {
        setFormError(null);
        const created = await createDraft();
        if (!created) return;
        await receiveDelivery.mutateAsync({ id: created.id });
        await router.push('/deliveries/history');
    };

    const saveDraftAndExit = async () => {
        const created = await createDraft();
        if (!created) return;
        await router.push('/deliveries/history?status=draft');
    };

    const totalNet = lines.reduce((sum, line) => {
        const qty = Number(line.quantity || 0);
        const unit = Number(line.unitCost || 0);
        return sum + qty * unit;
    }, 0);
    const totalGross = totalNet * 1.23;

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Dodaj dostawę | SalonBW"
            heading="Magazyn / Dodaj dostawę"
            activeTab="deliveries"
            actions={
                <Link
                    href="/deliveries/history"
                    className="btn btn-default btn-xs"
                >
                    historia dostaw
                </Link>
            }
        >
            <div className="warehouse-new-screen">
                <h3 className="warehouse-subtitle">Pozycje dostawy</h3>
                <div className="products-table-wrap warehouse-lines-table">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>lp</th>
                                <th>nazwa</th>
                                <th>jednostka</th>
                                <th>ilość</th>
                                <th>cena/op. (netto)</th>
                                <th>wartość (netto)</th>
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
                                                    unit:
                                                        product?.unit || 'op.',
                                                });
                                            }}
                                            className="form-control"
                                        >
                                            <option value="">
                                                wpisz nazwę, kod kreskowy itp.
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
                                    </td>
                                    <td>{line.unit || 'op.'}</td>
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
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={line.unitCost}
                                            onChange={(event) =>
                                                updateLine(index, {
                                                    unitCost:
                                                        event.target.value,
                                                })
                                            }
                                            className="form-control"
                                        />
                                    </td>
                                    <td>
                                        {(
                                            Number(line.quantity || 0) *
                                            Number(line.unitCost || 0)
                                        ).toFixed(2)}{' '}
                                        zł
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn btn-default btn-xs"
                                            onClick={() => removeLine(index)}
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
                    <div className="warehouse-entry-row">
                        <span className="warehouse-entry-row__index">2.</span>
                        <span className="warehouse-entry-row__label">
                            numer faktury
                        </span>
                        <input
                            type="text"
                            value={invoiceNumber}
                            onChange={(event) =>
                                setInvoiceNumber(event.target.value)
                            }
                            className="form-control"
                        />
                    </div>
                    <div className="warehouse-entry-row">
                        <span className="warehouse-entry-row__index">3.</span>
                        <span className="warehouse-entry-row__label">
                            wystawiono
                        </span>
                        <input
                            type="date"
                            value={deliveryDate}
                            onChange={(event) =>
                                setDeliveryDate(event.target.value)
                            }
                            className="form-control"
                        />
                    </div>
                    <div className="warehouse-entry-row">
                        <span className="warehouse-entry-row__index">4.</span>
                        <span className="warehouse-entry-row__label">opis</span>
                        <textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            className="form-control"
                        />
                    </div>
                </div>

                <div className="warehouse-entry-actions">
                    <Link
                        href="/deliveries/history"
                        className="btn btn-default btn-xs"
                    >
                        anuluj
                    </Link>
                    <button
                        type="button"
                        className="btn btn-default btn-xs"
                        onClick={() => void saveDraftAndExit()}
                        disabled={
                            createDelivery.isPending ||
                            receiveDelivery.isPending
                        }
                    >
                        {createDelivery.isPending
                            ? 'zapisywanie...'
                            : 'zapisz jako roboczą'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => void submit()}
                        disabled={
                            createDelivery.isPending ||
                            receiveDelivery.isPending
                        }
                    >
                        {createDelivery.isPending || receiveDelivery.isPending
                            ? 'zapisywanie...'
                            : 'wprowadź dostawę'}
                    </button>
                    <span className="warehouse-entry-total">
                        do zapłaty łącznie {totalGross.toFixed(2)} zł brutto
                    </span>
                </div>
                {formError ? (
                    <p className="warehouse-validation-error">{formError}</p>
                ) : null}
            </div>
        </WarehouseLayout>
    );
}
