import { fireEvent, render, screen } from '@testing-library/react';
import V18Select from '@/components/ui/V18Select';

const options = [
    { value: '', label: 'Wszystkie' },
    { value: '20', label: '20' },
    { value: '50', label: '50' },
];

describe('V18Select', () => {
    it('renders an accessible custom listbox and preserves the value contract', () => {
        const onChange = jest.fn();
        render(
            <V18Select
                ariaLabel="Na stronie"
                options={options}
                value="20"
                onChange={onChange}
            />,
        );

        const trigger = screen.getByRole('combobox', { name: 'Na stronie' });
        expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).toHaveTextContent('20');

        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        fireEvent.click(screen.getByRole('option', { name: '50' }));
        expect(onChange).toHaveBeenCalledWith('50');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('supports keyboard navigation and escape without changing selection', () => {
        const onChange = jest.fn();
        render(
            <V18Select
                ariaLabel="Na stronie"
                options={options}
                value="20"
                onChange={onChange}
            />,
        );

        const trigger = screen.getByRole('combobox', { name: 'Na stronie' });
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        fireEvent.keyDown(trigger, { key: 'Escape' });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(onChange).not.toHaveBeenCalled();

        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        fireEvent.keyDown(trigger, { key: 'Enter' });
        expect(onChange).toHaveBeenCalledWith('50');
    });

    it('does not expose a menu or select disabled options', () => {
        render(
            <V18Select
                ariaLabel="Grupa klientów"
                options={[{ value: '', label: 'Brak opcji', disabled: true }]}
                value=""
                onChange={jest.fn()}
            />,
        );
        expect(
            screen.getByRole('combobox', { name: 'Grupa klientów' }),
        ).toBeDisabled();
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
});
