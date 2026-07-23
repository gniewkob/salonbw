import { render, screen, fireEvent } from '@testing-library/react';
import WarehouseProductsPage from '@/pages/products/index';
import { useAuth } from '@/contexts/AuthContext';
import {
    useWarehouseProducts,
    useProductCategories,
} from '@/hooks/useWarehouseViews';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
jest.mock('@/hooks/useWarehouseViews');
jest.mock('@/contexts/ToastContext', () => ({
    useToast: () => ({ success: jest.fn(), error: jest.fn() }),
}));
jest.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock('next/router', () => ({
    useRouter: () => ({ query: {} }),
}));
jest.mock('@/components/warehouse/WarehouseLayout', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/components/warehouse/NewProductModal', () => ({
    __esModule: true,
    default: () => null,
}));
jest.mock('@/components/warehouse/EditProductModal', () => ({
    __esModule: true,
    default: () => null,
}));
jest.mock('@/components/ConfirmModal', () => ({
    __esModule: true,
    default: () => null,
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseWarehouseProducts = useWarehouseProducts as jest.MockedFunction<
    typeof useWarehouseProducts
>;
const mockedUseProductCategories = useProductCategories as jest.MockedFunction<
    typeof useProductCategories
>;

const makeProducts = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
        id: i + 1,
        name: `Produkt ${String(i + 1).padStart(2, '0')}`,
        stock: 1,
        unit: 'op.',
        unitPrice: 10,
        vatRate: 23,
        productType: 'product',
        sku: `SKU${i + 1}`,
        categoryId: null,
    }));

const countProductRows = () =>
    screen.getAllByRole('link', { name: /^Produkt \d+$/ }).length;

describe('WarehouseProductsPage — desktop pagination', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation((query: string) => ({
                matches: false, // desktop (not max-width:575px)
                media: query,
                onchange: null,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                addListener: jest.fn(),
                removeListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        });
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                role: 'admin',
                isAuthenticated: true,
                apiFetch: jest.fn() as never,
            }),
        );
        mockedUseProductCategories.mockReturnValue({ data: [] } as never);
    });

    it('renders only one page (20) of rows when there are more products', () => {
        mockedUseWarehouseProducts.mockReturnValue({
            data: makeProducts(25),
            isLoading: false,
        } as never);

        render(<WarehouseProductsPage />);

        expect(countProductRows()).toBe(20);
        expect(
            screen.getByText(/Pozycje od/).textContent?.replace(/\s+/g, ' '),
        ).toContain('Pozycje od 1 do 20 z 25');
    });

    it('shows the remaining rows on page 2', () => {
        mockedUseWarehouseProducts.mockReturnValue({
            data: makeProducts(25),
            isLoading: false,
        } as never);

        render(<WarehouseProductsPage />);

        fireEvent.change(
            screen.getByRole('textbox', { name: /Aktualna strona/ }),
            { target: { value: '2' } },
        );

        expect(countProductRows()).toBe(5);
        expect(screen.getByText('Produkt 25')).toBeInTheDocument();
        expect(screen.queryByText('Produkt 01')).not.toBeInTheDocument();
    });

    it('does not clobber page-1 selection when selecting across pages', () => {
        // 40 products = two full pages of 20, so page sizes are equal and a
        // size-based select-all check would false-positive across pages.
        mockedUseWarehouseProducts.mockReturnValue({
            data: makeProducts(40),
            isLoading: false,
        } as never);

        render(<WarehouseProductsPage />);

        const selectAll = () =>
            screen.getByRole('checkbox', { name: 'zaznacz wszystkie' });
        const goToPage = (n: string) =>
            fireEvent.change(
                screen.getByRole('textbox', { name: /Aktualna strona/ }),
                { target: { value: n } },
            );

        // Select every row on page 1.
        fireEvent.click(selectAll());
        expect(selectAll()).toBeChecked();

        // On page 2 the header must not appear selected — its rows are a
        // different set, even though both pages hold 20 items.
        goToPage('2');
        expect(selectAll()).not.toBeChecked();

        // Selecting page 2 must ADD to the selection, not replace page 1.
        fireEvent.click(selectAll());
        goToPage('1');
        expect(selectAll()).toBeChecked();
    });
});
