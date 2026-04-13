'use client';

import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useDeliveries, useSuppliers } from '@/hooks/useWarehouse';
import { useWarehouseOrders } from '@/hooks/useWarehouseViews';
import Link from 'next/link';
import { formatPanelCurrency } from '@/utils/formatters';

export default function AdminWarehouseDashboardPage() {
    const { data: deliveries = [], isLoading: loadingDeliveries } = useDeliveries();
    const { data: orders = [], isLoading: loadingOrders } = useWarehouseOrders();
    const { data: suppliers = [] } = useSuppliers();

    const pendingDeliveries = deliveries.filter(d => d.status === 'pending');
    const draftOrders = orders.filter(o => o.status === 'draft');

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Dashboard | SalonBW"
            heading="Magazyn / Podsumowanie"
            activeTab="products"
        >
            <div className="row">
                {/* Stats Widgets */}
                <div className="col-md-4 mb-4">
                    <div className="card h-100 border-0 shadow-sm rounded-3">
                        <div className="card-body">
                            <h6 className="text-muted text-uppercase small fw-bold mb-3">Dostawcy</h6>
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="h3 mb-0">{suppliers.length}</span>
                                <Link href="/suppliers" className="btn btn-sm btn-outline-teal rounded-pill">
                                    Zarządzaj
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-4">
                    <div className="card h-100 border-0 shadow-sm rounded-3 bg-warning bg-opacity-10 border-warning border-opacity-25">
                        <div className="card-body">
                            <h6 className="text-warning text-uppercase small fw-bold mb-3">Oczekujące Dostawy</h6>
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="h3 mb-0 text-warning">{pendingDeliveries.length}</span>
                                <Link href="/deliveries/history?status=pending" className="btn btn-sm btn-warning rounded-pill">
                                    Zobacz
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-4">
                    <div className="card h-100 border-0 shadow-sm rounded-3 bg-info bg-opacity-10 border-info border-opacity-25">
                        <div className="card-body">
                            <h6 className="text-info text-uppercase small fw-bold mb-3">Szkice Zamówień</h6>
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="h3 mb-0 text-info">{draftOrders.length}</span>
                                <Link href="/orders/history?status=draft" className="btn btn-sm btn-info rounded-pill">
                                    Dokończ
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mt-2">
                {/* Recent Deliveries */}
                <div className="col-lg-6 mb-4">
                    <div className="card border-0 shadow-sm rounded-3">
                        <div className="card-header bg-white border-bottom-0 pt-4 px-4">
                            <h5 className="mb-0">Ostatnie Dostawy</h5>
                        </div>
                        <div className="card-body px-0">
                            {loadingDeliveries ? (
                                <p className="px-4 text-muted small">Ładowanie...</p>
                            ) : deliveries.length === 0 ? (
                                <p className="px-4 text-muted small">Brak zarejestrowanych dostaw.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light text-muted small">
                                            <tr>
                                                <th className="px-4 border-0">DATA</th>
                                                <th className="border-0">DOSTAWCA</th>
                                                <th className="px-4 text-end border-0">WARTOŚĆ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {deliveries.slice(0, 5).map(delivery => (
                                                <tr key={delivery.id}>
                                                    <td className="px-4 small">
                                                        {new Date(delivery.deliveryDate || delivery.createdAt).toLocaleDateString('pl-PL')}
                                                    </td>
                                                    <td className="small fw-medium">{delivery.supplier?.name || '-'}</td>
                                                    <td className="px-4 text-end small">
                                                        {formatPanelCurrency(delivery.totalCost)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="px-4 pt-3 border-top mt-3 text-center">
                                <Link href="/deliveries/history" className="text-teal-600 small fw-bold text-decoration-none">
                                    Pełna historia dostaw &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions / Shortcuts */}
                <div className="col-lg-6 mb-4">
                    <div className="card border-0 shadow-sm rounded-3">
                        <div className="card-header bg-white border-bottom-0 pt-4 px-4">
                            <h5 className="mb-0">Szybkie skróty</h5>
                        </div>
                        <div className="card-body">
                            <div className="list-group list-group-flush">
                                <Link href="/products" className="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center">
                                    <div className="bg-light rounded-circle p-2 me-3">
                                        <i className="sprite-stock_products_on" style={{ display: 'block', width: '20px', height: '20px' }}></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold">Lista Produktów</div>
                                        <div className="small text-muted">Zarządzaj asortymentem i stanami</div>
                                    </div>
                                </Link>
                                <Link href="/inventory" className="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center">
                                    <div className="bg-light rounded-circle p-2 me-3">
                                        <i className="sprite-stock_stocktaking" style={{ display: 'block', width: '20px', height: '20px' }}></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold">Inwentaryzacja</div>
                                        <div className="small text-muted">Sprawdź i wyrównaj stany magazynowe</div>
                                    </div>
                                </Link>
                                <Link href="/orders/new" className="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center">
                                    <div className="bg-light rounded-circle p-2 me-3">
                                        <i className="sprite-stock_new_order" style={{ display: 'block', width: '20px', height: '20px' }}></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold">Nowe Zamówienie</div>
                                        <div className="small text-muted">Złóż zamówienie u dostawcy</div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </WarehouseLayout>
    );
}
