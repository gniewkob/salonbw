import React, { useState } from 'react';

export interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    sortKey?: keyof T;
}

interface Props<T> {
    data: T[];
    columns: Column<T>[];
    initialSort?: keyof T;
    renderActions?: (row: T) => React.ReactNode;
    pageSize?: number;
}

function getCellValue<T>(
    row: T,
    accessor: Column<T>['accessor'],
): React.ReactNode {
    if (typeof accessor === 'function') return accessor(row);
    return String(row[accessor] ?? '');
}

export default function DataTable<T>({
    data,
    columns,
    initialSort,
    renderActions,
    pageSize = 10,
}: Props<T>) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<keyof T | undefined>(initialSort);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(0);

    const filtered = data.filter((item) =>
        columns.some((c) => {
            const val = getCellValue(item, c.accessor);
            return String(val ?? '')
                .toLowerCase()
                .includes(search.toLowerCase());
        }),
    );

    const sorted = sortKey
        ? [...filtered].sort((a, b) => {
              const av = a[sortKey];
              const bv = b[sortKey];
              if (av === bv) return 0;
              if (sortDir === 'asc') return av > bv ? 1 : -1;
              return av < bv ? 1 : -1;
          })
        : filtered;

    const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(sorted.length / pageSize);

    const toggleSort = (col: Column<T>) => {
        const key =
            col.sortKey ??
            (typeof col.accessor !== 'function' ? col.accessor : undefined);
        if (!key) return;
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const colKey = (col: Column<T>) =>
        col.sortKey
            ? String(col.sortKey)
            : typeof col.accessor === 'function'
              ? col.header
              : String(col.accessor);

    return (
        <div>
            <label htmlFor="datatable-search" className="visually-hidden">
                Szukaj w tabeli
            </label>
            <input
                id="datatable-search"
                placeholder="Szukaj"
                aria-label="Szukaj w tabeli"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border p-1 mb-2"
            />
            <table className="w-100 border">
                <thead>
                    <tr className="bg-light">
                        {columns.map((col) => {
                            const sortable =
                                col.sortKey ||
                                typeof col.accessor !== 'function';
                            const activeKey =
                                col.sortKey ??
                                (typeof col.accessor !== 'function'
                                    ? col.accessor
                                    : undefined);
                            const isActive = activeKey && sortKey === activeKey;
                            return (
                                <th
                                    key={colKey(col)}
                                    className="p-2 text-start"
                                    style={
                                        sortable
                                            ? { cursor: 'pointer' }
                                            : undefined
                                    }
                                    onClick={
                                        sortable
                                            ? () => toggleSort(col)
                                            : undefined
                                    }
                                    aria-sort={
                                        isActive
                                            ? sortDir === 'asc'
                                                ? 'ascending'
                                                : 'descending'
                                            : undefined
                                    }
                                    scope="col"
                                >
                                    {col.header}
                                    {isActive &&
                                        (sortDir === 'asc' ? ' ▲' : ' ▼')}
                                </th>
                            );
                        })}
                        <th className="p-2" scope="col" />
                    </tr>
                </thead>
                <tbody>
                    {paginated.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length + 1}
                                className="text-center py-4 text-muted"
                            >
                                Brak danych do wyświetlenia
                            </td>
                        </tr>
                    ) : (
                        paginated.map((row, i) => (
                            <tr key={i} className="border-top">
                                {columns.map((col) => (
                                    <td key={colKey(col)} className="p-2">
                                        {getCellValue(row, col.accessor)}
                                    </td>
                                ))}
                                <td className="p-2">
                                    {renderActions ? renderActions(row) : null}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            <div className="mt-2 d-flex align-items-center gap-2">
                <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(p - 1, 0))}
                    className="border px-2 py-1"
                    aria-label="Poprzednia strona"
                >
                    ‹
                </button>
                <span>
                    {page + 1} / {totalPages || 1}
                </span>
                <button
                    type="button"
                    disabled={page + 1 >= totalPages}
                    onClick={() =>
                        setPage((p) => Math.min(p + 1, totalPages - 1))
                    }
                    className="border px-2 py-1"
                    aria-label="Następna strona"
                >
                    ›
                </button>
            </div>
        </div>
    );
}
