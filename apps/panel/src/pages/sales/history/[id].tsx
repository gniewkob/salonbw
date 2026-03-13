'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useCorrectWarehouseSale,
    useRefundWarehouseSale,
    useVoidWarehouseSale,
    useWarehouseSale,
} from '@/hooks/useWarehouseViews';
import { useToast } from '@/contexts/ToastContext';

function formatDate(value?: string | null) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pl-PL');
}

function paymentMethodLabel(value?: string | null) {
    switch (value) {
        case 'cash':
            return 'gotówka';
        case 'card':
            return 'karta';
        case 'transfer':
            return 'przelew';
        default:
            return value || '-';
    }
}

function saleKindLabel(kind?: string | null) {
    switch (kind) {
        case 'void':
            return 'void';
        case 'refund':
            return 'zwrot';
        case 'correction':
            return 'korekta';
        default:
            return 'sprzedaż';
    }
}

function saleStatusLabel(status?: string | null) {
    switch (status) {
        case 'adjusted':
            return 'skorygowana';
        case 'voided':
            return 'wyvoidowana';
        case 'refunded':
            return 'zwrócona';
        default:
            return 'aktywna';
    }
}

export default function WarehouseSaleDetailsPage() {
    const router = useRouter();
    const toast = useToast();
    const saleId = useMemo(() => {
        const value = router.query.id;
        const parsed = Number(Array.isArray(value) ? value[0] : value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }, [router.query.id]);
    const { data: sale, isLoading } = useWarehouseSale(saleId);
    const voidMutation = useVoidWarehouseSale();
    const refundMutation = useRefundWarehouseSale();
    const correctionMutation = useCorrectWarehouseSale();
    const [reason, setReason] = useState('');
    const [restock, setRestock] = useState(true);
    const [reverseCommission, setReverseCommission] = useState(true);
    const [quantities, setQuantities] = useState<Record<number, string>>({});

    const positiveItems = useMemo(
        () => sale?.items.filter((item) => item.quantity > 0) ?? [],
        [sale],
    );

    const canReverse = Boolean(
        sale &&
            !sale.sourceSaleId &&
            sale.kind === 'sale' &&
            sale.status !== 'voided',
    );

    const actionPayload = useMemo(
        () => ({
            reason: reason.trim() || undefined,
            restock,
            reverseCommission,
            items: positiveItems
                .map((item) => ({
                    saleItemId: item.id,
                    quantity: Number(quantities[item.id] || item.quantity),
                }))
                .filter(
                    (item) =>
                        Number.isFinite(item.quantity) && item.quantity > 0,
                ),
        }),
        [positiveItems, quantities, reason, restock, reverseCommission],
    );

    const handleAction = async (action: 'void' | 'refund' | 'correction') => {
        if (!saleId) return;
        try {
            const response =
                action === 'void'
                    ? await voidMutation.mutateAsync({
                          saleId,
                          payload: {
                              reason: reason.trim() || undefined,
                              restock,
                              reverseCommission,
                          },
                      })
                    : action === 'refund'
                      ? await refundMutation.mutateAsync({
                            saleId,
                            payload: actionPayload,
                        })
                      : await correctionMutation.mutateAsync({
                            saleId,
                            payload: actionPayload,
                        });

            toast.success(`Zapisano akcję: ${saleKindLabel(response.kind)}`);
            await router.push(`/sales/history/${response.id}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Błąd akcji');
        }
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Historia sprzedaży | SalonBW"
            heading={`Magazyn / Historia sprzedaży / ${sale?.saleNumber ?? ''}`}
            activeTab="sales"
            actions={
                <div className="btn-group">
                    <Link
                        href="/sales/history"
                        className="btn btn-default btn-xs"
                    >
                        historia sprzedaży
                    </Link>
                    <Link href="/sales/new" className="btn btn-primary btn-xs">
                        dodaj sprzedaż
                    </Link>
                    <button type="button" className="btn btn-default btn-xs">
                        drukuj
                    </button>
                </div>
            }
        >
            {isLoading || !sale ? (
                <p className="products-empty">
                    Ładowanie szczegółów sprzedaży...
                </p>
            ) : (
                <div>
                    <h2 className="warehouse-section-title">
                        Szczegóły sprzedaży
                    </h2>
                    <div className="warehouse-form-card">
                        <div className="warehouse-meta-grid">
                            <div>nr sprzedaży: {sale.saleNumber}</div>
                            <div>rodzaj: {saleKindLabel(sale.kind)}</div>
                            <div>status: {saleStatusLabel(sale.status)}</div>
                            <div>klient: {sale.clientName ?? '-'}</div>
                            <div>pracownik: {sale.employee?.name ?? '-'}</div>
                            <div>data sprzedaży: {formatDate(sale.soldAt)}</div>
                            <div>
                                płatność:{' '}
                                {paymentMethodLabel(sale.paymentMethod)}
                            </div>
                            <div>utworzył: {sale.createdBy?.name ?? '-'}</div>
                            <div>
                                data utworzenia: {formatDate(sale.createdAt)}
                            </div>
                            <div>
                                ostatnia zmiana: {formatDate(sale.updatedAt)}
                            </div>
                            <div>
                                sprzedaż źródłowa:{' '}
                                {sale.sourceSaleId ? (
                                    <Link
                                        href={`/sales/history/${sale.sourceSaleId}`}
                                        className="products-link"
                                    >
                                        #{sale.sourceSaleId}
                                    </Link>
                                ) : (
                                    '-'
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="products-table-wrap">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>lp</th>
                                    <th>nazwa</th>
                                    <th>cena netto</th>
                                    <th>cena brutto</th>
                                    <th>ilość</th>
                                    <th>VAT</th>
                                    <th>rabat</th>
                                    <th>wartość brutto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="products-empty"
                                        >
                                            Brak pozycji sprzedaży.
                                        </td>
                                    </tr>
                                ) : (
                                    sale.items.map((item, index) => (
                                        <tr key={item.id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                {item.productId ? (
                                                    <Link
                                                        href={`/products/${item.productId}`}
                                                        className="products-link"
                                                    >
                                                        {item.productName}
                                                    </Link>
                                                ) : (
                                                    item.productName
                                                )}
                                            </td>
                                            <td>
                                                {Number(
                                                    item.unitPriceNet,
                                                ).toFixed(2)}{' '}
                                                zł
                                            </td>
                                            <td>
                                                {Number(
                                                    item.unitPriceGross,
                                                ).toFixed(2)}{' '}
                                                zł
                                            </td>
                                            <td>
                                                {item.quantity} {item.unit}
                                            </td>
                                            <td>{item.vatRate}%</td>
                                            <td>
                                                {Number(
                                                    item.discountGross ?? 0,
                                                ).toFixed(2)}{' '}
                                                zł
                                            </td>
                                            <td>
                                                {Number(
                                                    item.totalGross,
                                                ).toFixed(2)}{' '}
                                                zł
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="warehouse-summary">
                        <p className="warehouse-summary-meta">
                            wartość netto:{' '}
                            {Number(sale.totalNet ?? 0).toFixed(2)} zł
                        </p>
                        <p className="warehouse-summary-meta">
                            rabat: {Number(sale.discountGross ?? 0).toFixed(2)}{' '}
                            zł
                        </p>
                        <p className="warehouse-summary-value">
                            do zapłaty:{' '}
                            {Number(sale.totalGross ?? 0).toFixed(2)} zł
                        </p>
                    </div>
                    <div className="warehouse-form-card">
                        <p className="warehouse-summary-meta">
                            uwagi: {sale.notes || '-'}
                        </p>
                        <p className="warehouse-summary-meta">
                            powód korekty: {sale.reversalReason || '-'}
                        </p>
                    </div>

                    {canReverse && (
                        <div className="warehouse-form-card">
                            <h3 className="warehouse-section-title">
                                Akcje sprzedaży
                            </h3>
                            <div className="warehouse-meta-grid">
                                <label>
                                    Powód
                                    <textarea
                                        className="form-control"
                                        value={reason}
                                        onChange={(event) =>
                                            setReason(event.target.value)
                                        }
                                        placeholder="Powód void / zwrotu / korekty"
                                    />
                                </label>
                                <label className="warehouse-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={restock}
                                        onChange={(event) =>
                                            setRestock(event.target.checked)
                                        }
                                    />
                                    przywróć stan magazynowy
                                </label>
                                <label className="warehouse-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={reverseCommission}
                                        onChange={(event) =>
                                            setReverseCommission(
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    odwróć prowizję produktu
                                </label>
                            </div>

                            <div className="products-table-wrap">
                                <table className="products-table">
                                    <thead>
                                        <tr>
                                            <th>pozycja</th>
                                            <th>sprzedano</th>
                                            <th>ilość do akcji</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {positiveItems.map((item) => (
                                            <tr key={`reverse-${item.id}`}>
                                                <td>{item.productName}</td>
                                                <td>
                                                    {item.quantity} {item.unit}
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={item.quantity}
                                                        className="form-control"
                                                        value={
                                                            quantities[
                                                                item.id
                                                            ] ??
                                                            String(
                                                                item.quantity,
                                                            )
                                                        }
                                                        onChange={(event) =>
                                                            setQuantities(
                                                                (current) => ({
                                                                    ...current,
                                                                    [item.id]:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="btn-group">
                                <button
                                    type="button"
                                    className="btn btn-default btn-xs"
                                    disabled={voidMutation.isPending}
                                    onClick={() => void handleAction('void')}
                                >
                                    void całość
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-default btn-xs"
                                    disabled={refundMutation.isPending}
                                    onClick={() => void handleAction('refund')}
                                >
                                    zwrot pozycji
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-xs"
                                    disabled={correctionMutation.isPending}
                                    onClick={() =>
                                        void handleAction('correction')
                                    }
                                >
                                    korekta pozycji
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </WarehouseLayout>
    );
}
