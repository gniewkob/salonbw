import { fireEvent, render, screen } from '@testing-library/react';
import FinalizationModal from '@/components/calendar/FinalizationModal';

const apiFetchMock = jest.fn();
const mutateMock = jest.fn();
const invalidateMock = jest.fn();
const useQueryMock = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ apiFetch: apiFetchMock }),
}));

jest.mock('@/components/Modal', () => ({
    __esModule: true,
    default: ({
        open,
        children,
    }: {
        open: boolean;
        children: React.ReactNode;
    }) => (open ? <div>{children}</div> : null),
}));

jest.mock('@tanstack/react-query', () => ({
    useQuery: (...args: unknown[]) => useQueryMock(...args),
    useMutation: jest.fn(() => ({
        mutate: mutateMock,
        isPending: false,
        isError: false,
    })),
    useQueryClient: jest.fn(() => ({
        invalidateQueries: invalidateMock,
    })),
}));

describe('FinalizationModal', () => {
    beforeEach(() => {
        apiFetchMock.mockReset();
        apiFetchMock.mockResolvedValue([]);
        mutateMock.mockReset();
        invalidateMock.mockReset();
        useQueryMock.mockReset();
        useQueryMock.mockReturnValue({ data: [] });
    });

    it('blocks finalization when discount exceeds service + products total', () => {
        render(
            <FinalizationModal
                open
                appointment={{
                    id: 7,
                    startTime: '2026-05-01T10:00:00.000Z',
                    status: 'in_progress',
                    service: {
                        id: 10,
                        name: 'Strzyżenie',
                        duration: 45,
                        price: 120,
                        priceType: 'fixed',
                        isActive: true,
                        onlineBooking: true,
                        sortOrder: 0,
                    },
                    client: { id: 5, name: 'Klient testowy' },
                }}
                onClose={jest.fn()}
            />,
        );

        fireEvent.change(document.querySelector('#fin-discount')!, {
            target: { value: '200' },
        });
        expect(
            screen.getByText(
                'Maksymalny rabat dla tej finalizacji to 120.00 PLN.',
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Zakończ wizytę' }),
        ).toBeDisabled();
        expect(mutateMock).not.toHaveBeenCalled();
    });

    it('submits finalize payload with cents values', () => {
        render(
            <FinalizationModal
                open
                appointment={{
                    id: 7,
                    startTime: '2026-05-01T10:00:00.000Z',
                    status: 'in_progress',
                    service: {
                        id: 10,
                        name: 'Strzyżenie',
                        duration: 45,
                        price: 120,
                        priceType: 'fixed',
                        isActive: true,
                        onlineBooking: true,
                        sortOrder: 0,
                    },
                    client: { id: 5, name: 'Klient testowy' },
                }}
                onClose={jest.fn()}
            />,
        );

        // Service price pre-fills from the price-list value (120); discount 10
        // → amount due 110. Paying 115 makes the 5 surplus an automatic tip.
        fireEvent.change(document.querySelector('#fin-discount')!, {
            target: { value: '10' },
        });
        fireEvent.change(document.querySelector('#fin-paid')!, {
            target: { value: '115' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Zakończ wizytę' }));

        expect(mutateMock).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentMethod: 'card',
                servicePriceCents: 12000,
                paidAmountCents: 11500,
                tipAmountCents: 500,
                discountCents: 1000,
            }),
        );
    });

    it('strips display-only productName from recipe-prefilled usageMaterials before submit', () => {
        const recipeResult = {
            data: [
                {
                    id: 1,
                    serviceId: 10,
                    productId: 42,
                    quantity: 1,
                    unit: 'szt.',
                    product: { id: 42, name: 'SYNTHETIC Produkt 01' },
                },
            ],
        };
        const emptyResult = { data: [] };
        useQueryMock.mockImplementation((args: unknown) => {
            const { queryKey } = args as { queryKey: unknown[] };
            return queryKey[0] === 'service-recipe'
                ? recipeResult
                : emptyResult;
        });

        render(
            <FinalizationModal
                open
                appointment={{
                    id: 7,
                    startTime: '2026-05-01T10:00:00.000Z',
                    status: 'in_progress',
                    service: {
                        id: 10,
                        name: 'Strzyżenie',
                        duration: 45,
                        price: 120,
                        priceType: 'fixed',
                        isActive: true,
                        onlineBooking: true,
                        sortOrder: 0,
                    },
                    client: { id: 5, name: 'Klient testowy' },
                }}
                onClose={jest.fn()}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Zakończ wizytę' }));

        expect(mutateMock).toHaveBeenCalledWith(
            expect.objectContaining({
                usageMaterials: [{ productId: 42, quantity: 1, unit: 'szt.' }],
            }),
        );
        const payload = mutateMock.mock.calls[0][0];
        expect(payload.usageMaterials[0]).not.toHaveProperty('productName');
    });

    it('blocks adding product quantity over stock', () => {
        useQueryMock.mockReturnValue({
            data: [
                {
                    id: 11,
                    name: 'Szampon',
                    unitPrice: 30,
                    stock: 1,
                    isActive: true,
                    trackStock: true,
                },
            ],
        });

        render(
            <FinalizationModal
                open
                appointment={{
                    id: 7,
                    startTime: '2026-05-01T10:00:00.000Z',
                    status: 'in_progress',
                    service: {
                        id: 10,
                        name: 'Strzyżenie',
                        duration: 45,
                        price: 120,
                        priceType: 'fixed',
                        isActive: true,
                        onlineBooking: true,
                        sortOrder: 0,
                    },
                    client: { id: 5, name: 'Klient testowy' },
                }}
                onClose={jest.fn()}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: '+ Dodaj produkt' }),
        );
        fireEvent.click(screen.getByRole('button', { name: /Szampon/ }));
        fireEvent.click(screen.getByRole('button', { name: '+' }));

        expect(
            screen.getByText('Maksymalna ilość dla Szampon to 1.'),
        ).toBeInTheDocument();
    });

    const visit = {
        id: 7,
        startTime: '2026-05-01T10:00:00.000Z',
        status: 'in_progress' as const,
        service: {
            id: 10,
            name: 'Koloryzacja',
            duration: 90,
            price: 320,
            priceType: 'fixed' as const,
            isActive: true,
            onlineBooking: true,
            sortOrder: 0,
        },
        client: { id: 5, name: 'Klient testowy' },
    };
    const stock = [
        {
            id: 11,
            name: 'Szampon regenerujący',
            productType: 'product',
            unitPrice: 89,
            stock: 10,
            unit: 'szt.',
            isActive: true,
        },
        {
            id: 12,
            name: 'Farba Koleston 7/1',
            productType: 'supply',
            unitPrice: 0.5,
            stock: 500,
            unit: 'ml',
            isActive: true,
        },
    ];

    it('does not offer a salon material for sale to the client', () => {
        useQueryMock.mockReturnValue({ data: stock });
        render(
            <FinalizationModal open appointment={visit} onClose={jest.fn()} />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: '+ Dodaj produkt' }),
        );

        expect(
            screen.getByRole('button', { name: /Szampon regenerujący/ }),
        ).toBeInTheDocument();
        // A colour tube is used up during the visit, not sold - listing it here
        // let it be billed at its per-ml price.
        expect(
            screen.queryByRole('button', { name: /Farba Koleston/ }),
        ).toBeNull();
    });

    it("records a material in the product's own unit", () => {
        useQueryMock.mockReturnValue({ data: stock });
        render(
            <FinalizationModal open appointment={visit} onClose={jest.fn()} />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: '+ Dodaj materiał' }),
        );
        fireEvent.click(screen.getByRole('button', { name: /Farba Koleston/ }));

        // Stock is kept in ml and deducted in ml; labelling it "op." made
        // 30 ml read as 30 packages in the next visit's preparation notes.
        expect(screen.getByText('ml')).toBeInTheDocument();
        expect(screen.queryByText('op.')).toBeNull();
    });
    it.each(['40', '0'])(
        'keeps a manual price %s when the catalogue arrives late',
        (manualPrice) => {
            const catalogue: { data?: { price: number } } = {};
            const empty: unknown[] = [];
            useQueryMock.mockImplementation(
                ({ queryKey }: { queryKey: unknown[] }) => ({
                    data:
                        queryKey[0] === 'service-detail'
                            ? catalogue.data
                            : empty,
                }),
            );
            const appointment = {
                id: 7,
                startTime: '2026-10-27T10:00:00Z',
                status: 'in_progress' as const,
                service: {
                    id: 12,
                    name: 'UAT',
                    duration: 25,
                    price: 0,
                    priceType: 'fixed' as const,
                    isActive: true,
                    onlineBooking: true,
                    sortOrder: 0,
                },
                client: { id: 5, name: 'UAT' },
            };
            const close = jest.fn();
            const { rerender } = render(
                <FinalizationModal
                    open
                    appointment={appointment}
                    onClose={close}
                />,
            );
            fireEvent.change(screen.getByLabelText('Cena usługi (PLN)'), {
                target: { value: manualPrice },
            });
            catalogue.data = { price: 30 };
            rerender(
                <FinalizationModal
                    open
                    appointment={appointment}
                    onClose={close}
                />,
            );
            expect(screen.getByLabelText(/Cena usługi/)).toHaveValue(
                Number(manualPrice),
            );
            fireEvent.click(
                screen.getByRole('button', { name: 'Zakończ wizytę' }),
            );
            expect(mutateMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    servicePriceCents: Number(manualPrice) * 100,
                }),
            );
            rerender(
                <FinalizationModal
                    open={false}
                    appointment={appointment}
                    onClose={close}
                />,
            );
            rerender(
                <FinalizationModal
                    open
                    appointment={appointment}
                    onClose={close}
                />,
            );
            expect(screen.getByLabelText(/Cena usługi/)).toHaveValue(30);
        },
    );
});
