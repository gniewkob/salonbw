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
    const [lines, setLines] = useState<OrderLineForm[]>([
        { productId: '', productName: '', quantity: '1' },
    ]);

    const addLine = () => {
        setLines((current) => [
            ...current,
            { productId: '', productName: '', quantity: '1' },
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
        const items = lines
            .map((line) => ({
                productId: line.productId ? Number(line.productId) : undefined,
                productName: line.productName || undefined,
                quantity: Number(line.quantity || 0),
            }))
            .filter(
                (line) =>
                    line.quantity > 0 && (line.productId || line.productName),
            );

        if (items.length === 0) return;

        await createMutation.mutateAsync({
            supplierId: supplierId ? Number(supplierId) : undefined,
            notes: notes || undefined,
            items,
        });

        await router.push('/orders/history');
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
            </div>

            <h2 className="warehouse-section-title">Pozycje zamówienia</h2>
            <div className="products-table-wrap">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>nazwa</th>
                            <th>ilość</th>
                            <th>usuń</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line, index) => (
                            <tr key={`${index}-${line.productId}`}>
                                <td>
                                    <select
                                        value={line.productId}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            const product = products.find(
                                                (item) =>
                                                    String(item.id) === value,
                                            );
                                            updateLine(index, {
                                                productId: value,
                                                productName:
                                                    product?.name ?? '',
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
                                                productName: event.target.value,
                                            })
                                        }
                                        className="form-control"
                                        placeholder="nazwa alternatywna"
                                    />
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
            </div>

            <label className="warehouse-full">
                <span>Uwagi</span>
                <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="form-control"
                />
            </label>

            <div className="warehouse-actions-row">
                <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => void submit()}
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending
                        ? 'zapisywanie...'
                        : 'wyślij zamówienie'}
                </button>
            </div>
        </WarehouseLayout>
    );
}
