'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useCreateWarehouseUsage,
    useWarehouseProducts,
} from '@/hooks/useWarehouseViews';
import { useEmployees } from '@/hooks/useEmployees';

interface UsageLineForm {
    productId: string;
    quantity: string;
}

export default function WarehouseUsageCreatePage() {
    const router = useRouter();
    const usageScope =
        router.query.scope === 'planned' ? 'planned' : 'completed';
    const isPlanned = usageScope === 'planned';
    const { data: products = [] } = useWarehouseProducts({
        includeInactive: false,
    });
    const { data: employees = [] } = useEmployees();
    const createMutation = useCreateWarehouseUsage();

    const [lines, setLines] = useState<UsageLineForm[]>([
        { productId: '', quantity: '1' },
    ]);
    const [clientName, setClientName] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [plannedFor, setPlannedFor] = useState(
        new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    );
    const [formError, setFormError] = useState<string | null>(null);

    const addLine = () => {
        setLines((current) => [...current, { productId: '', quantity: '1' }]);
    };

    const updateLine = (index: number, next: Partial<UsageLineForm>) => {
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
        const items = lines
            .filter((line) => line.productId)
            .map((line) => ({
                productId: Number(line.productId),
                quantity: Number(line.quantity || 0),
            }))
            .filter((line) => line.quantity > 0);

        if (items.length === 0) {
            setFormError(
                'Dodaj co najmniej jedną pozycję z produktem i ilością większą od 0.',
            );
            return;
        }
        if (isPlanned && !plannedFor) {
            setFormError('Ustaw datę i godzinę planowanego zużycia.');
            return;
        }

        await createMutation.mutateAsync({
            clientName: clientName || undefined,
            employeeId: employeeId ? Number(employeeId) : undefined,
            scope: usageScope,
            plannedFor: isPlanned
                ? new Date(plannedFor).toISOString()
                : undefined,
            items,
        });

        await router.push(isPlanned ? '/use/planned' : '/use/history');
    };

    return (
        <WarehouseLayout
            pageTitle={`Magazyn / ${isPlanned ? 'Dodaj planowane zużycie' : 'Dodaj zużycie'} | SalonBW`}
            heading={`Magazyn / ${isPlanned ? 'Dodaj planowane zużycie' : 'Dodaj zużycie'}`}
            activeTab="use"
            actions={
                <>
                    <Link
                        href="/use/history"
                        className="btn btn-default btn-xs"
                    >
                        historia zużycia
                    </Link>
                    <Link
                        href="/use/planned"
                        className="btn btn-default btn-xs"
                    >
                        planowane zużycie
                    </Link>
                </>
            }
        >
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
                    <span>Klient</span>
                    <input
                        type="text"
                        value={clientName}
                        onChange={(event) => setClientName(event.target.value)}
                        className="form-control"
                        placeholder="wpisz nazwisko lub imię klienta"
                    />
                </label>
                <label>
                    <span>Pracownik, który zużył materiał</span>
                    <select
                        value={employeeId}
                        onChange={(event) => setEmployeeId(event.target.value)}
                        className="versum-select"
                    >
                        <option value="">
                            wpisz nazwę lub wybierz z listy
                        </option>
                        {employees?.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                                {employee.name}
                            </option>
                        ))}
                    </select>
                </label>
                {isPlanned ? (
                    <label>
                        <span>Planowana data i godzina</span>
                        <input
                            type="datetime-local"
                            value={plannedFor}
                            onChange={(event) =>
                                setPlannedFor(event.target.value)
                            }
                            className="form-control"
                        />
                    </label>
                ) : null}
            </div>

            <div className="warehouse-actions-row">
                <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => void submit()}
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending
                        ? 'zapisywanie...'
                        : isPlanned
                          ? 'zapisz planowane zużycie'
                          : 'wprowadź zużycie'}
                </button>
            </div>
            {formError ? (
                <p className="warehouse-validation-error">{formError}</p>
            ) : null}
        </WarehouseLayout>
    );
}
