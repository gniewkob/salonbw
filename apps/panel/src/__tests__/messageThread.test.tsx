import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
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

    describe('automatic refresh', () => {
        it('shows a new reply without reopening the appointment', async () => {
            jest.useFakeTimers();
            try {
                let requestCount = 0;
                const apiFetch = jest.fn(async () => {
                    requestCount += 1;
                    return requestCount === 1 ? [] : [MSG_STAFF];
                });
                setupClient(apiFetch);

                await act(async () => {
                    await Promise.resolve();
                });
                expect(
                    screen.getByText('Brak wiadomości. Napisz pierwszą.'),
                ).toBeInTheDocument();

                await act(async () => {
                    jest.advanceTimersByTime(15_000);
                    await Promise.resolve();
                });

                expect(
                    screen.getByText('Czekamy na Ciebie jutro o 10:00.'),
                ).toBeInTheDocument();
            } finally {
                jest.useRealTimers();
            }
        });

        it('ignores a late response from the previously selected appointment', async () => {
            let resolvePrevious!: (messages: Msg[]) => void;
            const previousResponse = new Promise<Msg[]>((resolve) => {
                resolvePrevious = resolve;
            });
            const currentMessage: Msg = {
                ...MSG_STAFF,
                id: 3,
                appointmentId: 11,
                body: 'Wiadomość z aktualnie otwartej wizyty.',
            };
            const apiFetch = jest.fn(async (path: string) => {
                if (path === '/appointments/10/messages')
                    return previousResponse;
                if (path === '/appointments/11/messages')
                    return [currentMessage];
                throw new Error(`unexpected ${path}`);
            });
            mockedUseAuth.mockReturnValue(
                createAuthValue({
                    role: 'client',
                    isAuthenticated: true,
                    apiFetch: apiFetch as never,
                }),
            );
            const { rerender } = render(<MessageThread appointmentId={10} />);

            rerender(<MessageThread appointmentId={11} />);
            expect(
                await screen.findByText(
                    'Wiadomość z aktualnie otwartej wizyty.',
                ),
            ).toBeInTheDocument();

            await act(async () => {
                resolvePrevious([MSG_STAFF]);
                await previousResponse;
            });

            expect(
                screen.getByText('Wiadomość z aktualnie otwartej wizyty.'),
            ).toBeInTheDocument();
            expect(
                screen.queryByText('Czekamy na Ciebie jutro o 10:00.'),
            ).not.toBeInTheDocument();
        });

        it('does not carry a draft into a different appointment thread', async () => {
            const apiFetch = jest.fn(async () => []);
            mockedUseAuth.mockReturnValue(
                createAuthValue({
                    role: 'client',
                    isAuthenticated: true,
                    apiFetch: apiFetch as never,
                }),
            );
            const { rerender } = render(<MessageThread appointmentId={10} />);
            await screen.findByText('Brak wiadomości. Napisz pierwszą.');

            fireEvent.change(screen.getByRole('textbox'), {
                target: { value: 'Szkic dotyczący pierwszej wizyty' },
            });
            rerender(<MessageThread appointmentId={11} />);

            await waitFor(() => {
                expect(screen.getByRole('textbox')).toHaveValue('');
            });
        });

        it('does not let a late send result clear the next appointment draft', async () => {
            let resolvePreviousSend!: () => void;
            const previousSend = new Promise<void>((resolve) => {
                resolvePreviousSend = resolve;
            });
            const apiFetch = jest.fn(
                async (path: string, init?: RequestInit) => {
                    if (!init?.method) return [];
                    if (
                        path === '/appointments/10/messages' &&
                        init.method === 'POST'
                    ) {
                        return previousSend;
                    }
                    throw new Error(`unexpected ${path}`);
                },
            );
            mockedUseAuth.mockReturnValue(
                createAuthValue({
                    role: 'client',
                    isAuthenticated: true,
                    apiFetch: apiFetch as never,
                }),
            );
            const { rerender } = render(<MessageThread appointmentId={10} />);
            await screen.findByText('Brak wiadomości. Napisz pierwszą.');

            fireEvent.change(screen.getByRole('textbox'), {
                target: { value: 'Wiadomość do pierwszej wizyty' },
            });
            fireEvent.click(screen.getByRole('button', { name: 'Wyślij' }));
            rerender(<MessageThread appointmentId={11} />);
            await waitFor(() =>
                expect(screen.getByRole('textbox')).not.toBeDisabled(),
            );
            fireEvent.change(screen.getByRole('textbox'), {
                target: { value: 'Nowy szkic do drugiej wizyty' },
            });

            await act(async () => {
                resolvePreviousSend();
                await previousSend;
            });

            expect(screen.getByRole('textbox')).toHaveValue(
                'Nowy szkic do drugiej wizyty',
            );
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

        it('keeps focus in the textarea after a failed send too (Z10d), so the draft is ready to retry', async () => {
            const apiFetch = jest.fn(
                async (path: string, init?: RequestInit) => {
                    if (path === '/appointments/10/messages' && !init?.method)
                        return [];
                    if (
                        path === '/appointments/10/messages' &&
                        init?.method === 'POST'
                    ) {
                        throw new Error('network down');
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
                expect(stableToast.error).toHaveBeenCalled();
            });
            // The failed draft stays in the field (nothing was cleared) and
            // focus returns to it — before this fix it stayed disabled
            // just long enough that .focus() silently no-op'd, same class
            // of bug as the success-path fix in Z9.
            expect(textarea.value).toBe('Hej, pytanie o wizytę.');
            expect(textarea).toHaveFocus();
        });
    });

    describe('auto-scroll on load vs. on new activity (Z10c)', () => {
        it('does not auto-scroll on the initial load, even with existing messages', async () => {
            const apiFetch = jest.fn(async () => [MSG_STAFF, MSG_CLIENT]);
            setupClient(apiFetch);

            await screen.findByText('Salon');

            expect(
                window.HTMLElement.prototype.scrollIntoView,
            ).not.toHaveBeenCalled();
        });

        it('scrolls after sending the first message into an initially-empty thread', async () => {
            let sent = false;
            const apiFetch = jest.fn(
                async (path: string, init?: RequestInit) => {
                    if (path === '/appointments/10/messages' && !init?.method)
                        return sent ? [MSG_CLIENT] : [];
                    if (
                        path === '/appointments/10/messages' &&
                        init?.method === 'POST'
                    ) {
                        sent = true;
                        return { id: 2 };
                    }
                    throw new Error(
                        `unexpected ${path} ${init?.method ?? 'GET'}`,
                    );
                },
            );
            setupClient(apiFetch);

            await screen.findByText('Brak wiadomości. Napisz pierwszą.');

            fireEvent.change(screen.getByRole('textbox'), {
                target: { value: 'Dzień dobry!' },
            });
            fireEvent.click(screen.getByRole('button', { name: 'Wyślij' }));

            // The first-load skip must be consumed by the initial (empty)
            // load — NOT by the post-send reload, which is the user's own
            // new message arriving and should scroll.
            await waitFor(() => {
                expect(
                    window.HTMLElement.prototype.scrollIntoView,
                ).toHaveBeenCalled();
            });
        });

        it('auto-scrolls to the bottom after sending a new message', async () => {
            const apiFetch = jest.fn(
                async (path: string, init?: RequestInit) => {
                    if (path === '/appointments/10/messages' && !init?.method)
                        return [MSG_STAFF];
                    if (
                        path === '/appointments/10/messages' &&
                        init?.method === 'POST'
                    ) {
                        return { id: 3 };
                    }
                    throw new Error(
                        `unexpected ${path} ${init?.method ?? 'GET'}`,
                    );
                },
            );
            setupClient(apiFetch);

            await screen.findByText('Salon');
            expect(
                window.HTMLElement.prototype.scrollIntoView,
            ).not.toHaveBeenCalled();

            fireEvent.change(screen.getByRole('textbox'), {
                target: { value: 'Dzięki, będę!' },
            });
            fireEvent.click(screen.getByRole('button', { name: 'Wyślij' }));

            await waitFor(() => {
                expect(
                    window.HTMLElement.prototype.scrollIntoView,
                ).toHaveBeenCalled();
            });
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
