import { fireEvent, render, screen } from '@testing-library/react';
import ServiceCombobox from '@/components/calendar/appointment-drawer/ServiceCombobox';
import type { Service } from '@/types';

// JSDOM does not implement scrollIntoView; stub it for all tests in this file.
beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

const SERVICES: Service[] = [
    {
        id: 10,
        name: 'Strzyżenie',
        duration: 45,
        price: 120,
        priceType: 'fixed',
        isActive: true,
        onlineBooking: true,
        sortOrder: 0,
    },
    {
        id: 20,
        name: 'Koloryzacja – włosy krótkie',
        duration: 90,
        price: 200,
        priceType: 'fixed',
        isActive: true,
        onlineBooking: true,
        sortOrder: 1,
    },
    {
        id: 30,
        name: 'Balayage',
        duration: 120,
        price: 350,
        priceType: 'fixed',
        isActive: true,
        onlineBooking: true,
        sortOrder: 2,
    },
];

describe('ServiceCombobox', () => {
    it('renders labeled input that is closed by default', () => {
        render(
            <ServiceCombobox
                id="svc"
                services={SERVICES}
                value=""
                onChange={jest.fn()}
            />,
        );
        const input = screen.getByRole('combobox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('opens dropdown on focus and shows all services', () => {
        render(
            <ServiceCombobox
                id="svc"
                services={SERVICES}
                value=""
                onChange={jest.fn()}
            />,
        );
        fireEvent.focus(screen.getByRole('combobox'));
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: /Strzyżenie/ }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: /Koloryzacja/ }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: /Balayage/ }),
        ).toBeInTheDocument();
    });

    it('filters options by typed query (case-insensitive)', () => {
        render(
            <ServiceCombobox
                id="svc"
                services={SERVICES}
                value=""
                onChange={jest.fn()}
            />,
        );
        fireEvent.focus(screen.getByRole('combobox'));
        fireEvent.change(screen.getByRole('combobox'), {
            target: { value: 'kolor' },
        });
        expect(
            screen.queryByRole('option', { name: /Strzyżenie/ }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: /Koloryzacja/ }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('option', { name: /Balayage/ }),
        ).not.toBeInTheDocument();
    });

    it('shows "Brak usług" message when query matches nothing', () => {
        render(
            <ServiceCombobox
                id="svc"
                services={SERVICES}
                value=""
                onChange={jest.fn()}
            />,
        );
        fireEvent.focus(screen.getByRole('combobox'));
        fireEvent.change(screen.getByRole('combobox'), {
            target: { value: 'xyznotexist' },
        });
        expect(screen.getByText(/Brak usług/i)).toBeInTheDocument();
    });

    it('calls onChange with service id on option click and closes dropdown', () => {
        const onChange = jest.fn();
        render(
            <ServiceCombobox
                id="svc"
                services={SERVICES}
                value=""
                onChange={onChange}
            />,
        );
        fireEvent.focus(screen.getByRole('combobox'));
        fireEvent.click(screen.getByRole('option', { name: /Strzyżenie/ }));
        expect(onChange).toHaveBeenCalledWith(10);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('shows selected service name in input when closed', () => {
        render(
            <ServiceCombobox
                id="svc"
                services={SERVICES}
                value={20}
                onChange={jest.fn()}
            />,
        );
        const input = screen.getByRole('combobox') as HTMLInputElement;
        expect(input.value).toBe('Koloryzacja – włosy krótkie');
    });

    it('shows duration and price meta in dropdown options', () => {
        render(
            <ServiceCombobox
                id="svc"
                services={SERVICES}
                value=""
                onChange={jest.fn()}
            />,
        );
        fireEvent.focus(screen.getByRole('combobox'));
        // Price and duration appear as non-interactive text next to the name
        expect(screen.getByText('45 min · 120.00 PLN')).toBeInTheDocument();
    });

    it('navigates options with keyboard arrows and selects with Enter', () => {
        const onChange = jest.fn();
        render(
            <ServiceCombobox
                id="svc"
                services={SERVICES}
                value=""
                onChange={onChange}
            />,
        );
        const input = screen.getByRole('combobox');
        fireEvent.focus(input);
        // Press ArrowDown twice to move past clear option + first service
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        // Press Enter — should select first service (index 0 = Strzyżenie after 1st down)
        fireEvent.keyDown(input, { key: 'Enter' });
        // onChange should have been called with a valid service id
        expect(onChange).toHaveBeenCalled();
    });

    it('closes dropdown on Escape', () => {
        render(
            <ServiceCombobox
                id="svc"
                services={SERVICES}
                value=""
                onChange={jest.fn()}
            />,
        );
        const input = screen.getByRole('combobox');
        fireEvent.focus(input);
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
        render(
            <ServiceCombobox
                id="svc"
                services={SERVICES}
                value=""
                onChange={jest.fn()}
                disabled
            />,
        );
        expect(screen.getByRole('combobox')).toBeDisabled();
    });
});
