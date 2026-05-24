import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmployeeForm from '@/components/EmployeeForm';

describe('EmployeeForm', () => {
    it('validates name', async () => {
        const onSubmit = jest.fn();
        render(<EmployeeForm onSubmit={onSubmit} onCancel={() => {}} />);
        fireEvent.click(screen.getByRole('button', { name: /zapisz/i }));
        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits valid data', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        render(<EmployeeForm onSubmit={onSubmit} onCancel={() => {}} />);
        fireEvent.change(screen.getByLabelText(/imię/i), {
            target: { value: 'A' },
        });
        fireEvent.change(screen.getByLabelText(/nazwisko/i), {
            target: { value: 'B' },
        });
        fireEvent.click(screen.getByRole('button', { name: /zapisz/i }));
        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ firstName: 'A', lastName: 'B' }),
            ),
        );
    });
});
