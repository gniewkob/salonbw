'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseSale } from '@/hooks/useWarehouseViews';

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
                                    <th>wartość brutto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items.map((item, index) => (
                                    <tr key={item.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <Link
                                                href={`/products/${item.productId ?? ''}`}
                                                className="products-link"
                                            >
                                                {item.productName}
                                            </Link>
                                        </td>
                                        <td>
                                            {Number(item.unitPriceNet).toFixed(
                                                2,
                                            )}{' '}
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
                                            {Number(item.totalGross).toFixed(2)}{' '}
                                            zł
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="warehouse-meta-grid">
                        <div>klient: {sale.clientName ?? '-'}</div>
                        <div>pracownik: {sale.employee?.name ?? '-'}</div>
                        <div>
                            data sprzedaży:{' '}
                            {new Date(sale.soldAt).toLocaleDateString('pl-PL')}
                        </div>
                        <div>płatność: {sale.paymentMethod ?? '-'}</div>
                        <div>
                            wartość netto:{' '}
                            {Number(sale.totalNet ?? 0).toFixed(2)} zł
                        </div>
                        <div>
                            wartość brutto:{' '}
                            {Number(sale.totalGross ?? 0).toFixed(2)} zł
                        </div>
                    </div>
                </div>
            )}
        </WarehouseLayout>
    );
}
