import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewForm from '@/components/ReviewForm';

describe('ReviewForm', () => {
    it('validates fields', async () => {
        const onSubmit = jest.fn();
        render(<ReviewForm onSubmit={onSubmit} onCancel={() => {}} />);
        fireEvent.click(screen.getByRole('button', { name: /zapisz/i }));
        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits valid data', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        render(<ReviewForm onSubmit={onSubmit} onCancel={() => {}} />);
        fireEvent.change(screen.getByPlaceholderText('ID wizyty'), {
            target: { value: '1' },
        });
        fireEvent.change(screen.getByPlaceholderText('Ocena'), {
            target: { value: '5' },
        });
        fireEvent.click(screen.getByRole('button', { name: /zapisz/i }));
        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({
                appointmentId: 1,
                rating: 5,
                comment: '',
            }),
        );
    });
});
