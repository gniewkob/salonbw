import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewForm from '@/components/ReviewForm';

describe('ReviewForm', () => {
  it('validates fields', async () => {
    const onSubmit = jest.fn();
    render(<ReviewForm onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid data', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<ReviewForm onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Appointment'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Rating'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ appointmentId: 1, rating: 5, comment: '' })
    );
  });
});
