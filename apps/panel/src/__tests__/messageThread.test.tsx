import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import MessageThread, {
    type MessageThreadHandle,
} from '@/components/messages/MessageThread';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');

// ToastContext is loaded lazily — provide a synchronous stub for tests.
// Must return STABLE references; new jest.fn() per call breaks useCallback deps.
const stableToast = { success: jest.fn(), error: jest.fn() };
jest.mock('@/contexts/ToastContext', () => ({
    useToast: () => stableToast,
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

interface Msg {
    id: number;
    appointmentId: number;
    authorId: number | null;
    authorRole: 'client' | 'employee' | 'receptionist' | 'admin';
    body: string;
    createdAt: string;
}

const MSG_STAFF: Msg = {
    id: 1,
    appointmentId: 10,
    authorId: 2,
    authorRole: 'admin',
    body: 'Czekamy na Ciebie jutro o 10:00.',
    createdAt: '2026-06-30T09:00:00.000Z',
};
const MSG_CLIENT: Msg = {
    id: 2,
    appointmentId: 10,
    authorId: 5,
    authorRole: 'client',
    body: 'Dziękuję, będę o czasie!',
    createdAt: '2026-06-30T09:05:00.000Z',
};

function setupClient(apiFetch: jest.Mock) {
    mockedUseAuth.mockReturnValue(
        createAuthValue({
            role: 'client',
            isAuthenticated: true,
            apiFetch: apiFetch as never,
        }),
    );
    return render(<MessageThread appointmentId={10} />);
}

function setupStaff(apiFetch: jest.Mock) {
    mockedUseAuth.mockReturnValue(
        createAuthValue({
            role: 'admin',
            isAuthenticated: true,
            apiFetch: apiFetch as never,
        }),
    );
    return render(<MessageThread appointmentId={10} />);
}

describe('MessageThread', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('rendering messages — client view', () => {
        it('shows "Ty" label for own (client) message and "Salon" for staff', async () => {
            const apiFetch = jest.fn(async (path: string) => {
                if (path === '/appointments/10/messages')
                    return [MSG_STAFF, MSG_CLIENT];
                throw new Error(`unexpected ${path}`);
            });
            setupClient(apiFetch);

            // Staff message (admin) → "Salon" label
            expect(await screen.findByText('Salon')).toBeInTheDocument();
            expect(
                screen.getByText('Czekamy na Ciebie jutro o 10:00.'),
            ).toBeInTheDocument();

            // Client message → "Ty" label
            expect(screen.getByText('Ty')).toBeInTheDocument();
            expect(
                screen.getByText('Dziękuję, będę o czasie!'),
            ).toBeInTheDocument();
        });

        it('right-aligns own messages (--own class) and left-aligns other', async () => {
            const apiFetch = jest.fn(async () => [MSG_STAFF, MSG_CLIENT]);
            setupClient(apiFetch);

            await screen.findByText('Salon');

            const rows = document.querySelectorAll('.message-thread__row');
            expect(rows).toHaveLength(2);
            // First message is admin → other side from client perspective
            expect(rows[0].classList).toContain('message-thread__row--other');
            // Second message is client → own side
            expect(rows[1].classList).toContain('message-thread__row--own');
        });
    });

    describe('rendering messages — staff view', () => {
        it('shows "Klient" for client messages and "Salon" for own (admin)', async () => {
            const apiFetch = jest.fn(async () => [MSG_STAFF, MSG_CLIENT]);
            setupStaff(apiFetch);

            // Own message (admin)
            expect(await screen.findByText('Salon')).toBeInTheDocument();
            // Client message
            expect(screen.getByText('Klient')).toBeInTheDocument();
        });
    });

    describe('empty state', () => {
        it('shows empty-state text when no messages', async () => {
            const apiFetch = jest.fn(async () => []);
            setupClient(apiFetch);

            expect(
                await screen.findByText('Brak wiadomości. Napisz pierwszą.'),
            ).toBeInTheDocument();
        });
    });

    describe('sending a message', () => {
        it('POSTs body and refreshes the thread on submit', async () => {
            const apiFetch = jest.fn(
                async (path: string, init?: RequestInit) => {
                    if (path === '/appointments/10/messages' && !init?.method)
                        return [];
                    if (
                        path === '/appointments/10/messages' &&
                        init?.method === 'POST'
                    ) {
                        return { id: 99 };
                    }
                    throw new Error(
                        `unexpected ${path} ${init?.method ?? 'GET'}`,
                    );
                },
            );
            setupClient(apiFetch);

            await screen.findByText('Brak wiadomości. Napisz pierwszą.');

            fireEvent.change(screen.getByRole('textbox'), {
                target: { value: 'Hej, pytanie o wizytę.' },
            });
            fireEvent.click(screen.getByRole('button', { name: 'Wyślij' }));

            await waitFor(() => {
                expect(apiFetch).toHaveBeenCalledWith(
                    '/appointments/10/messages',
                    expect.objectContaining({
                        method: 'POST',
                        body: JSON.stringify({
                            body: 'Hej, pytanie o wizytę.',
                        }),
                    }),
                );
            });

            // After send, thread is reloaded: initial GET + POST + reload GET = at least 3
            await waitFor(() => {
                expect(apiFetch.mock.calls.length).toBeGreaterThanOrEqual(3);
            });
        });

        it('clears the textarea and keeps focus in it after a successful send (Z9)', async () => {
            const apiFetch = jest.fn(
                async (path: string, init?: RequestInit) => {
                    if (path === '/appointments/10/messages' && !init?.method)
                        return [];
                    if (
                        path === '/appointments/10/messages' &&
                        init?.method === 'POST'
                    ) {
                        return { id: 99 };
                    }
                    throw new Error(
                        `unexpected ${path} ${init?.method ?? 'GET'}`,
                    );
                },
            );
            setupClient(apiFetch);

            await screen.findByText('Brak wiadomości. Napisz pierwszą.');
            const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
            fireEvent.change(textarea, {
                target: { value: 'Hej, pytanie o wizytę.' },
            });
            fireEvent.click(screen.getByRole('button', { name: 'Wyślij' }));

            await waitFor(() => {
                expect(textarea.value).toBe('');
            });
            expect(textarea).toHaveFocus();
        });

        it('disables Wyślij button when textarea is empty', async () => {
            const apiFetch = jest.fn(async () => []);
            setupClient(apiFetch);

            await screen.findByText('Brak wiadomości. Napisz pierwszą.');

            const btn = screen.getByRole('button', { name: 'Wyślij' });
            expect(btn).toBeDisabled();

            fireEvent.change(screen.getByRole('textbox'), {
                target: { value: '  ' },
            });
            expect(btn).toBeDisabled();

            fireEvent.change(screen.getByRole('textbox'), {
                target: { value: 'Tekst' },
            });
            expect(btn).not.toBeDisabled();
        });
    });

    describe('focusCompose() imperative handle (Z7)', () => {
        it('focuses the compose textarea when called via ref', async () => {
            const apiFetch = jest.fn(async () => []);
            mockedUseAuth.mockReturnValue(
                createAuthValue({
                    role: 'client',
                    isAuthenticated: true,
                    apiFetch: apiFetch as never,
                }),
            );
            const ref = React.createRef<MessageThreadHandle>();
            render(<MessageThread ref={ref} appointmentId={10} />);

            await screen.findByText('Brak wiadomości. Napisz pierwszą.');
            expect(screen.getByRole('textbox')).not.toHaveFocus();

            ref.current?.focusCompose();

            expect(screen.getByRole('textbox')).toHaveFocus();
        });
    });
});
