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
            <input
                placeholder="Search"
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
                                >
                                    {col.header}
                                    {activeKey &&
                                        sortKey === activeKey &&
                                        (sortDir === 'asc' ? ' ▲' : ' ▼')}
                                </th>
                            );
                        })}
                        <th className="p-2" />
                    </tr>
                </thead>
                <tbody>
                    {paginated.map((row, i) => (
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
                    ))}
                </tbody>
            </table>
            <div className="mt-2 d-flex align-items-center gap-2">
                <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(p - 1, 0))}
                    className="border px-2 py-1"
                >
                    Prev
                </button>
                <span>
                    {page + 1} / {totalPages || 1}
                </span>
                <button
                    disabled={page + 1 >= totalPages}
                    onClick={() =>
                        setPage((p) => Math.min(p + 1, totalPages - 1))
                    }
                    className="border px-2 py-1"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
