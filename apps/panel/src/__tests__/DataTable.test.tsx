import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import DataTable, { Column } from '@/components/DataTable';

type Row = { id: number; name: string; value: number };

const data: Row[] = [
    { id: 1, name: 'Alpha', value: 3 },
    { id: 2, name: 'Bravo', value: 1 },
    { id: 3, name: 'Charlie', value: 2 },
];

const columns: Column<Row>[] = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Value', accessor: 'value' },
];

function getBodyCells() {
    const rows = screen.getAllByRole('row').slice(1); // skip header
    return rows.map((r) => within(r).getAllByRole('cell'));
}

describe('DataTable', () => {
    it('paginates results', () => {
        render(<DataTable data={data} columns={columns} pageSize={2} />);
        // First page shows first 2
        let cells = getBodyCells();
        expect(cells).toHaveLength(2);
        expect(cells[0][0]).toHaveTextContent('1');
        expect(cells[1][0]).toHaveTextContent('2');

        fireEvent.click(screen.getByText('Next'));
        cells = getBodyCells();
        expect(cells).toHaveLength(1);
        expect(cells[0][0]).toHaveTextContent('3');

        fireEvent.click(screen.getByText('Prev'));
        cells = getBodyCells();
        expect(cells[0][0]).toHaveTextContent('1');
    });

    it('filters by search input', () => {
        render(<DataTable data={data} columns={columns} pageSize={10} />);
        fireEvent.change(screen.getByPlaceholderText('Search'), {
            target: { value: 'brav' },
        });
        const cells = getBodyCells();
        expect(cells).toHaveLength(1);
        expect(cells[0][1]).toHaveTextContent('Bravo');
    });

    it('sorts ascending and descending by header click', () => {
        render(
            <DataTable
                data={data}
                columns={columns}
                pageSize={10}
                initialSort={'id'}
            />,
        );
        // Click Name header to sort by name asc
        const headers = screen.getAllByRole('columnheader');
        const nameHeader = headers[1];
        fireEvent.click(nameHeader);
        let cells = getBodyCells();
        expect(cells[0][1]).toHaveTextContent('Alpha');
        expect(cells[1][1]).toHaveTextContent('Bravo');
        expect(cells[2][1]).toHaveTextContent('Charlie');

        // Click again to toggle to desc
        fireEvent.click(nameHeader);
        cells = getBodyCells();
        expect(cells[0][1]).toHaveTextContent('Charlie');
        expect(cells[2][1]).toHaveTextContent('Alpha');
    });
});
