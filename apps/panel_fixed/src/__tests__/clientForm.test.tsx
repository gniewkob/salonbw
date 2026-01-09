import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientForm from '@/components/ClientForm';

describe('ClientForm', () => {
    it('validates name', async () => {
        const onSubmit = jest.fn();
        render(<ClientForm onSubmit={onSubmit} onCancel={() => {}} />);
        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits valid data', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        render(<ClientForm onSubmit={onSubmit} onCancel={() => {}} />);
        fireEvent.change(screen.getByPlaceholderText('Name'), {
            target: { value: 'John' },
        });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({ name: 'John' }),
        );
    });
});
