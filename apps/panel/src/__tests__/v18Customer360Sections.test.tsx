import { fireEvent, render, screen } from '@testing-library/react';
import type { Customer } from '@/types';
import V18Customer360Sections from '@/components/v18/V18Customer360Sections';

jest.mock('@/components/customers/CustomerHistoryTab', () => ({
    __esModule: true,
    default: ({ customerId }: { customerId: number }) => (
        <div data-testid="history-workflow">{customerId}</div>
    ),
}));
jest.mock('@/components/customers/CustomerStatisticsTab', () => ({
    __esModule: true,
    default: ({ customerId }: { customerId: number }) => (
        <div data-testid="statistics-workflow">{customerId}</div>
    ),
}));
jest.mock('@/components/customers/CustomerNotesTab', () => ({
    __esModule: true,
    default: ({ customerId }: { customerId: number }) => (
        <div data-testid="notes-workflow">{customerId}</div>
    ),
}));
jest.mock('@/components/customers/CustomerCommunicationTab', () => ({
    __esModule: true,
    default: ({
        customer,
        onEditConsents,
    }: {
        customer: Customer;
        onEditConsents: () => void;
    }) => (
        <button type="button" onClick={onEditConsents}>
            Edytuj zgody klienta {customer.id}
        </button>
    ),
}));
jest.mock('@/components/customers/CustomerGalleryTab', () => ({
    __esModule: true,
    default: ({ customerId }: { customerId: number }) => (
        <div data-testid="gallery-workflow">{customerId}</div>
    ),
}));
jest.mock('@/components/customers/CustomerFilesTab', () => ({
    __esModule: true,
    default: ({ customerId }: { customerId: number }) => (
        <div data-testid="files-workflow">{customerId}</div>
    ),
}));

const customer = { id: 20, name: 'Klient testowy' } as Customer;

describe('V18 customer 360 workspace', () => {
    it('keeps the appointment history inside V18 and exposes the full CRM sections', () => {
        render(
            <V18Customer360Sections
                customer={customer}
                onEditConsents={jest.fn()}
            />,
        );

        expect(screen.getByTestId('v18-customer-360')).toBeInTheDocument();
        expect(screen.getByTestId('history-workflow')).toHaveTextContent('20');
        expect(screen.getAllByRole('tab')).toHaveLength(6);
        expect(
            screen.getByRole('tab', { name: 'Historia wizyt' }),
        ).toHaveAttribute('aria-selected', 'true');
        expect(
            screen.queryByText('Otwórz pełną kartę klienta'),
        ).not.toBeInTheDocument();
    });

    it('mounts the selected CRM workflows without mixing customers', () => {
        render(
            <V18Customer360Sections
                customer={customer}
                onEditConsents={jest.fn()}
            />,
        );

        for (const [tab, testId] of [
            ['Statystyki', 'statistics-workflow'],
            ['Notatki', 'notes-workflow'],
            ['Zdjęcia', 'gallery-workflow'],
            ['Pliki', 'files-workflow'],
        ]) {
            fireEvent.click(screen.getByRole('tab', { name: tab }));
            expect(screen.getByTestId(testId)).toHaveTextContent('20');
        }
    });

    it('edits consents in the V18 modal and supports keyboard tabs', () => {
        const onEdit = jest.fn();
        render(
            <V18Customer360Sections
                customer={customer}
                onEditConsents={onEdit}
            />,
        );
        const history = screen.getByRole('tab', { name: 'Historia wizyt' });
        fireEvent.keyDown(history, { key: 'End' });
        expect(screen.getByRole('tab', { name: 'Pliki' })).toHaveAttribute(
            'aria-selected',
            'true',
        );

        fireEvent.click(screen.getByRole('tab', { name: 'Komunikacja' }));
        fireEvent.click(
            screen.getByRole('button', { name: 'Edytuj zgody klienta 20' }),
        );
        expect(onEdit).toHaveBeenCalledTimes(1);
    });
});
