import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SalonGlobalSearch from '@/components/salon/SalonGlobalSearch';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

const push = jest.fn();

jest.mock('next/router', () => ({
    useRouter: () => ({ push, replace: jest.fn(), query: {} }),
}));

jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const CUSTOMERS = [
    { id: 1, name: 'Anna Kowalska', phone: '600100200' },
    { id: 2, name: 'Anna Nowak', phone: '600100201' },
];

function renderSearch() {
    const apiFetch = jest.fn(async (path: string) => {
        if (path.startsWith('/customers')) return CUSTOMERS;
        if (path.startsWith('/employees/staff-options')) return [];
        if (path.startsWith('/products')) return [];
        return [];
    });

    mockedUseAuth.mockReturnValue(
        createAuthValue({
            user: { id: 9, name: 'Admin', email: 'a@a.test', role: 'admin' },
            role: 'admin',
            isAuthenticated: true,
            apiFetch: apiFetch as ReturnType<
                typeof createAuthValue
            >['apiFetch'],
        }),
    );

    render(<SalonGlobalSearch />);
    return { apiFetch };
}

describe('SalonGlobalSearch combobox ARIA', () => {
    beforeEach(() => {
        push.mockReset();
    });

    it('exposes combobox/listbox/option roles wired together', async () => {
        renderSearch();

        const input = screen.getByRole('combobox', {
            name: /szukaj klientów, pracowników i produktów/i,
        });
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).not.toHaveAttribute('aria-controls');

        fireEvent.change(input, { target: { value: 'anna' } });

        const options = await screen.findAllByRole('option');
        expect(options).toHaveLength(2);

        expect(input).toHaveAttribute('aria-expanded', 'true');
        const listbox = screen.getByRole('listbox', {
            name: /wyniki wyszukiwania/i,
        });
        expect(input.getAttribute('aria-controls')).toBe(listbox.id);

        // Options are grouped under a labelled group, not loose in the listbox.
        const group = screen.getByRole('group', { name: /klienci/i });
        expect(group).toContainElement(options[0]);

        // Options aren't separate Tab stops — the combobox pattern drives
        // selection via the input + arrow keys, not per-option focus.
        options.forEach((option) => {
            expect(option).toHaveAttribute('tabindex', '-1');
        });
    });

    it('moves aria-activedescendant and aria-selected with arrow-key navigation', async () => {
        renderSearch();

        const input = screen.getByRole('combobox');
        fireEvent.change(input, { target: { value: 'anna' } });

        const options = await screen.findAllByRole('option');
        expect(input).not.toHaveAttribute('aria-activedescendant');
        options.forEach((option) =>
            expect(option).toHaveAttribute('aria-selected', 'false'),
        );

        fireEvent.keyDown(input, { key: 'ArrowDown' });
        await waitFor(() => {
            expect(input.getAttribute('aria-activedescendant')).toBe(
                options[0].id,
            );
        });
        expect(options[0]).toHaveAttribute('aria-selected', 'true');
        expect(options[1]).toHaveAttribute('aria-selected', 'false');

        fireEvent.keyDown(input, { key: 'ArrowDown' });
        await waitFor(() => {
            expect(input.getAttribute('aria-activedescendant')).toBe(
                options[1].id,
            );
        });
        expect(options[0]).toHaveAttribute('aria-selected', 'false');
        expect(options[1]).toHaveAttribute('aria-selected', 'true');

        // Wraps back to the first option.
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        await waitFor(() => {
            expect(input.getAttribute('aria-activedescendant')).toBe(
                options[0].id,
            );
        });

        fireEvent.keyDown(input, { key: 'Enter' });
        expect(push).toHaveBeenCalledWith('/customers/1');
    });

    it('syncs the active option on hover, not only on arrow keys', async () => {
        renderSearch();

        const input = screen.getByRole('combobox');
        fireEvent.change(input, { target: { value: 'anna' } });

        const options = await screen.findAllByRole('option');
        fireEvent.mouseEnter(options[1]);

        await waitFor(() => {
            expect(input.getAttribute('aria-activedescendant')).toBe(
                options[1].id,
            );
        });
        expect(options[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('renders no options inside the listbox when there are no matches', async () => {
        const apiFetch = jest.fn(async () => []);
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                user: {
                    id: 9,
                    name: 'Admin',
                    email: 'a@a.test',
                    role: 'admin',
                },
                role: 'admin',
                isAuthenticated: true,
                apiFetch: apiFetch as ReturnType<
                    typeof createAuthValue
                >['apiFetch'],
            }),
        );

        render(<SalonGlobalSearch />);
        const input = screen.getByRole('combobox');
        fireEvent.change(input, { target: { value: 'zzz' } });

        await screen.findByText(/brak wyników dla/i);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(input).not.toHaveAttribute('aria-controls');
    });
});
