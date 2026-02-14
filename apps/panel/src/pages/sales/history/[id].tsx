'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseSale } from '@/hooks/useWarehouseViews';

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

export default function WarehouseSaleDetailsPage() {
    const router = useRouter();
    const saleId = useMemo(() => {
        const value = router.query.id;
        const parsed = Number(Array.isArray(value) ? value[0] : value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }, [router.query.id]);
    const { data: sale, isLoading } = useWarehouseSale(saleId);

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
                    </div>
                </div>
            )}
        </WarehouseLayout>
    );
}
