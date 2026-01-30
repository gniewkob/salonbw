'use client';

import { useState } from 'react';
import { useStockAlerts, useStockSummary } from '@/hooks/useStockAlerts';
import type { StockAlertPriority, ProductType, ReorderSuggestion } from '@/types';

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

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
    product: 'Produkt',
    supply: 'Materiał',
    universal: 'Uniwersalny',
};

interface Props {
    onCreateDelivery?: (suggestions: ReorderSuggestion[]) => void;
}

export default function StockAlertsTab({ onCreateDelivery }: Props) {
    const [filterType, setFilterType] = useState<ProductType | 'all'>('all');
    const [filterPriority, setFilterPriority] = useState<StockAlertPriority | 'all'>('all');

    const { data: alerts, isLoading: alertsLoading } = useStockAlerts({
        productType: filterType === 'all' ? undefined : filterType,
    });
    const { data: summary, isLoading: summaryLoading } = useStockSummary();

    const isLoading = alertsLoading || summaryLoading;

    // Filter suggestions by priority
    const filteredSuggestions =
        alerts?.reorderSuggestions.filter((s) =>
            filterPriority === 'all' ? true : s.priority === filterPriority,
        ) ?? [];

    // Group suggestions by supplier for bulk ordering
    const groupedBySupplier = filteredSuggestions.reduce(
        (acc, suggestion) => {
            const key = suggestion.supplierId ?? 0;
            if (!acc[key]) {
                acc[key] = {
                    supplierId: suggestion.supplierId,
                    supplierName: suggestion.supplierName ?? 'Brak dostawcy',
                    suggestions: [],
                    totalCost: 0,
                };
            }
            acc[key].suggestions.push(suggestion);
            acc[key].totalCost += suggestion.estimatedCost ?? 0;
            return acc;
        },
        {} as Record<
            number,
            {
                supplierId: number | null;
                supplierName: string;
                suggestions: ReorderSuggestion[];
                totalCost: number;
            }
        >,
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                <span className="ml-3 text-gray-600">Ładowanie alertów...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stock Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-gray-800">
                            {summary.totalProducts}
                        </div>
                        <div className="text-sm text-gray-500">Wszystkie produkty</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-green-600">
                            {summary.healthyStockCount}
                        </div>
                        <div className="text-sm text-gray-500">Prawidłowy stan</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-yellow-600">
                            {summary.lowStockCount}
                        </div>
                        <div className="text-sm text-gray-500">Niski stan</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-red-600">
                            {summary.outOfStockCount}
                        </div>
                        <div className="text-sm text-gray-500">Brak na stanie</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-gray-800">
                            {summary.trackedProducts}
                        </div>
                        <div className="text-sm text-gray-500">Śledzone produkty</div>
                    </div>
                </div>
            )}

            {/* Alerts Summary */}
            {alerts?.summary && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Podsumowanie alertów
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div
                            className={`rounded-lg p-3 border ${PRIORITY_COLORS.critical}`}
                        >
                            <div className="text-2xl font-bold">
                                {alerts.summary.criticalCount}
                            </div>
                            <div className="text-sm">Krytyczne</div>
                        </div>
                        <div className={`rounded-lg p-3 border ${PRIORITY_COLORS.high}`}>
                            <div className="text-2xl font-bold">
                                {alerts.summary.highCount}
                            </div>
                            <div className="text-sm">Wysokie</div>
                        </div>
                        <div
                            className={`rounded-lg p-3 border ${PRIORITY_COLORS.medium}`}
                        >
                            <div className="text-2xl font-bold">
                                {alerts.summary.mediumCount}
                            </div>
                            <div className="text-sm">Średnie</div>
                        </div>
                        <div className={`rounded-lg p-3 border ${PRIORITY_COLORS.low}`}>
                            <div className="text-2xl font-bold">
                                {alerts.summary.lowCount}
                            </div>
                            <div className="text-sm">Niskie</div>
                        </div>
                    </div>
                    {alerts.summary.estimatedTotalReorderCost && (
                        <p className="text-sm text-gray-600">
                            Szacowany koszt uzupełnienia:{' '}
                            <span className="font-semibold">
                                {alerts.summary.estimatedTotalReorderCost.toFixed(2)} PLN
                            </span>
                        </p>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4">
                <div>
                    <label
                        htmlFor="filter-type"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Typ produktu
                    </label>
                    <select
                        id="filter-type"
                        value={filterType}
                        onChange={(e) =>
                            setFilterType(e.target.value as ProductType | 'all')
                        }
                        className="rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
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
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Priorytet
                    </label>
                    <select
                        id="filter-priority"
                        value={filterPriority}
                        onChange={(e) =>
                            setFilterPriority(e.target.value as StockAlertPriority | 'all')
                        }
                        className="rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
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
                <div className="space-y-6">
                    {Object.values(groupedBySupplier).map((group) => (
                        <div
                            key={group.supplierId ?? 'no-supplier'}
                            className="bg-white rounded-lg shadow overflow-hidden"
                        >
                            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-gray-800">
                                        {group.supplierName}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                        {group.suggestions.length} produktów do zamówienia
                                        {group.totalCost > 0 && (
                                            <span className="ml-2">
                                                • Szacowany koszt:{' '}
                                                <span className="font-medium">
                                                    {group.totalCost.toFixed(2)} PLN
                                                </span>
                                            </span>
                                        )}
                                    </p>
                                </div>
                                {onCreateDelivery && group.supplierId && (
                                    <button
                                        type="button"
                                        onClick={() => onCreateDelivery(group.suggestions)}
                                        className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                                    >
                                        Utwórz dostawę
                                    </button>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Produkt
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                SKU
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Stan
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Min.
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Do zamówienia
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Koszt
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Priorytet
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {group.suggestions.map((suggestion) => (
                                            <tr key={suggestion.productId} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900">
                                                        {suggestion.productName}
                                                    </div>
                                                    {suggestion.brand && (
                                                        <div className="text-sm text-gray-500">
                                                            {suggestion.brand}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {suggestion.sku ?? '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <span
                                                        className={`font-semibold ${
                                                            suggestion.currentStock === 0
                                                                ? 'text-red-600'
                                                                : 'text-yellow-600'
                                                        }`}
                                                    >
                                                        {suggestion.currentStock}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center text-gray-600">
                                                    {suggestion.minQuantity}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <span className="font-semibold text-teal-600">
                                                        {suggestion.suggestedOrderQuantity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600">
                                                    {suggestion.estimatedCost
                                                        ? `${suggestion.estimatedCost.toFixed(2)} PLN`
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-full border ${
                                                            PRIORITY_COLORS[suggestion.priority]
                                                        }`}
                                                    >
                                                        {PRIORITY_LABELS[suggestion.priority]}
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
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-green-400 mb-4"
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Brak produktów do uzupełnienia
                    </h3>
                    <p className="text-gray-500">
                        Wszystkie śledzone produkty mają wystarczający stan magazynowy.
                    </p>
                </div>
            )}
        </div>
    );
}
