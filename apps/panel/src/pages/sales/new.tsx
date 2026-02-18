'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useWarehouseProducts,
    useCreateWarehouseSale,
} from '@/hooks/useWarehouseViews';
import { useEmployees } from '@/hooks/useEmployees';

interface SaleLineForm {
    productId: string;
    quantity: string;
    unitPrice: string;
    discount: string;
    unit: string;
    vatRate: string;
}

const formatCurrency = (value: number) =>
    `${new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)} zł`;

export default function WarehouseSaleCreatePage() {
    const router = useRouter();
    const { data: products = [] } = useWarehouseProducts({
        includeInactive: false,
    });
    const { data: employees = [] } = useEmployees();
    const createMutation = useCreateWarehouseSale();

    const [lines, setLines] = useState<SaleLineForm[]>([
        {
            productId: '',
            quantity: '1',
            unitPrice: '',
            discount: '0',
            unit: 'op.',
            vatRate: '23',
        },
    ]);
    const [clientName, setClientName] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [soldAt, setSoldAt] = useState(new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const totalGross = useMemo(() => {
        return lines.reduce((sum, line) => {
            const price = Number(line.unitPrice || 0);
            const qty = Number(line.quantity || 0);
            const discount = Number(line.discount || 0);
            const rowGross = Math.max(0, price * qty - discount);
            return sum + rowGross;
        }, 0);
    }, [lines]);

    const totalDiscount = useMemo(() => {
        return lines.reduce((sum, line) => {
            const price = Number(line.unitPrice || 0);
            const qty = Number(line.quantity || 0);
            const maxDiscount = Math.max(0, price * qty);
            const discount = Math.max(
                0,
                Math.min(maxDiscount, Number(line.discount || 0)),
            );
            return sum + discount;
        }, 0);
    }, [lines]);

    const totalNet = useMemo(() => {
        return lines.reduce((sum, line) => {
            const priceGross = Number(line.unitPrice || 0);
            const qty = Number(line.quantity || 0);
            const vatRate = Number(line.vatRate || 23);
            const discount = Number(line.discount || 0);
            const gross = Math.max(0, priceGross * qty - discount);
            return sum + gross / (1 + vatRate / 100);
        }, 0);
    }, [lines]);

    const totalVat = useMemo(
        () => Math.max(0, totalGross - totalNet),
        [totalGross, totalNet],
    );

    const addLine = () => {
        setLines((current) => [
            ...current,
            {
                productId: '',
                quantity: '1',
                unitPrice: '',
                discount: '0',
                unit: 'op.',
                vatRate: '23',
            },
        ]);
    };

    const updateLine = (index: number, next: Partial<SaleLineForm>) => {
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
        setFormError(null);
        const payloadItems = lines
            .filter((line) => line.productId)
            .map((line) => ({
                productId: Number(line.productId),
                quantity: Number(line.quantity || 0),
                unitPrice: Number(line.unitPrice || 0),
                discount: Number(line.discount || 0),
            }))
            .filter((item) => item.quantity > 0);

        if (payloadItems.length === 0) {
            setFormError(
                'Dodaj co najmniej jedną pozycję sprzedaży z produktem i ilością większą od 0.',
            );
            return;
        }

        const created = await createMutation.mutateAsync({
            soldAt: soldAt
                ? new Date(`${soldAt}T12:00:00`).toISOString()
                : undefined,
            clientName: clientName || undefined,
            employeeId: employeeId ? Number(employeeId) : undefined,
            paymentMethod,
            note: note || undefined,
            items: payloadItems,
        });

        await router.push(`/sales/history/${created.id}`);
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Dodaj sprzedaż | SalonBW"
            heading="Magazyn / Dodaj sprzedaż"
            activeTab="sales"
            actions={
                <Link href="/sales/history" className="btn btn-default btn-xs">
                    historia sprzedaży
                </Link>
            }
        >
            <div className="warehouse-new-screen">
                <div className="products-table-wrap warehouse-lines-table">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>nazwa</th>
                                <th>jednostka</th>
                                <th>ilość</th>
                                <th>cena op. (brutto)</th>
                                <th>rabat</th>
                                <th>VAT</th>
                                <th>wartość (brutto)</th>
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
                                                const value =
                                                    event.target.value;
                                                const product = products.find(
                                                    (item) =>
                                                        String(item.id) ===
                                                        value,
                                                );
                                                updateLine(index, {
                                                    productId: value,
                                                    unitPrice: product
                                                        ? String(
                                                              product.unitPrice,
                                                          )
                                                        : line.unitPrice,
                                                    unit:
                                                        product?.unit || 'op.',
                                                    vatRate: String(
                                                        product?.vatRate ?? 23,
                                                    ),
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
                                            value={line.unitPrice}
                                            onChange={(event) =>
                                                updateLine(index, {
                                                    unitPrice:
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
                                            value={line.discount}
                                            onChange={(event) =>
                                                updateLine(index, {
                                                    discount:
                                                        event.target.value,
                                                })
                                            }
                                            className="form-control"
                                        />
                                    </td>
                                    <td>{line.vatRate}%</td>
                                    <td>
                                        {formatCurrency(
                                            Math.max(
                                                0,
                                                Number(line.unitPrice || 0) *
                                                    Number(line.quantity || 0) -
                                                    Number(line.discount || 0),
                                            ),
                                        )}
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

                <div className="warehouse-form-card">
                    <div className="warehouse-form-grid">
                        <label>
                            <span>Klient</span>
                            <div className="warehouse-inline-field">
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={(event) =>
                                        setClientName(event.target.value)
                                    }
                                    className="form-control"
                                    placeholder="wpisz nazwisko lub numer telefonu"
                                />
                                <Link
                                    href="/customers/new"
                                    className="btn btn-default btn-xs"
                                >
                                    nowy klient
                                </Link>
                            </div>
                        </label>
                        <label>
                            <span>Polecający pracownik</span>
                            <select
                                value={employeeId}
                                onChange={(event) =>
                                    setEmployeeId(event.target.value)
                                }
                                className="versum-select"
                            >
                                <option value="">
                                    wpisz nazwę lub wybierz z listy
                                </option>
                                {employees?.map((employee) => (
                                    <option
                                        key={employee.id}
                                        value={employee.id}
                                    >
                                        {employee.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <span>Data sprzedaży</span>
                            <input
                                type="date"
                                value={soldAt}
                                onChange={(event) =>
                                    setSoldAt(event.target.value)
                                }
                                className="form-control"
                            />
                        </label>
                        <label>
                            <span>Płatność</span>
                            <select
                                value={paymentMethod}
                                onChange={(event) =>
                                    setPaymentMethod(event.target.value)
                                }
                                className="versum-select"
                            >
                                <option value="cash">gotówka</option>
                                <option value="card">karta</option>
                                <option value="transfer">przelew</option>
                            </select>
                        </label>
                        <label>
                            <span>Wpłata klienta</span>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={amountPaid}
                                onChange={(event) =>
                                    setAmountPaid(event.target.value)
                                }
                                className="form-control"
                            />
                        </label>
                        <label className="warehouse-full">
                            <span>Opis</span>
                            <textarea
                                value={note}
                                onChange={(event) =>
                                    setNote(event.target.value)
                                }
                                className="form-control"
                            />
                        </label>
                    </div>
                </div>

                <div className="warehouse-summary">
                    <div className="warehouse-summary-value">
                        Wartość sprzedaży: {formatCurrency(totalGross)}
                    </div>
                    <div className="warehouse-summary-meta">
                        rabat: {formatCurrency(totalDiscount)}
                    </div>
                    <div className="warehouse-summary-meta">
                        netto: {formatCurrency(totalNet)} (VAT:{' '}
                        {formatCurrency(totalVat)})
                    </div>
                    <div className="warehouse-summary-meta">
                        do zapłaty: {formatCurrency(totalGross)}
                    </div>
                    <div className="warehouse-summary-meta">
                        reszta:{' '}
                        {formatCurrency(
                            Math.max(0, Number(amountPaid || 0) - totalGross),
                        )}
                    </div>
                    <div className="warehouse-actions-row">
                        <Link
                            href="/sales/history"
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
                                : 'wprowadź sprzedaż'}
                        </button>
                    </div>
                </div>
            </div>
            {formError ? (
                <p className="warehouse-validation-error">{formError}</p>
            ) : null}
        </WarehouseLayout>
    );
}
