import { render, screen } from '@testing-library/react';
import React from 'react';
import CustomerCommunicationTab from '@/components/customers/CustomerCommunicationTab';
import CustomerHistoryTab from '@/components/customers/CustomerHistoryTab';
import CustomerGalleryTab from '@/components/customers/CustomerGalleryTab';
import CustomerFilesTab from '@/components/customers/CustomerFilesTab';
import CustomerErrorBoundary from '@/components/customers/CustomerErrorBoundary';

jest.mock('@/hooks/useSms', () => ({
    useSmsHistory: jest.fn(() => ({
        loading: false,
        error: null,
        data: { items: null },
    })),
}));

jest.mock('@/hooks/useEmails', () => ({
    useEmailHistory: jest.fn(() => ({
        loading: false,
        error: null,
        data: { items: undefined },
    })),
}));

jest.mock('@/hooks/useCustomers', () => ({
    useCustomerEventHistory: jest.fn(() => ({
        isLoading: false,
        error: null,
        data: {
            items: null,
            counts: {
                all: 0,
                upcoming: 0,
                completed: 0,
                cancelled: 0,
                no_show: 0,
            },
            total: 0,
            limit: 20,
            offset: 0,
        },
    })),
}));

jest.mock('@/hooks/useCustomerMedia', () => ({
    getBrowserApiBase: jest.fn(() => '/api'),
    useCustomerGallery: jest.fn(() => ({
        data: null,
        isLoading: false,
        error: null,
    })),
    useDeleteCustomerGalleryImage: jest.fn(() => ({
        isPending: false,
        mutateAsync: jest.fn(),
    })),
    useUploadCustomerGalleryImage: jest.fn(() => ({
        isPending: false,
        mutateAsync: jest.fn(),
    })),
    useCustomerFiles: jest.fn(() => ({
        data: null,
        isLoading: false,
        error: null,
    })),
    useDeleteCustomerFile: jest.fn(() => ({
        isPending: false,
        mutateAsync: jest.fn(),
    })),
    useUploadCustomerFile: jest.fn(() => ({
        isPending: false,
        mutateAsync: jest.fn(),
    })),
}));

describe('customers crash guards', () => {
    it('renders communication tab when history payload shape is invalid', () => {
        render(
            <CustomerCommunicationTab
                customer={{
                    id: 1,
                    name: 'Jan Kowalski',
                    email: 'jan@example.com',
                    phone: '111222333',
                    smsConsent: true,
                    emailConsent: true,
                    gdprConsent: true,
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                }}
            />,
        );

        expect(screen.getByText('Historia komunikacji')).toBeInTheDocument();
        expect(
            screen.getByText('Brak wysłanych SMS do tego klienta.'),
        ).toBeInTheDocument();
    });

    it('renders history tab empty state when event list is invalid', () => {
        render(<CustomerHistoryTab customerId={1} />);

        expect(screen.getByText('Brak historii wizyt.')).toBeInTheDocument();
    });

    it('renders gallery and files empty states for malformed media payload', () => {
        render(<CustomerGalleryTab customerId={1} />);
        expect(
            screen.getByText('Brak zdjęć w galerii klienta.'),
        ).toBeInTheDocument();

        render(<CustomerFilesTab customerId={1} />);
        expect(
            screen.getByText('Brak dokumentów klienta.'),
        ).toBeInTheDocument();
    });

    it('shows fallback when child throws inside customer error boundary', () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        const Throwing = () => {
            throw new Error('boom');
        };

        render(
            <CustomerErrorBoundary fallback={<div>fallback ok</div>}>
                <Throwing />
            </CustomerErrorBoundary>,
        );

        expect(screen.getByText('fallback ok')).toBeInTheDocument();
        consoleErrorSpy.mockRestore();
    });
});
