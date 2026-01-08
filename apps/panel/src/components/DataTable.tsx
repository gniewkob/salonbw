import React, { useState } from 'react';

export interface Column<T> {
    header: string;
    accessor: keyof T;
}

interface Props<T> {
    data: T[];
    columns: Column<T>[];
    initialSort?: keyof T;
    renderActions?: (row: T) => React.ReactNode;
    pageSize?: number;
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
        columns.some((c) =>
            String(item[c.accessor])
                .toLowerCase()
                .includes(search.toLowerCase()),
        ),
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

    const toggleSort = (key: keyof T) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    return (
        <div>
            <input
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border p-1 mb-2"
            />
            <table className="min-w-full border">
                <thead>
                    <tr className="bg-gray-50">
                        {columns.map((col) => (
                            <th
                                key={String(col.accessor)}
                                className="p-2 text-left cursor-pointer"
                                onClick={() => toggleSort(col.accessor)}
                            >
                                {col.header}
                                {sortKey === col.accessor &&
                                    (sortDir === 'asc' ? ' ▲' : ' ▼')}
                            </th>
                        ))}
                        <th className="p-2" />
                    </tr>
                </thead>
                <tbody>
                    {paginated.map((row, i) => (
                        <tr key={i} className="border-t">
                            {columns.map((col) => (
                                <td key={String(col.accessor)} className="p-2">
                                    {String(row[col.accessor])}
                                </td>
                            ))}
                            <td className="p-2">
                                {renderActions ? renderActions(row) : null}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-2 flex items-center gap-2">
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
