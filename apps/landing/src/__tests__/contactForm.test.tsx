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
        process.env.NEXT_PUBLIC_API_URL = 'http://localhost';
    });

    it('posts form data', async () => {
        render(
            <ToastProvider>
                <ContactForm />
            </ToastProvider>,
        );
        fireEvent.change(screen.getByPlaceholderText('np. Anna Kowalska'), {
            target: { value: 'John' },
        });
        fireEvent.change(screen.getByPlaceholderText('np. anna@gmail.com'), {
            target: { value: 'john@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('W czym możemy pomóc?'), {
            target: { value: 'Hello' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Wyślij wiadomość/i }));
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
        fireEvent.change(screen.getByPlaceholderText('np. Anna Kowalska'), {
            target: { value: 'John' },
        });
        fireEvent.change(screen.getByPlaceholderText('np. anna@gmail.com'), {
            target: { value: 'invalid' },
        });
        fireEvent.change(screen.getByPlaceholderText('W czym możemy pomóc?'), {
            target: { value: 'Hello' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Wyślij wiadomość/i }));
        expect(
            await screen.findByText(/nieprawidłowy format adresu email/i),
        ).toBeInTheDocument();
    });
});
