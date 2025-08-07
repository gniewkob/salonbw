import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ContactForm from '@/components/ContactForm';
import { ToastProvider } from '@/contexts/ToastContext';

describe('ContactForm', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => ({}) }) as jest.MockedFunction<typeof fetch>;
  });

  it('posts form data', async () => {
    render(
      <ToastProvider>
        <ContactForm />
      </ToastProvider>
    );
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('Your email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Message'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL}/emails/send`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'contact@example.com',
          subject: 'Contact form',
          template: '<p>{{message}}</p>',
          data: { name: 'John', email: 'john@example.com', message: 'Hello' },
        }),
      })
    );
  });

  it('shows email validation error', async () => {
    render(
      <ToastProvider>
        <ContactForm />
      </ToastProvider>
    );
    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByPlaceholderText('Your email'), {
      target: { value: 'invalid' },
    });
    fireEvent.change(screen.getByPlaceholderText('Message'), {
      target: { value: 'Hello' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(
      await screen.findByText(/nieprawidłowy format adresu email/i)
    ).toBeInTheDocument();
  });
});
