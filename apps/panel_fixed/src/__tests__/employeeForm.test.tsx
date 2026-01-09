import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmployeeForm from '@/components/EmployeeForm';

describe('EmployeeForm', () => {
    it('validates name', async () => {
        const onSubmit = jest.fn();
        render(<EmployeeForm onSubmit={onSubmit} onCancel={() => {}} />);
        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits valid data', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        render(<EmployeeForm onSubmit={onSubmit} onCancel={() => {}} />);
        fireEvent.change(screen.getByPlaceholderText('First name'), {
            target: { value: 'A' },
        });
        fireEvent.change(screen.getByPlaceholderText('Last name'), {
            target: { value: 'B' },
        });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({
                firstName: 'A',
                lastName: 'B',
            }),
        );
    });
});
