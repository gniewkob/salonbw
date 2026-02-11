'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseProducts } from '@/hooks/useWarehouseViews';
import { useCreateDelivery, useSuppliers } from '@/hooks/useWarehouse';

interface DeliveryLineForm {
    productId: string;
    quantity: string;
    unitCost: string;
}

export default function WarehouseDeliveryCreatePage() {
    const router = useRouter();
    const { data: products = [] } = useWarehouseProducts({
        includeInactive: false,
    });
    const { data: suppliers = [] } = useSuppliers();
    const createDelivery = useCreateDelivery();

    const [supplierId, setSupplierId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [deliveryDate, setDeliveryDate] = useState(
        new Date().toISOString().slice(0, 10),
    );
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<DeliveryLineForm[]>([
        { productId: '', quantity: '1', unitCost: '0' },
    ]);

    const addLine = () => {
        setLines((current) => [
            ...current,
            { productId: '', quantity: '1', unitCost: '0' },
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

    const submit = async () => {
        const items = lines
            .filter((line) => line.productId)
            .map((line) => ({
                productId: Number(line.productId),
                quantity: Number(line.quantity || 0),
                unitCost: Number(line.unitCost || 0),
            }))
            .filter((line) => line.quantity > 0);
        if (items.length === 0) return;

        await createDelivery.mutateAsync({
            supplierId: supplierId ? Number(supplierId) : undefined,
            deliveryDate,
            invoiceNumber: invoiceNumber || undefined,
            notes: notes || undefined,
            items,
        });

        await router.push('/deliveries/history');
    };

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
            <div className="products-table-wrap">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>nazwa</th>
                            <th>ilość</th>
                            <th>cena/op. (netto)</th>
                            <th>usuń</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line, index) => (
                            <tr key={`${index}-${line.productId}`}>
                                <td>
                                    <select
                                        value={line.productId}
                                        onChange={(event) =>
                                            updateLine(index, {
                                                productId: event.target.value,
                                            })
                                        }
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
                                <td>
                                    <input
                                        type="number"
                                        min={1}
                                        value={line.quantity}
                                        onChange={(event) =>
                                            updateLine(index, {
                                                quantity: event.target.value,
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
                                                unitCost: event.target.value,
                                            })
                                        }
                                        className="form-control"
                                    />
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
            </div>

            <div className="warehouse-form-grid">
                <label>
                    <span>Dostawca</span>
                    <select
                        value={supplierId}
                        onChange={(event) => setSupplierId(event.target.value)}
                        className="versum-select"
                    >
                        <option value="">
                            wpisz nazwę lub wybierz z listy
                        </option>
                        {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                                {supplier.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span>Numer faktury</span>
                    <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(event) =>
                            setInvoiceNumber(event.target.value)
                        }
                        className="form-control"
                    />
                </label>
                <label>
                    <span>Wystawiono</span>
                    <input
                        type="date"
                        value={deliveryDate}
                        onChange={(event) =>
                            setDeliveryDate(event.target.value)
                        }
                        className="form-control"
                    />
                </label>
                <label className="warehouse-full">
                    <span>Uwagi</span>
                    <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        className="form-control"
                    />
                </label>
            </div>

            <div className="warehouse-actions-row">
                <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => void submit()}
                    disabled={createDelivery.isPending}
                >
                    {createDelivery.isPending
                        ? 'zapisywanie...'
                        : 'wprowadź dostawę'}
                </button>
            </div>
        </WarehouseLayout>
    );
}
