import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ContactForm from '@/components/ContactForm';
import { ToastProvider } from '@/contexts/ToastContext';

describe('ContactForm', () => {
    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => ({}),
        }) as jest.MockedFunction<typeof fetch>;
    });

    it('posts form data', async () => {
        render(
            <ToastProvider>
                <ContactForm />
            </ToastProvider>,
        );
        fireEvent.change(screen.getByPlaceholderText('Imię i nazwisko'), {
            target: { value: 'John' },
        });
        fireEvent.change(screen.getByPlaceholderText('Adres email'), {
            target: { value: 'john@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Wiadomość'), {
            target: { value: 'Hello' },
        });
        fireEvent.click(screen.getByRole('button', { name: /wyślij/i }));
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        expect(global.fetch).toHaveBeenCalledWith(
            `${process.env.NEXT_PUBLIC_API_URL}/emails/contact`,
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'John',
                    replyTo: 'john@example.com',
                    message: 'Hello',
                }),
            }),
        );
    });

    it('shows email validation error', async () => {
        render(
            <ToastProvider>
                <ContactForm />
            </ToastProvider>,
        );
        fireEvent.change(screen.getByPlaceholderText('Imię i nazwisko'), {
            target: { value: 'John' },
        });
        fireEvent.change(screen.getByPlaceholderText('Adres email'), {
            target: { value: 'invalid' },
        });
        fireEvent.change(screen.getByPlaceholderText('Wiadomość'), {
            target: { value: 'Hello' },
        });
        fireEvent.click(screen.getByRole('button', { name: /wyślij/i }));
        expect(
            await screen.findByText(/nieprawidłowy format adresu email/i),
        ).toBeInTheDocument();
    });
});
