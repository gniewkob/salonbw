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
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'A' }));
  });
});
