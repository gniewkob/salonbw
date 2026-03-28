'use client';

import { useState, useMemo } from 'react';
import { useStockAlerts, useStockSummary } from '@/hooks/useStockAlerts';
import type {
    StockAlertPriority,
    ProductType,
    ReorderSuggestion,
} from '@/types';

const PRIORITY_COLORS: Record<StockAlertPriority, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
};

const PRIORITY_LABELS: Record<StockAlertPriority, string> = {
    critical: 'Krytyczny',
    high: 'Wysoki',
    medium: 'Średni',
    low: 'Niski',
};

interface Props {
    onCreateDelivery?: (suggestions: ReorderSuggestion[]) => void;
}

export default function StockAlertsTab({ onCreateDelivery }: Props) {
    const [filterType, setFilterType] = useState<ProductType | 'all'>('all');
    const [filterPriority, setFilterPriority] = useState<
        StockAlertPriority | 'all'
    >('all');

    const { data: alerts, isLoading: alertsLoading } = useStockAlerts({
        productType: filterType === 'all' ? undefined : filterType,
    });
    const { data: summary, isLoading: summaryLoading } = useStockSummary();

    const isLoading = alertsLoading || summaryLoading;

    const filteredSuggestions = useMemo(() => {
        return (
            alerts?.reorderSuggestions.filter((s) =>
                filterPriority === 'all' ? true : s.priority === filterPriority,
            ) ?? []
        );
    }, [alerts?.reorderSuggestions, filterPriority]);

    const groupedBySupplier = useMemo(() => {
        return filteredSuggestions.reduce(
            (acc, suggestion) => {
                const key = suggestion.supplierId ?? 'unassigned';
                if (!acc[key]) {
                    acc[key] = {
                        supplierId: suggestion.supplierId,
                        supplierName:
                            suggestion.supplierName ?? 'Brak dostawcy',
                        suggestions: [],
                        totalCost: 0,
                    };
                }
                acc[key].suggestions.push(suggestion);
                acc[key].totalCost += suggestion.estimatedCost ?? 0;
                return acc;
            },
            {} as Record<
                string,
                {
                    supplierId: number | null;
                    supplierName: string;
                    suggestions: ReorderSuggestion[];
                    totalCost: number;
                }
            >,
        );
    }, [filteredSuggestions]);

    if (isLoading) {
        return (
            <div className="d-flex align-items-center justify-content-center py-5">
                <div className="rounded-circle h-8 w-8 border-bottom-2 border-teal-500"></div>
                <span className="ms-2 text-muted">Ładowanie alertów...</span>
            </div>
        );
    }

    return (
        <div className="gap-3">
            {/* Stock Summary Cards */}
            {summary && (
                <div className="-cols-2 gap-3">
                    <div className="bg-white rounded-3 shadow p-3">
                        <div className="fs-3 fw-bold text-dark">
                            {summary.totalProducts}
                        </div>
                        <div className="small text-muted">
                            Wszystkie produkty
                        </div>
                    </div>
                    <div className="bg-white rounded-3 shadow p-3">
                        <div className="fs-3 fw-bold text-success">
                            {summary.healthyStockCount}
                        </div>
                        <div className="small text-muted">Prawidłowy stan</div>
                    </div>
                    <div className="bg-white rounded-3 shadow p-3">
                        <div className="fs-3 fw-bold text-warning">
                            {summary.lowStockCount}
                        </div>
                        <div className="small text-muted">Niski stan</div>
                    </div>
                    <div className="bg-white rounded-3 shadow p-3">
                        <div className="fs-3 fw-bold text-danger">
                            {summary.outOfStockCount}
                        </div>
                        <div className="small text-muted">Brak na stanie</div>
                    </div>
                    <div className="bg-white rounded-3 shadow p-3">
                        <div className="fs-3 fw-bold text-dark">
                            {summary.trackedProducts}
                        </div>
                        <div className="small text-muted">
                            Śledzone produkty
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts Summary */}
            {alerts?.summary && (
                <div className="bg-white rounded-3 shadow p-4">
                    <h3 className="fs-5 fw-semibold text-dark mb-3">
                        Podsumowanie alertów
                    </h3>
                    <div className="-cols-2 gap-3 mb-3">
                        <div
                            className={`rounded-3 p-2 border ${PRIORITY_COLORS.critical}`}
                        >
                            <div className="fs-3 fw-bold">
                                {alerts.summary.criticalCount}
                            </div>
                            <div className="small">Krytyczne</div>
                        </div>
                        <div
                            className={`rounded-3 p-2 border ${PRIORITY_COLORS.high}`}
                        >
                            <div className="fs-3 fw-bold">
                                {alerts.summary.highCount}
                            </div>
                            <div className="small">Wysokie</div>
                        </div>
                        <div
                            className={`rounded-3 p-2 border ${PRIORITY_COLORS.medium}`}
                        >
                            <div className="fs-3 fw-bold">
                                {alerts.summary.mediumCount}
                            </div>
                            <div className="small">Średnie</div>
                        </div>
                        <div
                            className={`rounded-3 p-2 border ${PRIORITY_COLORS.low}`}
                        >
                            <div className="fs-3 fw-bold">
                                {alerts.summary.lowCount}
                            </div>
                            <div className="small">Niskie</div>
                        </div>
                    </div>
                    {alerts.summary.estimatedTotalReorderCost && (
                        <p className="small text-muted">
                            Szacowany koszt uzupełnienia:{' '}
                            <span className="fw-semibold">
                                {alerts.summary.estimatedTotalReorderCost.toFixed(
                                    2,
                                )}{' '}
                                PLN
                            </span>
                        </p>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-3 shadow p-3 d-flex flex-wrap gap-3">
                <div>
                    <label
                        htmlFor="filter-type"
                        className="d-block small fw-medium text-body mb-1"
                    >
                        Typ produktu
                    </label>
                    <select
                        id="filter-type"
                        value={filterType}
                        onChange={(e) =>
                            setFilterType(e.target.value as ProductType | 'all')
                        }
                        className="rounded-3 border-secondary border-opacity-50 shadow-sm"
                    >
                        <option value="all">Wszystkie</option>
                        <option value="product">Produkty</option>
                        <option value="supply">Materiały</option>
                        <option value="universal">Uniwersalne</option>
                    </select>
                </div>
                <div>
                    <label
                        htmlFor="filter-priority"
                        className="d-block small fw-medium text-body mb-1"
                    >
                        Priorytet
                    </label>
                    <select
                        id="filter-priority"
                        value={filterPriority}
                        onChange={(e) =>
                            setFilterPriority(
                                e.target.value as StockAlertPriority | 'all',
                            )
                        }
                        className="rounded-3 border-secondary border-opacity-50 shadow-sm"
                    >
                        <option value="all">Wszystkie</option>
                        <option value="critical">Krytyczny</option>
                        <option value="high">Wysoki</option>
                        <option value="medium">Średni</option>
                        <option value="low">Niski</option>
                    </select>
                </div>
            </div>

            {/* Reorder Suggestions grouped by Supplier */}
            {Object.values(groupedBySupplier).length > 0 ? (
                <div className="gap-3">
                    {Object.values(groupedBySupplier).map((group) => (
                        <div
                            key={group.supplierId ?? 'no-supplier'}
                            className="bg-white rounded-3 shadow overflow-d-none"
                        >
                            <div className="px-3 py-2 bg-light border-bottom d-flex align-items-center justify-content-between">
                                <div>
                                    <h4 className="fw-semibold text-dark">
                                        {group.supplierName}
                                    </h4>
                                    <p className="small text-muted">
                                        {group.suggestions.length} produktów do
                                        zamówienia
                                        {group.totalCost > 0 && (
                                            <span className="ms-2">
                                                • Szacowany koszt:{' '}
                                                <span className="fw-medium">
                                                    {group.totalCost.toFixed(2)}{' '}
                                                    PLN
                                                </span>
                                            </span>
                                        )}
                                    </p>
                                </div>
                                {onCreateDelivery && group.supplierId && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onCreateDelivery(group.suggestions)
                                        }
                                        className="px-3 py-1 small bg-teal-600 text-white rounded-3"
                                    >
                                        Utwórz dostawę
                                    </button>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-100">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                                                Produkt
                                            </th>
                                            <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                                                SKU
                                            </th>
                                            <th className="px-3 py-2 text-center small fw-medium text-muted text-uppercase">
                                                Stan
                                            </th>
                                            <th className="px-3 py-2 text-center small fw-medium text-muted text-uppercase">
                                                Min.
                                            </th>
                                            <th className="px-3 py-2 text-center small fw-medium text-muted text-uppercase">
                                                Do zamówienia
                                            </th>
                                            <th className="px-3 py-2 text-end small fw-medium text-muted text-uppercase">
                                                Koszt
                                            </th>
                                            <th className="px-3 py-2 text-center small fw-medium text-muted text-uppercase">
                                                Priorytet
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {group.suggestions.map((suggestion) => (
                                            <tr
                                                key={suggestion.productId}
                                                className=""
                                            >
                                                <td className="px-3 py-2 text-nowrap">
                                                    <div className="fw-medium text-dark">
                                                        {suggestion.productName}
                                                    </div>
                                                    {suggestion.brand && (
                                                        <div className="small text-muted">
                                                            {suggestion.brand}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-nowrap small text-muted">
                                                    {suggestion.sku ?? '-'}
                                                </td>
                                                <td className="px-3 py-2 text-nowrap text-center">
                                                    <span
                                                        className={`fw-semibold ${
                                                            suggestion.currentStock ===
                                                            0
                                                                ? 'text-danger'
                                                                : 'text-warning'
                                                        }`}
                                                    >
                                                        {
                                                            suggestion.currentStock
                                                        }
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-nowrap text-center text-muted">
                                                    {suggestion.minQuantity}
                                                </td>
                                                <td className="px-3 py-2 text-nowrap text-center">
                                                    <span className="fw-semibold text-teal-600">
                                                        {
                                                            suggestion.suggestedOrderQuantity
                                                        }
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-nowrap text-end text-muted">
                                                    {suggestion.estimatedCost
                                                        ? `${suggestion.estimatedCost.toFixed(2)} PLN`
                                                        : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-nowrap text-center">
                                                    <span
                                                        className={`px-2 py-1 small rounded-circle border ${
                                                            PRIORITY_COLORS[
                                                                suggestion
                                                                    .priority
                                                            ]
                                                        }`}
                                                    >
                                                        {
                                                            PRIORITY_LABELS[
                                                                suggestion
                                                                    .priority
                                                            ]
                                                        }
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3 shadow p-5 text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-success mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <h3 className="fs-5 fw-medium text-dark mb-2">
                        Brak produktów do uzupełnienia
                    </h3>
                    <p className="text-muted">
                        Wszystkie śledzone produkty mają wystarczający stan
                        magazynowy.
                    </p>
                </div>
            )}
        </div>
    );
}
