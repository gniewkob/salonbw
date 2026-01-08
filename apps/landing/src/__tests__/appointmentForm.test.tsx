import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import AppointmentForm from '@/components/AppointmentForm';

const services = [{ id: 1, name: 'S' }];

describe('AppointmentForm', () => {
    it('shows conflict error', async () => {
        const onSubmit = jest.fn().mockRejectedValue({ status: 409 });
        render(
            <AppointmentForm
                services={services}
                onSubmit={onSubmit}
                onCancel={() => {}}
            />,
        );
        fireEvent.change(screen.getByDisplayValue('S'), {
            target: { value: '1' },
        });
        fireEvent.change(screen.getByDisplayValue(''), {
            target: { value: '2024-01-01T10:00' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => screen.getByRole('alert'));
    });
});
