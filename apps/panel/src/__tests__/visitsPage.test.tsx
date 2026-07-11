import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import React from 'react';
import VisitsPage from '@/pages/visits';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

const mockRouterReplace = jest.fn();
let mockRouterQuery: Record<string, string> = {};

jest.mock('next/router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: mockRouterReplace,
        query: mockRouterQuery,
    }),
}));

jest.mock('@/contexts/AuthContext');

jest.mock('@/components/RouteGuard', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/salon/SalonShell', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const FUTURE = new Date(Date.now() + 86400000).toISOString();
const PAST = new Date(Date.now() - 86400000).toISOString();
const RESCHEDULE_PREVIOUS = new Date(Date.now() + 2 * 86400000).toISOString();
const RESCHEDULE_NEW = new Date(
    Date.now() + 2 * 86400000 + 900000,
).toISOString();

const VISITS = [
    {
        id: 1,
        startTime: FUTURE,
        endTime: FUTURE,
        status: 'confirmed',
        serviceId: 2,
        serviceName: 'Strzyżenie damskie',
        employeeName: 'Aleksandra',
        clientComment: 'chca to i koniec - mąż płaci',
        onlineAddonsSummary:
            'Botox na włosy (+180 min), Botox na włosy - włosy do pasa (+180 min)',
        onlineTotalDurationMinutes: 405,
        onlineDurationNeedsVerification: true,
        review: null,
    },
    {
        id: 2,
        startTime: PAST,
        endTime: PAST,
        status: 'completed',
        serviceId: 2,
        serviceName: 'Koloryzacja',
        employeeName: 'Aleksandra',
        staffRecommendations: 'myć włosy co 3 dni',
        review: null,
    },
    {
        id: 3,
        startTime: PAST,
        endTime: PAST,
        status: 'completed',
        serviceId: 5,
        serviceName: 'Balayage',
        employeeName: 'Aleksandra',
        review: { id: 9, rating: 5, comment: 'Super!' },
    },
    {
        id: 5,
        startTime: RESCHEDULE_NEW,
        endTime: RESCHEDULE_NEW,
        reschedulePreviousStartTime: RESCHEDULE_PREVIOUS,
        reschedulePreviousEndTime: RESCHEDULE_PREVIOUS,
        status: 'rescheduled_pending',
        serviceId: 8,
        serviceName: 'Tonowanie',
        employeeName: 'Aleksandra',
        review: null,
    },
    {
        id: 4,
        startTime: PAST,
        endTime: PAST,
        status: 'cancelled',
        serviceId: 2,
        serviceName: 'Modelowanie',
        employeeName: 'Aleksandra',
        review: null,
    },
    {
        id: 6,
        startTime: PAST,
        endTime: PAST,
        status: 'confirmed',
        serviceId: 9,
        serviceName: 'Przeterminowana usługa',
        employeeName: 'Aleksandra',
        review: null,
    },
];

function setup(apiFetch: jest.Mock) {
    mockedUseAuth.mockReturnValue(
        createAuthValue({
            role: 'client',
            isAuthenticated: true,
            apiFetch: apiFetch as never,
        }),
    );
    return render(<VisitsPage />);
}

function messagesApiFetch(
    extra: (path: string, init?: RequestInit) => unknown,
) {
    return jest.fn(async (path: string, init?: RequestInit) => {
        if (path === '/dashboard/client/visits') return VISITS;
        if (/^\/appointments\/\d+\/messages$/.test(path) && !init?.method) {
            return [];
        }
        return extra(path, init);
    });
}

describe('VisitsPage', () => {
    beforeEach(() => {
        mockRouterQuery = {};
        mockRouterReplace.mockClear();
    });

    it('renders sections with visits, compact notes and existing review', async () => {
        const apiFetch = messagesApiFetch(() => {
            throw new Error('unexpected call');
        });
        setup(apiFetch);

        expect(
            await screen.findByText('Strzyżenie damskie'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: /Nadchodzące wizyty \(2\)/ }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: /Odbyte wizyty \(2\)/ }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', {
                name: /Anulowane i nieodbyte \(2\)/,
            }),
        ).toBeInTheDocument();
        // salon recommendations visible in the compact row notes
        expect(screen.getByText(/myć włosy co 3 dni/)).toBeInTheDocument();
        expect(screen.getByText('Komentarz do rezerwacji')).toBeInTheDocument();
        expect(
            screen.getByText(/chca to i koniec - mąż płaci/),
        ).toBeInTheDocument();
        expect(screen.getByText('Dodatkowe zabiegi')).toBeInTheDocument();
        expect(screen.getByText('Łączny czas')).toBeInTheDocument();
        // existing review renders read-only stars + change button
        expect(screen.getByText(/Super!/)).toBeInTheDocument();
        expect(screen.getByText('Zmień ocenę')).toBeInTheDocument();
        // no inline expand content is present until the panel is opened
        expect(
            screen.queryByRole('dialog', { name: /Tonowanie/ }),
        ).not.toBeInTheDocument();
    });

    it('does not offer future-only actions for past unresolved visits', async () => {
        const apiFetch = messagesApiFetch(() => {
            throw new Error('unexpected call');
        });
        setup(apiFetch);

        await screen.findByText('Przeterminowana usługa');
        const cancelledSection = screen
            .getByRole('heading', { name: /Anulowane i nieodbyte \(2\)/ })
            .closest('section');

        expect(cancelledSection).not.toBeNull();
        expect(
            within(cancelledSection!).getByText('Przeterminowana usługa'),
        ).toBeInTheDocument();
        expect(
            within(cancelledSection!).getByText('Nieobecność'),
        ).toBeInTheDocument();

        // Open the panel for the past-unresolved visit — the rebook action
        // is offered there, cancel/accept are not (they require canAccept/
        // canCancel which both require a future startTime).
        const pastUnresolvedRow = within(cancelledSection!)
            .getByText('Przeterminowana usługa')
            .closest('.salonbw-appointment-item')!;
        fireEvent.click(
            within(pastUnresolvedRow).getByRole('button', {
                name: 'Szczegóły',
            }),
        );
        const dialog = await screen.findByRole('dialog');
        expect(
            within(dialog).getByRole('link', { name: 'Umów ponownie' }),
        ).toBeInTheDocument();
        expect(
            within(dialog).queryByRole('button', { name: 'Anuluj' }),
        ).not.toBeInTheDocument();
    });

    it('opens the details panel from a row, shows the reschedule notice, and accepts the new time from the panel', async () => {
        const apiFetch = messagesApiFetch((path, init) => {
            if (path === '/appointments/5/accept-reschedule') return {};
            throw new Error(`unexpected ${path} ${init?.method ?? 'GET'}`);
        });
        setup(apiFetch);

        await screen.findByText('Tonowanie');
        // Compact row does not show the full reschedule comparison anymore —
        // it moved into the details panel (deliberate Z7 UX change).
        expect(
            screen.queryByText('Salon proponuje zmianę terminu'),
        ).not.toBeInTheDocument();

        const rescheduledRow = screen
            .getByRole('button', { name: 'Tonowanie' })
            .closest('.salonbw-appointment-item')!;
        fireEvent.click(
            within(rescheduledRow).getByRole('button', { name: 'Szczegóły' }),
        );

        const dialog = await screen.findByRole('dialog');
        // Focus lands on the panel heading on open.
        expect(
            within(dialog).getByRole('heading', { name: 'Tonowanie' }),
        ).toHaveFocus();
        expect(
            within(dialog).getByText('Salon proponuje zmianę terminu'),
        ).toBeInTheDocument();
        expect(within(dialog).getByText('Było')).toBeInTheDocument();
        expect(
            within(dialog).getByText('Propozycja salonu'),
        ).toBeInTheDocument();

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Akceptuj nowy termin',
            }),
        );

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith(
                '/appointments/5/accept-reschedule',
                { method: 'PATCH' },
            );
        });
    });

    it('re-anchors focus on the panel heading after accepting flips the status and unmounts the button (Z9)', async () => {
        let accepted = false;
        const apiFetch = jest.fn(async (path: string, init?: RequestInit) => {
            if (path === '/dashboard/client/visits') {
                return accepted
                    ? VISITS.map((v) =>
                          v.id === 5 ? { ...v, status: 'confirmed' } : v,
                      )
                    : VISITS;
            }
            if (/^\/appointments\/\d+\/messages$/.test(path) && !init?.method)
                return [];
            if (path === '/appointments/5/accept-reschedule') {
                accepted = true;
                return {};
            }
            throw new Error(`unexpected ${path} ${init?.method ?? 'GET'}`);
        });
        setup(apiFetch);

        await screen.findByText('Tonowanie');
        const rescheduledRow = screen
            .getByRole('button', { name: 'Tonowanie' })
            .closest('.salonbw-appointment-item')!;
        fireEvent.click(
            within(rescheduledRow).getByRole('button', { name: 'Szczegóły' }),
        );
        const dialog = await screen.findByRole('dialog');
        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Akceptuj nowy termin',
            }),
        );

        await waitFor(() => {
            expect(
                within(dialog).queryByRole('button', {
                    name: 'Akceptuj nowy termin',
                }),
            ).not.toBeInTheDocument();
        });
        expect(
            within(dialog).getByRole('heading', { name: 'Tonowanie' }),
        ).toHaveFocus();
    });

    it('cancels a visit from the panel via the confirm modal', async () => {
        const apiFetch = messagesApiFetch((path, init) => {
            if (path === '/appointments/1/cancel' && init?.method === 'PATCH')
                return {};
            throw new Error(`unexpected ${path} ${init?.method ?? 'GET'}`);
        });
        setup(apiFetch);

        await screen.findByText('Strzyżenie damskie');
        const row = screen
            .getByRole('button', { name: 'Strzyżenie damskie' })
            .closest('.salonbw-appointment-item')!;
        const detailsButton = within(row).getByRole('button', {
            name: 'Szczegóły',
        });
        fireEvent.click(detailsButton);

        const dialog = await screen.findByRole('dialog');
        fireEvent.click(within(dialog).getByRole('button', { name: 'Anuluj' }));

        const confirmDialog = await screen.findByRole('dialog', {
            name: 'Anuluj wizytę',
        });
        fireEvent.click(
            within(confirmDialog).getByRole('button', {
                name: 'Anuluj wizytę',
            }),
        );

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith('/appointments/1/cancel', {
                method: 'PATCH',
            });
        });

        // Z9: cancelling closes the details panel too — focus must land
        // back on the row's "Szczegóły" trigger, never on <body>.
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
        expect(detailsButton).toHaveFocus();
    });

    it('opens the details panel directly from a ?visitId= deep link', async () => {
        mockRouterQuery = { visitId: '2' };
        const apiFetch = messagesApiFetch(() => {
            throw new Error('unexpected call');
        });
        setup(apiFetch);

        const dialog = await screen.findByRole('dialog');
        expect(
            within(dialog).getByRole('heading', { name: 'Koloryzacja' }),
        ).toBeInTheDocument();
    });

    it('focuses the message compose textarea when "Napisz wiadomość" is clicked', async () => {
        const apiFetch = messagesApiFetch(() => {
            throw new Error('unexpected call');
        });
        setup(apiFetch);

        await screen.findByText('Strzyżenie damskie');
        const row = screen
            .getByRole('button', { name: 'Strzyżenie damskie' })
            .closest('.salonbw-appointment-item')!;
        fireEvent.click(within(row).getByRole('button', { name: 'Szczegóły' }));

        const dialog = await screen.findByRole('dialog');
        await within(dialog).findByText('Brak wiadomości. Napisz pierwszą.');
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Napisz wiadomość' }),
        );

        await waitFor(() => {
            expect(within(dialog).getByRole('textbox')).toHaveFocus();
        });
    });

    it('returns focus to the row that opened the panel once it is closed (Escape)', async () => {
        const apiFetch = messagesApiFetch(() => {
            throw new Error('unexpected call');
        });
        setup(apiFetch);

        await screen.findByText('Strzyżenie damskie');
        const row = screen
            .getByRole('button', { name: 'Strzyżenie damskie' })
            .closest('.salonbw-appointment-item')!;
        const detailsButton = within(row).getByRole('button', {
            name: 'Szczegóły',
        });
        fireEvent.click(detailsButton);

        await screen.findByRole('dialog');
        fireEvent.keyDown(document, { key: 'Escape' });

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
        expect(detailsButton).toHaveFocus();
    });

    it('submits a review for a completed visit with appointmentId + rating', async () => {
        const apiFetch = messagesApiFetch((path) => {
            if (path === '/reviews') return { id: 10 };
            throw new Error(`unexpected ${path}`);
        });
        setup(apiFetch);

        await screen.findByText('Koloryzacja');
        // one un-reviewed completed visit → exactly one rating form
        const stars = screen.getAllByRole('radio', { name: '4 gwiazdki' });
        expect(stars).toHaveLength(1);
        fireEvent.click(stars[0]);
        fireEvent.change(screen.getByLabelText('Komentarz do wizyty'), {
            target: { value: 'Bardzo miło' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Zapisz ocenę' }));

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith(
                '/reviews',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        appointmentId: 2,
                        rating: 4,
                        comment: 'Bardzo miło',
                    }),
                }),
            );
        });
    });
});
