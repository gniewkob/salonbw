import type { ReactNode } from 'react';

export type PanelTableColumn = {
    label?: ReactNode;
    ariaLabel?: string;
    className?: string;
};

type PanelTableProps = {
    columns: PanelTableColumn[];
    children: ReactNode;
    isEmpty?: boolean;
    emptyMessage?: ReactNode;
    className?: string;
};

export default function PanelTable({
    columns,
    children,
    isEmpty,
    emptyMessage = 'Brak danych',
    className,
}: PanelTableProps) {
    return (
        <table
            className={`table table-bordered${className ? ` ${className}` : ''}`}
        >
            <thead>
                <tr>
                    {columns.map((col, i) =>
                        col.label != null ? (
                            <th
                                key={i}
                                className={col.className}
                                aria-label={col.ariaLabel}
                            >
                                <div>{col.label}</div>
                            </th>
                        ) : (
                            <th
                                key={i}
                                className={col.className}
                                aria-label={col.ariaLabel}
                            />
                        ),
                    )}
                </tr>
            </thead>
            <tbody>
                {isEmpty ? (
                    <tr>
                        <td colSpan={columns.length}>{emptyMessage}</td>
                    </tr>
                ) : (
                    children
                )}
            </tbody>
        </table>
    );
}
